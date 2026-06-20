import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URL
);

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResult {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth service — handles registration, login, token refresh, and logout.
 * All business logic lives here; controllers are thin wrappers.
 */
export class AuthService {
  /**
   * Register a new user.
   */
  static async register(data: RegisterInput): Promise<AuthResult> {
    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM event_os_users WHERE email = $1',
      [data.email]
    );

    if (existing.rows.length > 0) {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Insert user
    const result = await pool.query(
      `INSERT INTO event_os_users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role`,
      [data.email, passwordHash, data.name]
    );

    const user: UserResponse = result.rows[0];

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    // Store refresh token hash with 7-day expiry
    await pool.query(
      `INSERT INTO event_os_refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, tokenHash]
    );

    return { user, accessToken, refreshToken };
  }

  /**
   * Login an existing user.
   */
  static async login(data: LoginInput): Promise<AuthResult> {
    // Lookup user by email
    const result = await pool.query(
      'SELECT id, email, name, role, password_hash FROM event_os_users WHERE email = $1',
      [data.email]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const dbUser = result.rows[0];

    // Compare password
    const isValid = await comparePassword(data.password, dbUser.password_hash);
    if (!isValid) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const user: UserResponse = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    // Store refresh token
    await pool.query(
      `INSERT INTO event_os_refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, tokenHash]
    );

    return { user, accessToken, refreshToken };
  }

  /**
   * Generate Google Auth URL for the Server-Driven OAuth flow.
   */
  static getGoogleAuthUrl(): string {
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
    });
  }

  /**
   * Handle Google OAuth Callback.
   *
   * Exchanges the authorization code for tokens, verifies the ID token,
   * and checks if the user already exists in the database.
   *
   * Returns a discriminated union:
   *  - { isNewUser: false, auth: AuthResult }  → existing user, fully logged in
   *  - { isNewUser: true,  profile: { email, name } } → needs registration
   */
  static async handleGoogleCallback(
    code: string
  ): Promise<
    | { isNewUser: false; auth: AuthResult }
    | { isNewUser: true; profile: { email: string; name: string } }
  > {
    // 1. Exchange code for tokens
    let payload;
    try {
      const { tokens } = await googleClient.getToken(code);

      if (!tokens.id_token) {
        throw new Error('No id_token in Google response');
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AppError(401, 'Invalid Google OAuth code', 'UNAUTHORIZED');
    }

    if (!payload || !payload.email) {
      throw new AppError(401, 'Google token missing email', 'UNAUTHORIZED');
    }

    // 2. Check if user already exists
    const result = await pool.query(
      'SELECT id, email, name, role FROM event_os_users WHERE email = $1',
      [payload.email]
    );

    if (result.rows.length === 0) {
      // New user — send them to register with pre-filled Google profile
      return {
        isNewUser: true,
        profile: {
          email: payload.email,
          name: payload.name || '',
        },
      };
    }

    // 3. Existing user — issue tokens and log them in
    const user: UserResponse = result.rows[0];

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    await pool.query(
      `INSERT INTO event_os_refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, tokenHash]
    );

    return { isNewUser: false, auth: { user, accessToken, refreshToken } };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  static async refresh(rawToken: string): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> {
    const tokenHash = hashRefreshToken(rawToken);

    const result = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
              u.email, u.name, u.role
       FROM event_os_refresh_tokens rt
       JOIN event_os_users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Invalid refresh token', 'UNAUTHORIZED');
    }

    const row = result.rows[0];

    if (row.revoked) {
      throw new AppError(401, 'Refresh token has been revoked', 'UNAUTHORIZED');
    }

    if (new Date(row.expires_at) < new Date()) {
      throw new AppError(401, 'Refresh token has expired', 'UNAUTHORIZED');
    }

    // Revoke old token (rotation)
    await pool.query(
      'UPDATE event_os_refresh_tokens SET revoked = TRUE WHERE id = $1',
      [row.id]
    );

    // Issue new tokens
    const accessToken = signAccessToken({
      userId: row.user_id,
      email: row.email,
      role: row.role,
    });

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    await pool.query(
      `INSERT INTO event_os_refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [row.user_id, newTokenHash]
    );

    const user: UserResponse = {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
    };

    return { user, accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — revokes the refresh token.
   */
  static async logout(rawToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawToken);

    await pool.query(
      'UPDATE event_os_refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
      [tokenHash]
    );
  }

  /**
   * Get current user profile by ID.
   */
  static async getProfile(userId: string): Promise<UserResponse> {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at AS "createdAt" FROM event_os_users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    return result.rows[0];
  }

  /**
   * Update user profile.
   */
  static async updateProfile(userId: string, data: { name?: string; password?: string }): Promise<UserResponse> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }

    if (data.password) {
      const passwordHash = await hashPassword(data.password);
      updates.push(`password_hash = $${paramIndex}`);
      values.push(passwordHash);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getProfile(userId);
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE event_os_users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, email, name, role, created_at AS "createdAt"`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    return result.rows[0];
  }
}

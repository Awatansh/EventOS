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

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

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
   * Google OAuth Login/Registration.
   */
  static async loginWithGoogle(idToken: string): Promise<AuthResult> {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AppError(401, 'Invalid Google token', 'UNAUTHORIZED');
    }

    if (!payload || !payload.email) {
      throw new AppError(401, 'Google token missing email', 'UNAUTHORIZED');
    }

    // Lookup user by email
    const result = await pool.query(
      'SELECT id, email, name, role FROM event_os_users WHERE email = $1',
      [payload.email]
    );

    let user: UserResponse;

    if (result.rows.length === 0) {
      throw new AppError(
        404, 
        'Google account not registered. Please complete registration.', 
        'GOOGLE_ACCOUNT_NOT_REGISTERED', 
        { email: payload.email, name: payload.name || 'Google User' }
      );
    }

    user = result.rows[0];

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
   * Google OAuth Extended Registration.
   */
  static async registerWithGoogle(data: { idToken: string; password?: string }): Promise<AuthResult> {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: data.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AppError(401, 'Invalid Google token', 'UNAUTHORIZED');
    }

    if (!payload || !payload.email) {
      throw new AppError(401, 'Google token missing email', 'UNAUTHORIZED');
    }

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id, email, name, role FROM event_os_users WHERE email = $1',
      [payload.email]
    );

    if (existing.rows.length > 0) {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    // Create a password hash if password provided, else a placeholder
    const passwordHash = data.password 
      ? await hashPassword(data.password)
      : 'oauth_placeholder_hash';

    // Register user
    const insertResult = await pool.query(
      `INSERT INTO event_os_users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role`,
      [payload.email, passwordHash, payload.name || 'Google User']
    );
    const user: UserResponse = insertResult.rows[0];

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
   * Refresh access token using a valid refresh token.
   */
  static async refresh(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
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

    return { accessToken, refreshToken: newRefreshToken };
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
}

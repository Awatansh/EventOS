import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/** Frontend origin — used for OAuth callback redirects */
const FRONTEND_URL = env.CORS_ORIGIN;

/**
 * Auth controller — thin handlers that parse requests, call service, format responses.
 */
export class AuthController {
  /**
   * POST /auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * POST /auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * GET /auth/google
   * Initiates the Google OAuth Flow
   */
  static googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const url = AuthService.getGoogleAuthUrl();
    res.status(200).json({ success: true, data: { url } });
  });

  /**
   * GET /auth/google/callback
   * Handles the Google OAuth callback.
   * - Existing user → set cookie, redirect to /events
   * - New user     → redirect to /register with pre-filled Google profile
   */
  static googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string;
    
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }

    try {
      const result = await AuthService.handleGoogleCallback(code);

      if (result.isNewUser) {
        // Redirect to register page with Google profile pre-filled
        const params = new URLSearchParams({
          googleEmail: result.profile.email,
          googleName: result.profile.name,
        });
        return res.redirect(`${FRONTEND_URL}/register?${params.toString()}`);
      }

      // Existing user — set refresh cookie and redirect to app
      res.cookie('refreshToken', result.auth.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.redirect(`${FRONTEND_URL}/events`);
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  });

  /**
   * POST /auth/refresh
   */
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.refreshToken;

    if (!rawToken) {
      throw new AppError(401, 'Refresh token is required', 'UNAUTHORIZED');
    }

    const result = await AuthService.refresh(rawToken);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * POST /auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.refreshToken;

    if (rawToken) {
      await AuthService.logout(rawToken);
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.status(204).send();
  });

  /**
   * GET /auth/me
   */
  static me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const profile = await AuthService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  });
}

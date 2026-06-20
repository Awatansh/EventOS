import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

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
   * POST /auth/google
   */
  static googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) {
      throw new AppError(400, 'Google credential token missing', 'VALIDATION_ERROR');
    }

    const result = await AuthService.loginWithGoogle(credential);

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
   * POST /auth/google/register
   */
  static googleRegister = asyncHandler(async (req: Request, res: Response) => {
    const { credential, password } = req.body;
    if (!credential) {
      throw new AppError(400, 'Google credential token missing', 'VALIDATION_ERROR');
    }

    const result = await AuthService.registerWithGoogle({ idToken: credential, password });

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

    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
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

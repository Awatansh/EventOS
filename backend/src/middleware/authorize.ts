import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Role-based authorization guard factory.
 * Returns middleware that checks if req.user has one of the allowed roles.
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN')
      );
    }

    next();
  };
};

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

/**
 * Global error handler middleware.
 * Catches all errors and returns standardized JSON error responses.
 * Never leaks stack traces in production.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // AppError — known operational error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // ZodError — validation failure
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: fieldErrors,
      },
    });
    return;
  }

  // PostgreSQL constraint violation errors
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this data already exists',
        details: null,
      },
    });
    return;
  }

  if ((err as any).code === '23514') {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'Data violates a database constraint',
        details: null,
      },
    });
    return;
  }

  // Unknown error — log and return generic message
  console.error('❌ Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      details: env.NODE_ENV === 'production' ? null : err.stack,
    },
  });
};

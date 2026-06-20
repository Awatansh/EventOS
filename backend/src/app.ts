import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import eventsRouter from './modules/events/events.router';
import bookingsRouter from './modules/bookings/bookings.router';
import adminRouter from './modules/admin/admin.router';
import newsletterRouter from './modules/newsletter/newsletter.router';

/**
 * Express application factory.
 * Exported as a function so it can be tested with Supertest without calling listen().
 */
export function createApp() {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));

  // Request parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Global rate limiter
  app.use(globalLimiter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/bookings', bookingsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/newsletter', newsletterRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
        details: null,
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

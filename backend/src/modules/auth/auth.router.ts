import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public routes with stricter rate limiting
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.get('/google', authLimiter, AuthController.googleAuth);
router.get('/google/callback', authLimiter, AuthController.googleCallback);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.put('/me', authenticate, AuthController.updateProfile);

export default router;

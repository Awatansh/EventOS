import { Router } from 'express';
import { NewsletterController } from './newsletter.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// We need an optional auth middleware if we want to extract user id for non-logged in users optionally. 
// Or we can just use a custom middleware that doesn't throw if no token.
// Actually, authenticate throws if no token. 
// Let's create an inline middleware for optional auth.
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    req.user = payload;
  } catch (err) {
    // ignore invalid tokens
  }
  next();
};

router.post('/subscribe', optionalAuth, NewsletterController.subscribe);
router.get('/status', authenticate, NewsletterController.status);

export default router;

import { Router } from 'express';
import { EventController } from './events.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public routes
router.get('/', EventController.list);
router.get('/categories', EventController.getCategories);
router.get('/:id', EventController.getById);

// Admin-only routes
router.post('/', authenticate, authorize('admin'), EventController.create);
router.patch('/:id', authenticate, authorize('admin'), EventController.update);
router.delete('/:id', authenticate, authorize('admin'), EventController.cancel);

export default router;

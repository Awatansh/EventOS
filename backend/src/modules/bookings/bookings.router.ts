import { Router } from 'express';
import { BookingController } from './bookings.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post('/', BookingController.create);
router.get('/', BookingController.list);
router.get('/:id', BookingController.getById);
router.delete('/:id', BookingController.cancel);

export default router;

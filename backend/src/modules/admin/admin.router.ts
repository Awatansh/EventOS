import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/asyncHandler';
import { AdminService } from './admin.service';

const router = Router();

/**
 * GET /api/v1/admin/stats
 * Returns dashboard statistics. Admin only.
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req, res) => {
    const stats = await AdminService.getStats();
    res.json({ success: true, data: stats });
  })
);

export default router;

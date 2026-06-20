import { Request, Response } from 'express';
import { NewsletterService } from './newsletter.service';
import { subscribeSchema } from './newsletter.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';

export class NewsletterController {
  static subscribe = asyncHandler(async (req: Request, res: Response) => {
    const { email } = subscribeSchema.parse(req.body);
    const userId = req.user?.userId;

    await NewsletterService.subscribe(email, userId);

    res.status(200).json({
      success: true,
      message: 'Subscribed successfully',
    });
  });

  static status = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');

    const status = await NewsletterService.getStatus(req.user.userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  });
}

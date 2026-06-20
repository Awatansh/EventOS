import { Request, Response } from 'express';
import { BookingService } from './bookings.service';
import {
  createBookingSchema,
  listBookingsSchema,
  cancelBookingSchema,
  bookingIdSchema,
} from './bookings.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';

/**
 * Booking controller — thin handlers for booking operations.
 */
export class BookingController {
  /**
   * POST /bookings — create a new booking.
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');

    const data = createBookingSchema.parse(req.body);
    const booking = await BookingService.createBooking(req.user.userId, data);

    res.status(201).json({
      success: true,
      data: booking,
    });
  });

  /**
   * GET /bookings — list user's bookings.
   */
  static list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');

    const params = listBookingsSchema.parse(req.query);
    const result = await BookingService.getUserBookings(req.user.userId, params);

    res.status(200).json({
      success: true,
      data: result.bookings,
      meta: result.meta,
    });
  });

  /**
   * GET /bookings/:id — get a specific booking.
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');

    const { id } = bookingIdSchema.parse(req.params);
    const booking = await BookingService.getBookingById(
      id,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: booking,
    });
  });

  /**
   * DELETE /bookings/:id — cancel a booking.
   */
  static cancel = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');

    const { id } = bookingIdSchema.parse(req.params);
    const body = cancelBookingSchema.parse(req.body || {});
    const result = await BookingService.cancelBooking(id, req.user.userId, body.reason);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

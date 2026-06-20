import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { CreateBookingInput, ListBookingsInput } from './bookings.schema';
import { emitSeatBooked, emitSeatUnlocked } from '../../socket';

/**
 * Bookings service — logic for creating, listing, and canceling bookings.
 */
export class BookingService {
  /**
   * Create a booking (transactional).
   * Ensures seats are available, updates event seat arrays, and inserts booking.
   */
  static async createBooking(userId: string, data: CreateBookingInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock the event row to prevent concurrent race conditions
      const eventResult = await client.query(
        `SELECT id, status, starts_at, available_seats, price_cents, booked_seats, is_seated
         FROM event_os_events
         WHERE id = $1 FOR UPDATE`,
        [data.eventId]
      );

      if (eventResult.rows.length === 0) {
        throw new AppError(404, 'Event not found', 'NOT_FOUND');
      }

      const event = eventResult.rows[0];

      // Validate event status and timing
      if (event.status !== 'published') {
        throw new AppError(400, 'Event is not available for booking', 'BUSINESS_RULE');
      }

      if (new Date(event.starts_at) < new Date()) {
        throw new AppError(400, 'Cannot book past events', 'BUSINESS_RULE');
      }

      const requestedSeats: string[] = data.seats;

      if (requestedSeats.length > event.available_seats) {
        throw new AppError(400, 'Not enough available seats overall', 'BUSINESS_RULE');
      }

      // 2. Validate seat availability if it's a seated event
      if (event.is_seated) {
        const bookedSeats: string[] = event.booked_seats || [];
        const alreadyBooked = requestedSeats.filter(s => bookedSeats.includes(s));
        
        if (alreadyBooked.length > 0) {
          throw new AppError(409, `Seats already booked: ${alreadyBooked.join(', ')}`, 'BUSINESS_RULE');
        }
      }

      const totalCents = event.price_cents * requestedSeats.length;

      // 3. Update event seats
      // For general admission, we still push the dummy IDs so cancel logic works generically
      await client.query(
        `UPDATE event_os_events
         SET available_seats = available_seats - $1,
             booked_seats = array_cat(booked_seats, $2::varchar[])
         WHERE id = $3`,
        [requestedSeats.length, requestedSeats, data.eventId]
      );

      // 4. Create booking record
      const bookingResult = await client.query(
        `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
         VALUES ($1, $2, $3::varchar[], $4, 'confirmed')
         RETURNING id, seats, total_cents AS "totalCents", status, booked_at AS "bookedAt"`,
        [userId, data.eventId, requestedSeats, totalCents]
      );

      await client.query('COMMIT');

      // 5. Emit socket event for real-time UI updates
      emitSeatBooked(data.eventId, requestedSeats);

      return bookingResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * List bookings for a user.
   */
  static async getUserBookings(userId: string, params: ListBookingsInput) {
    const { page, limit, status } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE b.user_id = $1';
    const values: unknown[] = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND b.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM event_os_bookings b ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const bookingsResult = await pool.query(
      `SELECT
        b.id, b.seats, b.total_cents AS "totalCents", b.status, b.booked_at AS "bookedAt", b.cancelled_at AS "cancelledAt",
        json_build_object(
          'id', e.id,
          'name', e.name,
          'venue', e.venue,
          'startsAt', e.starts_at,
          'imageUrl', e.image_url,
          'category', e.category
        ) AS event
      FROM event_os_bookings b
      JOIN event_os_events e ON b.event_id = e.id
      ${whereClause}
      ORDER BY b.booked_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      bookings: bookingsResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific booking by ID.
   */
  static async getBookingById(bookingId: string, userId: string, role?: string) {
    const query = `
      SELECT
        b.id, b.user_id, b.seats, b.total_cents AS "totalCents", b.status, b.booked_at AS "bookedAt", b.cancelled_at AS "cancelledAt",
        json_build_object(
          'id', e.id,
          'name', e.name,
          'venue', e.venue,
          'startsAt', e.starts_at,
          'imageUrl', e.image_url,
          'category', e.category
        ) AS event
      FROM event_os_bookings b
      JOIN event_os_events e ON b.event_id = e.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [bookingId]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }
    
    const booking = result.rows[0];
    if (role !== 'admin' && booking.user_id !== userId) {
      throw new AppError(403, 'Not authorized to view this booking', 'UNAUTHORIZED');
    }
    
    delete booking.user_id;
    return booking;
  }

  /**
   * Cancel a booking (transactional).
   * Restores event seats.
   */
  static async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock booking row
      const bookingResult = await client.query(
        `SELECT id, user_id, event_id, seats, status
         FROM event_os_bookings
         WHERE id = $1 FOR UPDATE`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        throw new AppError(404, 'Booking not found', 'NOT_FOUND');
      }

      const booking = bookingResult.rows[0];

      if (booking.user_id !== userId) {
        throw new AppError(403, 'Not authorized to cancel this booking', 'UNAUTHORIZED');
      }

      if (booking.status === 'cancelled') {
        throw new AppError(400, 'Booking is already cancelled', 'BUSINESS_RULE');
      }

      const seatsToRestore: string[] = booking.seats;

      // 2. Update event seats
      // Uses subquery to filter out the restored seats from the booked_seats array
      await client.query(
        `UPDATE event_os_events
         SET available_seats = available_seats + $1,
             booked_seats = ARRAY(SELECT x FROM unnest(booked_seats) x WHERE x != ALL($2::varchar[]))
         WHERE id = $3`,
        [seatsToRestore.length, seatsToRestore, booking.event_id]
      );

      // 3. Mark booking as cancelled
      const updateResult = await client.query(
        `UPDATE event_os_bookings
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancel_reason = $1
         WHERE id = $2
         RETURNING id, status, cancelled_at AS "cancelledAt"`,
        [reason || null, bookingId]
      );

      await client.query('COMMIT');

      // 4. Emit socket event
      emitSeatUnlocked(booking.event_id, seatsToRestore);

      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

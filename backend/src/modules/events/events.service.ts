import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { CreateEventInput, UpdateEventInput, ListEventsInput } from './events.schema';

/**
 * Events service — all event-related business logic.
 */
export class EventService {
  /**
   * List events with pagination, search, filters, and sorting.
   * Builds parameterized query dynamically based on provided filters.
   */
  static async listEvents(params: ListEventsInput) {
    const { page, limit, search, from, to, status, category, sort } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Status filter
    conditions.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;

    // Category filter
    if (category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    // Search filter
    if (search) {
      conditions.push(
        `(LOWER(name) LIKE $${paramIndex} OR LOWER(venue) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex})`
      );
      values.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Date range filters
    if (from) {
      conditions.push(`starts_at >= $${paramIndex}`);
      values.push(from);
      paramIndex++;
    }

    if (to) {
      conditions.push(`starts_at <= $${paramIndex}`);
      values.push(to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Determine ORDER BY
    let orderClause = 'ORDER BY starts_at ASC';
    if (sort) {
      switch (sort) {
        case 'date_desc': orderClause = 'ORDER BY starts_at DESC'; break;
        case 'price_asc': orderClause = 'ORDER BY price_cents ASC'; break;
        case 'price_desc': orderClause = 'ORDER BY price_cents DESC'; break;
        case 'availability': orderClause = 'ORDER BY available_seats DESC'; break;
        default: orderClause = 'ORDER BY starts_at ASC';
      }
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM event_os_events ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated events
    const eventsResult = await pool.query(
      `SELECT
        id, name, description, venue, starts_at AS "startsAt", ends_at AS "endsAt",
        total_seats AS "totalSeats", available_seats AS "availableSeats",
        price_cents AS "priceCents", currency, status, category,
        image_url AS "imageUrl", booked_seats AS "bookedSeats",
        is_seated AS "isSeated", seat_layout AS "seatLayout", locked_seats AS "lockedSeats",
        created_at AS "createdAt"
      FROM event_os_events
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      events: eventsResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single event by ID with full details.
   */
  static async getEventById(id: string) {
    const result = await pool.query(
      `SELECT
        id, name, description, venue,
        starts_at AS "startsAt", ends_at AS "endsAt",
        total_seats AS "totalSeats", available_seats AS "availableSeats",
        price_cents AS "priceCents", currency, status, category,
        image_url AS "imageUrl", booked_seats AS "bookedSeats",
        is_seated AS "isSeated", seat_layout AS "seatLayout", locked_seats AS "lockedSeats",
        created_by AS "createdBy", created_at AS "createdAt"
      FROM event_os_events
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Event not found', 'NOT_FOUND');
    }

    return result.rows[0];
  }

  /**
   * Create a new event (admin only).
   * Sets available_seats = totalSeats initially.
   */
  static async createEvent(data: CreateEventInput, adminUserId: string) {
    const result = await pool.query(
      `INSERT INTO event_os_events (name, description, venue, starts_at, ends_at, total_seats, available_seats, price_cents, currency, category, image_url, is_seated, seat_layout, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, name, description, venue,
         starts_at AS "startsAt", ends_at AS "endsAt",
         total_seats AS "totalSeats", available_seats AS "availableSeats",
         price_cents AS "priceCents", currency, status, category,
         image_url AS "imageUrl", booked_seats AS "bookedSeats",
         is_seated AS "isSeated", seat_layout AS "seatLayout",
         created_at AS "createdAt"`,
      [
        data.name,
        data.description || null,
        data.venue,
        data.startsAt,
        data.endsAt || null,
        data.totalSeats,
        data.priceCents,
        data.currency,
        data.category,
        data.imageUrl || null,
        data.isSeated !== undefined ? data.isSeated : true,
        data.seatLayout || null,
        adminUserId,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update an event (admin only).
   * Cannot reduce totalSeats below confirmed bookings count.
   */
  static async updateEvent(id: string, data: UpdateEventInput) {
    // Check event exists
    const existing = await pool.query('SELECT * FROM event_os_events WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError(404, 'Event not found', 'NOT_FOUND');
    }

    const event = existing.rows[0];

    // If reducing total seats, validate it doesn't go below booked seats
    if (data.totalSeats !== undefined && data.totalSeats < event.total_seats) {
      const bookedSeats = event.total_seats - event.available_seats;
      if (data.totalSeats < bookedSeats) {
        throw new AppError(
          400,
          `Cannot reduce total seats below ${bookedSeats} (already booked)`,
          'CONSTRAINT_VIOLATION'
        );
      }
    }

    // Build dynamic UPDATE query
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      venue: 'venue',
      startsAt: 'starts_at',
      endsAt: 'ends_at',
      totalSeats: 'total_seats',
      priceCents: 'price_cents',
      status: 'status',
      category: 'category',
      imageUrl: 'image_url',
      isSeated: 'is_seated',
      seatLayout: 'seat_layout',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) {
        setClauses.push(`${column} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // If totalSeats changed, update available_seats proportionally
    if (data.totalSeats !== undefined) {
      const bookedSeats = event.total_seats - event.available_seats;
      setClauses.push(`available_seats = $${paramIndex}`);
      values.push(data.totalSeats - bookedSeats);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      throw new AppError(400, 'No fields to update', 'VALIDATION_ERROR');
    }

    setClauses.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE event_os_events
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, description, venue,
         starts_at AS "startsAt", ends_at AS "endsAt",
         total_seats AS "totalSeats", available_seats AS "availableSeats",
         price_cents AS "priceCents", currency, status, category,
         image_url AS "imageUrl", booked_seats AS "bookedSeats",
         is_seated AS "isSeated", seat_layout AS "seatLayout", locked_seats AS "lockedSeats",
         created_at AS "createdAt"`,
      [...values, id]
    );

    return result.rows[0];
  }

  /**
   * Cancel an event (admin only).
   * Soft-delete: sets status to 'cancelled'.
   */
  static async cancelEvent(id: string) {
    const result = await pool.query(
      `UPDATE event_os_events
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status != 'cancelled'
       RETURNING id, status`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Event not found or already cancelled', 'NOT_FOUND');
    }

    return { message: 'Event cancelled successfully.' };
  }
}

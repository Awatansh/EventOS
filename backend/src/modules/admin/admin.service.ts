import { pool } from '../../config/db';

/**
 * Admin service — dashboard stats and admin-only queries.
 */
export class AdminService {
  /**
   * Get dashboard statistics for the admin panel.
   * Uses efficient COUNT/SUM queries.
   */
  static async getStats() {
    const [usersRes, eventsRes, bookingsRes, revenueRes, recentRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM event_os_users WHERE role = 'user'`),
      pool.query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'published') AS published,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft
      FROM event_os_events`),
      pool.query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
      FROM event_os_bookings`),
      pool.query(`SELECT COALESCE(SUM(total_cents), 0) AS total FROM event_os_bookings WHERE status = 'confirmed'`),
      pool.query(`SELECT
        b.id, b.seats, b.total_cents AS "totalCents",
        b.status, b.booked_at AS "bookedAt",
        u.name AS "userName", u.email AS "userEmail",
        e.name AS "eventName"
      FROM event_os_bookings b
      JOIN event_os_users u ON u.id = b.user_id
      JOIN event_os_events e ON e.id = b.event_id
      ORDER BY b.booked_at DESC
      LIMIT 10`),
    ]);

    return {
      users: {
        total: parseInt(usersRes.rows[0].total, 10),
      },
      events: {
        total: parseInt(eventsRes.rows[0].total, 10),
        published: parseInt(eventsRes.rows[0].published, 10),
        cancelled: parseInt(eventsRes.rows[0].cancelled, 10),
        draft: parseInt(eventsRes.rows[0].draft, 10),
      },
      bookings: {
        total: parseInt(bookingsRes.rows[0].total, 10),
        confirmed: parseInt(bookingsRes.rows[0].confirmed, 10),
        cancelled: parseInt(bookingsRes.rows[0].cancelled, 10),
      },
      revenue: {
        totalCents: parseInt(revenueRes.rows[0].total, 10),
      },
      recentBookings: recentRes.rows,
    };
  }
}

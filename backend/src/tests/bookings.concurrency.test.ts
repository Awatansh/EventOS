import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../config/db';
import { BookingService } from '../modules/bookings/bookings.service';

describe('Booking Concurrency (Row-Level Locking)', () => {
  let eventId: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    // 1. Get an active event ID
    const res = await pool.query(`SELECT id FROM event_os_events WHERE status = 'published' AND is_seated = true LIMIT 1`);
    if (res.rows.length === 0) {
      throw new Error('No published seated events found for testing.');
    }
    eventId = res.rows[0].id;

    // 2. Get two users
    const userRes = await pool.query(`SELECT id FROM event_os_users LIMIT 2`);
    if (userRes.rows.length < 2) {
      throw new Error('Not enough users found for testing.');
    }
    user1Id = userRes.rows[0].id;
    user2Id = userRes.rows[1].id;
  });

  afterAll(async () => {
    // We do not close the pool here because Vitest might run other tests
    // that share the pool, or we might need it open.
  });

  it('should prevent double-booking of exact same seats simultaneously', async () => {
    const targetSeats = ['Z98', 'Z99']; // Assuming these are rarely booked by the seeder

    // Fire requests concurrently
    const req1 = BookingService.createBooking(user1Id, { eventId, seats: targetSeats });
    const req2 = BookingService.createBooking(user2Id, { eventId, seats: targetSeats });

    const results = await Promise.allSettled([req1, req2]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    // Exactly one should succeed, and one should fail due to atomic locking
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify the failure message is the specific conflict error
    if (failures[0].status === 'rejected') {
      expect(failures[0].reason.message).toContain('Seats already booked');
      expect(failures[0].reason.statusCode).toBe(409);
    }
  });
});

import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';

export class NewsletterService {
  static async subscribe(email: string, userId?: string) {
    const client = await pool.connect();
    try {
      // Check if email already subscribed
      const existing = await client.query('SELECT id FROM event_os_newsletter_subscribers WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new AppError(400, 'Email is already subscribed', 'BUSINESS_RULE');
      }

      await client.query(
        'INSERT INTO event_os_newsletter_subscribers (email, user_id) VALUES ($1, $2)',
        [email, userId || null]
      );
      return { success: true };
    } finally {
      client.release();
    }
  }

  static async getStatus(userId: string) {
    const result = await pool.query(
      'SELECT id FROM event_os_newsletter_subscribers WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return { isSubscribed: result.rows.length > 0 };
  }
}

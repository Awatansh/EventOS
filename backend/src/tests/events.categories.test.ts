import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app';
import { pool } from '../config/db';

const app = createApp();

describe('GET /api/v1/events/categories', () => {
  beforeAll(async () => {
    // We rely on the existing seed data which should have published events.
  });

  afterAll(async () => {
    // We don't close the pool to let other tests run.
  });

  it('should return 200 and a list of unique categories', async () => {
    const res = await request(app).get('/api/v1/events/categories');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    // Check if the categories are strings
    if (res.body.data.length > 0) {
      expect(typeof res.body.data[0]).toBe('string');
    }
  });

  it('should only return categories that have published events', async () => {
    const res = await request(app).get('/api/v1/events/categories');
    expect(res.status).toBe(200);
    const categories = res.body.data;
    
    // For each category returned, there must exist at least one published event
    for (const cat of categories) {
      const dbRes = await pool.query(
        `SELECT 1 FROM event_os_events WHERE category = $1 AND status = 'published' LIMIT 1`, 
        [cat]
      );
      expect(dbRes.rowCount).toBeGreaterThan(0);
    }
  });
});

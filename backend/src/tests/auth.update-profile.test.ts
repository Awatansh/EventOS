import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app';
import { pool } from '../config/db';

const app = createApp();

describe('Auth Update Profile API (PUT /api/v1/auth/me)', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // 1. Create a test user directly in DB
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Update User',
      email: 'updateuser@example.com',
      password: 'UpdateUser@123',
    });
    
    // We login to get access token, just in case register doesn't return it
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'updateuser@example.com',
      password: 'UpdateUser@123',
    });

    userToken = loginRes.body.data.accessToken;
    userId = loginRes.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM event_os_users WHERE id = $1', [userId]);
  });

  it('should require authentication', async () => {
    const res = await request(app).put('/api/v1/auth/me').send({
      name: 'New Name'
    });
    expect(res.status).toBe(401);
  });

  it('should update name successfully', async () => {
    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Updated Name 123'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name 123');
  });

  it('should update password successfully', async () => {
    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        password: 'NewPassword@123'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify new password works by logging in
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'updateuser@example.com',
      password: 'NewPassword@123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.name).toBe('Updated Name 123');
  });

  it('should fail if no name or password provided', async () => {
    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    
    expect(res.status).toBe(400); // Validation error
  });
});

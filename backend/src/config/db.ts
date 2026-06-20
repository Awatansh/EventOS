import { Pool } from 'pg';
import { env } from './env';

const isCloudDb = env.DATABASE_URL.includes('neon.tech') || env.DATABASE_URL.includes('sslmode=require');

/**
 * PostgreSQL connection pool singleton.
 * Max 20 connections to prevent connection exhaustion.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Test database connection on startup.
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown: drain pool connections.
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('🔌 Database pool closed');
}

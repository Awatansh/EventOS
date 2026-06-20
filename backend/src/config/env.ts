import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Zod-validated environment schema.
 * App crashes on startup if any required variable is missing or malformed.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  GOOGLE_CLIENT_ID: z.string().optional().default('dummy_client_id_eventos'),
  GOOGLE_CLIENT_SECRET: z.string().optional().default('dummy_secret'),
  GOOGLE_REDIRECT_URL: z.string().url().optional().default('http://localhost:5173/api/v1/auth/google/callback'),
  SEAT_LOCK_TIMEOUT_SECONDS: z.coerce.number().default(1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

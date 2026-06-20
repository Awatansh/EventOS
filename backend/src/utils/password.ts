import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hash a plaintext password using bcrypt.
 * Cost factor comes from environment config (default 12).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

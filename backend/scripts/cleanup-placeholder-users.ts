/**
 * One-time cleanup script to remove users that were auto-created
 * with the insecure 'oauth_placeholder_hash' password during testing.
 */
import { pool } from '../src/config/db';

async function cleanup() {
  const result = await pool.query(
    `DELETE FROM event_os_users WHERE password_hash = 'oauth_placeholder_hash' RETURNING email`
  );
  console.log(`Cleaned up ${result.rowCount} placeholder user(s):`);
  result.rows.forEach((r: { email: string }) => console.log(`  - ${r.email}`));
  await pool.end();
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});

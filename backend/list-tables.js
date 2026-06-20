require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listTables() {
  try {
    const res = await pool.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`);
    console.log('Tables:', res.rows.map(r => r.tablename));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listTables();

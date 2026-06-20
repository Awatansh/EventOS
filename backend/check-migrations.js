require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkMigrations() {
  try {
    const res = await pool.query(`SELECT * FROM pgmigrations;`);
    console.log('Migrations:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkMigrations();

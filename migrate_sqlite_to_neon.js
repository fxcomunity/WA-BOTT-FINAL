// migrate_sqlite_to_neon.js – Simple migration script
// Run with: node migrate_sqlite_to_neon.js

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const sqlitePath = 'database/database.sqlite';
const db = new sqlite3.Database(sqlitePath);

const pool = new Pool({
  connectionString: process.env.NEON_URL,
});

// Example: migrate a table named "users"
const migrateTable = async (tableName) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName};`, async (err, rows) => {
      if (err) return reject(err);
      const client = await pool.connect();
      try {
        // Begin transaction
        await client.query('BEGIN');
        // Create table in Neon (basic schema copy – adjust as needed)
        const columns = Object.keys(rows[0] || {});
        const colDefs = columns.map(col => `"${col}" TEXT`).join(', ');
        await client.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${colDefs});`);
        // Insert rows
        for (const row of rows) {
          const values = columns.map(col => `$${columns.indexOf(col) + 1}`).join(', ');
          const vals = columns.map(col => row[col]);
          await client.query(`INSERT INTO ${tableName} (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${values}) ON CONFLICT DO NOTHING;`, vals);
        }
        await client.query('COMMIT');
        resolve();
      } catch (e) {
        await client.query('ROLLBACK');
        reject(e);
      } finally {
        client.release();
      }
    });
  });
};

(async () => {
  try {
    console.log('Starting migration...');
    // Add tables you want to migrate below
    await migrateTable('users'); // example table name
    console.log('Migration completed successfully.');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    db.close();
    await pool.end();
  }
})();

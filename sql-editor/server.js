const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.NEON_URL,
});

// Simple whitelist of allowed SQL commands to mitigate injection
const allowedCommands = [/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|SET|USE)\b/i];

function isAllowed(sql) {
  // Normalize USE statements to SET search_path for PostgreSQL compatibility
  sql = sql.replace(/^\s*USE\s+(\w+);?$/i, (match, db) => `SET search_path TO ${db}`);

  const trimmed = sql.trim();
  return allowedCommands.some((re) => re.test(trimmed)) && !/;/.test(trimmed);
}

app.post('/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || !isAllowed(sql)) {
    return res.status(400).json({ error: 'Invalid or disallowed SQL statement.' });
  }
  try {
    const result = await pool.query(sql);
    res.json({ rows: result.rows, fields: result.fields.map(f => f.name) });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SQL editor server listening on port ${PORT}`);
});

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const rows = await sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `;
  const tables = {};
  for (let r of rows) {
    if (!tables[r.table_name]) tables[r.table_name] = [];
    tables[r.table_name].push(r.column_name);
  }
  console.log(JSON.stringify(tables, null, 2));
}

run().catch(console.error);

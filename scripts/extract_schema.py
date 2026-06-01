import sqlite3, os, sys

# Path to the SQLite database (relative to this script)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'database.sqlite')

if not os.path.exists(DB_PATH):
    print('Database file not found:', DB_PATH, file=sys.stderr)
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
# Get all table and index creation statements (excluding internal sqlite tables)
cur.execute("SELECT sql FROM sqlite_master WHERE sql NOT NULL AND type IN ('table','index','trigger','view')")
rows = cur.fetchall()
for (sql,) in rows:
    print(sql + ';')
conn.close()

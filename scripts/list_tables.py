import sqlite3, os, json, sys

# Path to the SQLite DB relative to project root
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'database.sqlite')

if not os.path.exists(DB_PATH):
    print('Database not found at', DB_PATH, file=sys.stderr)
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Get list of tables (excluding internal sqlite tables)
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row[0] for row in cur.fetchall()]
print('Tables:', tables)

# Show columns for each table
for tbl in tables:
    cur.execute(f"PRAGMA table_info({tbl})")
    cols = [(c[1], c[2]) for c in cur.fetchall()]
    print(f'\nTable: {tbl}')
    for col_name, col_type in cols:
        print(f'  {col_name}: {col_type}')

conn.close()

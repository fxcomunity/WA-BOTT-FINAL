import sqlite3, os, sys

DB_PATH = r"C:\\Users\\annas\\Videos\\wa-bot\\database\\database.sqlite"

if not os.path.exists(DB_PATH):
    print('Database not found at', DB_PATH, file=sys.stderr)
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# List tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row[0] for row in cur.fetchall()]
print('Tables:', tables)

# Try to fetch data from possible monster and user tables
for tbl in tables:
    try:
        cur.execute(f"SELECT * FROM {tbl} LIMIT 5")
        rows = cur.fetchall()
        if rows:
            print(f"\nData from {tbl} (first 5 rows):")
            for r in rows:
                print(r)
    except Exception as e:
        # ignore tables that can't be selected
        pass

conn.close()

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Inisialisasi database SQLite
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// ==========================================
// 1. CREATE TABLES (IF NOT EXISTS)
// ==========================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    lastDaily INTEGER DEFAULT 0,
    lastMancing INTEGER DEFAULT 0,
    lastBerburu INTEGER DEFAULT 0,
    lastNambang INTEGER DEFAULT 0,
    pickaxeLevel INTEGER DEFAULT 1,
    pancinganLevel INTEGER DEFAULT 1,
    inventory TEXT DEFAULT '{}',
    enchants TEXT DEFAULT '{}'
  );
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN pancinganLevel INTEGER DEFAULT 1;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN lastBerburu INTEGER DEFAULT 0;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN inventory TEXT DEFAULT '{}';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN enchants TEXT DEFAULT '{}';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN hp INTEGER DEFAULT 100;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN maxHp INTEGER DEFAULT 100;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN buffs TEXT DEFAULT '{}';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN combat TEXT DEFAULT '{}';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN mp INTEGER DEFAULT 50;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN maxMp INTEGER DEFAULT 50;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN skills TEXT DEFAULT '{}';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN pickaxeDurability INTEGER DEFAULT 50;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN maxPickaxeDurability INTEGER DEFAULT 50;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN pancinganDurability INTEGER DEFAULT 50;");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN maxPancinganDurability INTEGER DEFAULT 50;");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS limits (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT 'Unknown',
    dl_used INTEGER DEFAULT 0,
    dl_reset INTEGER DEFAULT 0,
    ai_used INTEGER DEFAULT 0,
    ai_reset INTEGER DEFAULT 0,
    kuis_used INTEGER DEFAULT 0,
    kuis_reset INTEGER DEFAULT 0,
    st_used INTEGER DEFAULT 0,
    st_reset INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS warns (
    id TEXT PRIMARY KEY,
    warnCount INTEGER DEFAULT 0
  );
`);

// ==========================================
// 2. MIGRASI OTOMATIS DARI JSON (SEKALI SAJA)
// ==========================================

function migrateEconomy() {
  const jsonPath = path.join(__dirname, '../data_economy.json');
  if (fs.existsSync(jsonPath)) {
    console.log("[DB] Memulai migrasi data economy JSON ke SQLite...");
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const insert = db.prepare(`
        INSERT OR IGNORE INTO users (id, coins, level, xp, streak, lastDaily, lastMancing, lastBerburu, lastNambang, pickaxeLevel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const update = db.prepare(`
        UPDATE users 
        SET coins = ?, level = ?, xp = ?, streak = ?, lastDaily = ?, lastMancing = ?, lastBerburu = ?, lastNambang = ?, pickaxeLevel = ?
        WHERE id = ?
      `);

      db.transaction(() => {
        for (const [id, w] of Object.entries(data)) {
          // Coba insert, kalau udah ada update
          const info = insert.run(id, w.coins || 0, w.level || 1, w.xp || 0, w.streak || 0, w.lastDaily || 0, w.lastMancing || 0, w.lastBerburu || 0, w.lastNambang || 0, w.pickaxeLevel || 1);
          if (info.changes === 0) {
            update.run(w.coins || 0, w.level || 1, w.xp || 0, w.streak || 0, w.lastDaily || 0, w.lastMancing || 0, w.lastBerburu || 0, w.lastNambang || 0, w.pickaxeLevel || 1, id);
          }
        }
      })();
      
      // Rename file agar tidak dimigrasi berulang-ulang
      fs.renameSync(jsonPath, jsonPath + '.bak');
      console.log("[DB] Migrasi data economy berhasil! File asli diubah menjadi data_economy.json.bak");
    } catch (e) {
      console.error("[DB] Gagal bos migrasi data economy:", e);
    }
  }
}

function migrateLimits() {
  const jsonPath = path.join(__dirname, 'limit.json');
  if (fs.existsSync(jsonPath)) {
    console.log("[DB] Memulai migrasi data limit JSON ke SQLite...");
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const insert = db.prepare(`INSERT OR IGNORE INTO limits (id, name, dl_used, dl_reset, ai_used, ai_reset, kuis_used, kuis_reset, st_used, st_reset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const update = db.prepare(`UPDATE limits SET name = ?, dl_used = ?, dl_reset = ?, ai_used = ?, ai_reset = ?, kuis_used = ?, kuis_reset = ?, st_used = ?, st_reset = ? WHERE id = ?`);

      db.transaction(() => {
        for (const [id, l] of Object.entries(data)) {
          const d_used = l.download?.used || 0, d_reset = l.download?.resetAt || 0;
          const a_used = l.ai?.used || 0, a_reset = l.ai?.resetAt || 0;
          const k_used = l.kuis?.used || 0, k_reset = l.kuis?.resetAt || 0;
          const s_used = l.sticker?.used || 0, s_reset = l.sticker?.resetAt || 0;
          
          const info = insert.run(id, l.name || 'Unknown', d_used, d_reset, a_used, a_reset, k_used, k_reset, s_used, s_reset);
          if (info.changes === 0) {
            update.run(l.name || 'Unknown', d_used, d_reset, a_used, a_reset, k_used, k_reset, s_used, s_reset, id);
          }
        }
      })();
      
      fs.renameSync(jsonPath, jsonPath + '.bak');
      console.log("[DB] Migrasi data limit berhasil!");
    } catch (e) {
      console.error("[DB] Gagal bos migrasi data limit:", e);
    }
  }
}

function migrateWarns() {
  const jsonPath = path.join(__dirname, 'warn.json');
  if (fs.existsSync(jsonPath)) {
    console.log("[DB] Memulai migrasi data warn JSON ke SQLite...");
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const insert = db.prepare(`INSERT OR IGNORE INTO warns (id, warnCount) VALUES (?, ?)`);
      const update = db.prepare(`UPDATE warns SET warnCount = ? WHERE id = ?`);

      db.transaction(() => {
        for (const [id, count] of Object.entries(data)) {
          const info = insert.run(id, count || 0);
          if (info.changes === 0) {
            update.run(count || 0, id);
          }
        }
      })();
      
      fs.renameSync(jsonPath, jsonPath + '.bak');
      console.log("[DB] Migrasi data warn berhasil!");
    } catch (e) {
      console.error("[DB] Gagal bos migrasi data warn:", e);
    }
  }
}

// Jalankan migrasi saat modul dipanggil pertama kali
migrateEconomy();
migrateLimits();
migrateWarns();

module.exports = db;

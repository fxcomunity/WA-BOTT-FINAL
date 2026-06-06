// database/db.js — Hybrid Neon PostgreSQL / Local JSON database
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const localDbPath = path.join(__dirname, 'local_db.json');

let neonClient = null;
let useLocalFallback = false;
let fallbackLoaded = false;
let localData = {
  users: {},
  limits: {},
  warns: {},
  link_strikes: {}
};

// Coba buat client Neon jika ada URL
if (process.env.DATABASE_URL) {
  try {
    neonClient = neon(process.env.DATABASE_URL);
  } catch (e) {
    console.error("[DB] ❌ Gagal membuat client Neon:", e.message);
    useLocalFallback = true;
  }
} else {
  useLocalFallback = true;
}

// Load database lokal
function loadLocalDb() {
  if (fallbackLoaded) return;
  try {
    if (fs.existsSync(localDbPath)) {
      const data = fs.readFileSync(localDbPath, 'utf8');
      localData = JSON.parse(data);
      console.log(`[DB] ℹ️ Menggunakan database lokal (JSON) - ${Object.keys(localData.users || {}).length} users, ${Object.keys(localData.limits || {}).length} limits`);
      fallbackLoaded = true;
    } else {
      console.log("[DB] ⚠️ Database lokal tidak ditemukan, membuat baru...");
      saveLocalDb();
      fallbackLoaded = true;
    }
  } catch (err) {
    console.error("[DB] ❌ Gagal memuat database lokal:", err.message);
  }
}

// Simpan database lokal ke file
function saveLocalDb() {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), 'utf8');
  } catch (err) {
    console.error("[DB] ❌ Gagal menulis database lokal:", err.message);
  }
}

// Jalankan load di awal jika fallback aktif
if (useLocalFallback) {
  loadLocalDb();
}

// Parser query SQL sederhana untuk fallback lokal
function runLocalQuery(strings, values) {
  if (!useLocalFallback) {
    useLocalFallback = true;
    loadLocalDb();
  }

  const queryText = strings.join('?').trim();

  // 1. SELECT * FROM users
  if (queryText.includes('SELECT * FROM users')) {
    return Object.values(localData.users || {});
  }

  // 2. SELECT * FROM limits WHERE id = ?
  if (queryText.includes('SELECT * FROM limits WHERE id =')) {
    const id = values[0];
    const val = localData.limits[id];
    return val ? [val] : [];
  }

  // 3. SELECT "warnCount" FROM warns WHERE id = ?
  if (queryText.includes('SELECT "warnCount" FROM warns WHERE id =')) {
    const id = values[0];
    const val = localData.warns[id];
    return val ? [val] : [];
  }

  // 4. SELECT * FROM warns
  if (queryText.includes('SELECT * FROM warns')) {
    return Object.values(localData.warns || {});
  }

  // 5. SELECT "strikeCount" FROM link_strikes WHERE id = ?
  if (queryText.includes('SELECT "strikeCount" FROM link_strikes WHERE id =')) {
    const id = values[0];
    const val = localData.link_strikes[id];
    return val ? [val] : [];
  }

  // 6. DELETE FROM
  if (queryText.startsWith('DELETE FROM')) {
    const id = values[0];
    if (queryText.includes('limits')) {
      delete localData.limits[id];
    } else if (queryText.includes('warns')) {
      delete localData.warns[id];
    } else if (queryText.includes('link_strikes')) {
      delete localData.link_strikes[id];
    }
    saveLocalDb();
    return [];
  }

  // 7. UPDATE limits SET dl_used = 0, ... (global reset)
  if (queryText.includes('UPDATE limits SET dl_used = 0') && !queryText.includes('WHERE id =')) {
    for (const id in localData.limits) {
      localData.limits[id].dl_used = 0;
      localData.limits[id].ai_used = 0;
      localData.limits[id].kuis_used = 0;
      localData.limits[id].st_used = 0;
    }
    saveLocalDb();
    return [];
  }

  // 8. INSERT INTO limits
  if (queryText.startsWith('INSERT INTO limits')) {
    const id = values[0];
    if (!localData.limits[id]) {
      localData.limits[id] = {
        id: id,
        name: values[1] || 'Unknown',
        dl_used: Number(values[2]) || 0,
        dl_reset: Number(values[3]) || 0,
        ai_used: Number(values[4]) || 0,
        ai_reset: Number(values[5]) || 0,
        kuis_used: Number(values[6]) || 0,
        kuis_reset: Number(values[7]) || 0,
        st_used: Number(values[8]) || 0,
        st_reset: Number(values[9]) || 0,
        dl_max: 0,
        ai_max: 0,
        kuis_max: 0,
        st_max: 0
      };
      saveLocalDb();
    }
    return [];
  }

  // 9. INSERT INTO users
  if (queryText.startsWith('INSERT INTO users')) {
    const id = values[0];
    if (!localData.users[id]) {
      localData.users[id] = {
        id: id,
        coins: values[1],
        level: values[2],
        xp: values[3],
        streak: values[4],
        lastDaily: values[5],
        lastMancing: values[6],
        lastBerburu: values[7],
        lastNambang: values[8],
        pickaxeLevel: values[9],
        pancinganLevel: values[10],
        inventory: typeof values[11] === 'string' ? JSON.parse(values[11]) : (values[11] || {}),
        enchants: typeof values[12] === 'string' ? JSON.parse(values[12]) : (values[12] || {}),
        hp: values[13],
        maxHp: values[14],
        buffs: typeof values[15] === 'string' ? JSON.parse(values[15]) : (values[15] || {}),
        combat: typeof values[16] === 'string' ? JSON.parse(values[16]) : (values[16] || {}),
        mp: values[17],
        maxMp: values[18],
        skills: typeof values[19] === 'string' ? JSON.parse(values[19]) : (values[19] || {}),
        pickaxeDurability: values[20],
        maxPickaxeDurability: values[21],
        pancinganDurability: values[22],
        maxPancinganDurability: values[23],
        equipment: typeof values[24] === 'string' ? JSON.parse(values[24]) : (values[24] || {})
      };
      saveLocalDb();
    }
    return [];
  }

  // 10. INSERT INTO warns
  if (queryText.startsWith('INSERT INTO warns')) {
    const id = values[0];
    localData.warns[id] = {
      id: id,
      warnCount: values[1]
    };
    saveLocalDb();
    return [];
  }

  // 11. INSERT INTO link_strikes
  if (queryText.startsWith('INSERT INTO link_strikes')) {
    const id = values[0];
    localData.link_strikes[id] = {
      id: id,
      strikeCount: values[1]
    };
    saveLocalDb();
    return [];
  }

  // 12. UPDATE users
  if (queryText.startsWith('UPDATE users')) {
    const id = values[values.length - 1];
    localData.users[id] = {
      id: id,
      coins: values[0],
      level: values[1],
      xp: values[2],
      streak: values[3],
      lastDaily: values[4],
      lastMancing: values[5],
      lastBerburu: values[6],
      lastNambang: values[7],
      pickaxeLevel: values[8],
      pancinganLevel: values[9],
      inventory: typeof values[10] === 'string' ? JSON.parse(values[10]) : (values[10] || {}),
      enchants: typeof values[11] === 'string' ? JSON.parse(values[11]) : (values[11] || {}),
      hp: values[12],
      maxHp: values[13],
      buffs: typeof values[14] === 'string' ? JSON.parse(values[14]) : (values[14] || {}),
      combat: typeof values[15] === 'string' ? JSON.parse(values[15]) : (values[15] || {}),
      mp: values[16],
      maxMp: values[17],
      skills: typeof values[18] === 'string' ? JSON.parse(values[18]) : (values[18] || {}),
      pickaxeDurability: values[19],
      maxPickaxeDurability: values[20],
      pancinganDurability: values[21],
      maxPancinganDurability: values[22],
      equipment: typeof values[23] === 'string' ? JSON.parse(values[23]) : (values[23] || {})
    };
    saveLocalDb();
    return [];
  }

  // 13. UPDATE limits
  if (queryText.startsWith('UPDATE limits')) {
    const id = values[values.length - 1];
    localData.limits[id] = {
      id: id,
      name: values[0],
      dl_used: values[1],
      dl_reset: values[2],
      ai_used: values[3],
      ai_reset: values[4],
      kuis_used: values[5],
      kuis_reset: values[6],
      st_used: values[7],
      st_reset: values[8],
      dl_max: values[9],
      ai_max: values[10],
      kuis_max: values[11],
      st_max: values[12]
    };
    saveLocalDb();
    return [];
  }
  // 14. UPDATE warns
  if (queryText.startsWith('UPDATE warns')) {
    const id = values[values.length - 1];
    localData.warns[id] = {
      id: id,
      warnCount: values[0]
    };
    saveLocalDb();
    return [];
  }

  // 15. UPDATE link_strikes
  if (queryText.startsWith('UPDATE link_strikes')) {
    const id = values[values.length - 1];
    localData.link_strikes[id] = {
      id: id,
      strikeCount: values[0]
    };
    saveLocalDb();
    return [];
  }

  return [];
}

// Wrapper fungsi query sql utama
const sql = async (strings, ...values) => {
  const queryText = strings.join('?').trim();
  const isWrite = queryText.startsWith('INSERT') || queryText.startsWith('UPDATE') || queryText.startsWith('DELETE');

  if (useLocalFallback || !neonClient) {
    return runLocalQuery(strings, values);
  }
  try {
    const res = await neonClient(strings, ...values);
    if (isWrite) {
      try {
        runLocalQuery(strings, values);
      } catch (localErr) {
        console.error("[DB] Gagal sinkronisasi data ke DB lokal:", localErr.message);
      }
    }
    return res;
  } catch (err) {
    const errMsg = err.message || '';
    if (
      errMsg.includes('fetch failed') || 
      errMsg.includes('ETIMEDOUT') || 
      errMsg.includes('connect') || 
      errMsg.includes('unreachable') || 
      errMsg.includes('connection')
    ) {
      if (!useLocalFallback) {
        console.warn('[DB] ⚠️ Koneksi ke Neon PostgreSQL terhambat. Mengaktifkan fallback lokal...');
        useLocalFallback = true;
        loadLocalDb();
      }
      return runLocalQuery(strings, values);
    }
    throw err;
  }
};

// Fungsi inisialisasi tabel / pengecekan koneksi
async function initDb() {
  if (useLocalFallback || !neonClient) {
    loadLocalDb();
    return;
  }

  try {
    // Test query cepat untuk memastikan koneksi ke Neon lancar
    await neonClient`SELECT 1`;
    
    // Inisialisasi skema tabel jika belum ada
    await neonClient`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        coins BIGINT DEFAULT 0,
        level INTEGER DEFAULT 1,
        xp BIGINT DEFAULT 0,
        streak BIGINT DEFAULT 0,
        "lastDaily" BIGINT DEFAULT 0,
        "lastMancing" BIGINT DEFAULT 0,
        "lastBerburu" BIGINT DEFAULT 0,
        "lastNambang" BIGINT DEFAULT 0,
        "pickaxeLevel" INTEGER DEFAULT 1,
        "pancinganLevel" INTEGER DEFAULT 1,
        inventory TEXT DEFAULT '{}',
        enchants TEXT DEFAULT '{}',
        hp INTEGER DEFAULT 100,
        "maxHp" INTEGER DEFAULT 100,
        buffs TEXT DEFAULT '{}',
        combat TEXT DEFAULT '{}',
        mp INTEGER DEFAULT 50,
        "maxMp" INTEGER DEFAULT 50,
        skills TEXT DEFAULT '{}',
        "pickaxeDurability" INTEGER DEFAULT 50,
        "maxPickaxeDurability" INTEGER DEFAULT 50,
        "pancinganDurability" INTEGER DEFAULT 50,
        "maxPancinganDurability" INTEGER DEFAULT 50,
        equipment TEXT DEFAULT '{}'
      )
    `;

    await neonClient`
      CREATE TABLE IF NOT EXISTS limits (
        id TEXT PRIMARY KEY,
        name TEXT DEFAULT 'Unknown',
        dl_used INTEGER DEFAULT 0,
        dl_reset BIGINT DEFAULT 0,
        ai_used INTEGER DEFAULT 0,
        ai_reset BIGINT DEFAULT 0,
        kuis_used INTEGER DEFAULT 0,
        kuis_reset BIGINT DEFAULT 0,
        st_used INTEGER DEFAULT 0,
        st_reset BIGINT DEFAULT 0,
        dl_max INTEGER DEFAULT 0,
        ai_max INTEGER DEFAULT 0,
        kuis_max INTEGER DEFAULT 0,
        st_max INTEGER DEFAULT 0
      )
    `;

    await neonClient`
      CREATE TABLE IF NOT EXISTS warns (
        id TEXT PRIMARY KEY,
        "warnCount" INTEGER DEFAULT 0
      )
    `;

    await neonClient`
      CREATE TABLE IF NOT EXISTS link_strikes (
        id TEXT PRIMARY KEY,
        "strikeCount" INTEGER DEFAULT 0
      )
    `;

    console.log('[DB] ✅ Neon PostgreSQL siap digunakan!');
  } catch (err) {
    if (!useLocalFallback) {
      console.warn('[DB] ⚠️ Gagal terhubung ke Neon PostgreSQL, menggunakan penyimpanan lokal.');
      useLocalFallback = true;
      loadLocalDb();
    }
  }
}

// Panggil fungsi inisialisasi
initDb().catch(err => {
  useLocalFallback = true;
  loadLocalDb();
});

module.exports = { sql };

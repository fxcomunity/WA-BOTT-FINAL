// features/limitSystem.js — Sistem Limit Per User

const db = require('../database/db');

const DEFAULT_LIMIT = {
  download: 5,    // download YT/TT/IG per hari
  ai: 10,         // tanya AI per hari
  kuis: 20,       // main game per hari
  sticker: 10,    // buat sticker per hari
};

const ONE_DAY = 86400000;

function getLimit(sender) {
  const now = Date.now();
  let row = db.prepare('SELECT * FROM limits WHERE id = ?').get(sender);
  
  if (!row) {
    row = {
      id: sender,
      name: "Unknown",
      dl_used: 0, dl_reset: now + ONE_DAY,
      ai_used: 0, ai_reset: now + ONE_DAY,
      kuis_used: 0, kuis_reset: now + ONE_DAY,
      st_used: 0, st_reset: now + ONE_DAY
    };
    db.prepare(`
      INSERT INTO limits (id, name, dl_used, dl_reset, ai_used, ai_reset, kuis_used, kuis_reset, st_used, st_reset)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sender, row.name, 0, row.dl_reset, 0, row.ai_reset, 0, row.kuis_reset, 0, row.st_reset);
  }

  let changed = false;
  // Auto reset kalau udah lewat 1 hari
  if (now > row.dl_reset) { row.dl_used = 0; row.dl_reset = now + ONE_DAY; changed = true; }
  if (now > row.ai_reset) { row.ai_used = 0; row.ai_reset = now + ONE_DAY; changed = true; }
  if (now > row.kuis_reset) { row.kuis_used = 0; row.kuis_reset = now + ONE_DAY; changed = true; }
  if (now > row.st_reset) { row.st_used = 0; row.st_reset = now + ONE_DAY; changed = true; }
  
  if (changed) saveLimit(sender, row);

  // Reconstruct nested object format for compatibility with rest of code
  // Use custom max from DB if set (> 0), otherwise use DEFAULT_LIMIT
  return {
    name: row.name,
    download: { used: row.dl_used, max: (row.dl_max && row.dl_max > 0) ? row.dl_max : DEFAULT_LIMIT.download, resetAt: row.dl_reset },
    ai:       { used: row.ai_used, max: (row.ai_max && row.ai_max > 0) ? row.ai_max : DEFAULT_LIMIT.ai,       resetAt: row.ai_reset },
    kuis:     { used: row.kuis_used, max: (row.kuis_max && row.kuis_max > 0) ? row.kuis_max : DEFAULT_LIMIT.kuis,     resetAt: row.kuis_reset },
    sticker:  { used: row.st_used, max: (row.st_max && row.st_max > 0) ? row.st_max : DEFAULT_LIMIT.sticker,  resetAt: row.st_reset },
    status:   "🟢 Aktif"
  };
}

function saveLimit(sender, d) {
  // d can be the row object or the reconstructed nested object
  const name = d.name;
  const dl_used = d.download ? d.download.used : d.dl_used;
  const dl_reset = d.download ? d.download.resetAt : d.dl_reset;
  const ai_used = d.ai ? d.ai.used : d.ai_used;
  const ai_reset = d.ai ? d.ai.resetAt : d.ai_reset;
  const kuis_used = d.kuis ? d.kuis.used : d.kuis_used;
  const kuis_reset = d.kuis ? d.kuis.resetAt : d.kuis_reset;
  const st_used = d.sticker ? d.sticker.used : d.st_used;
  const st_reset = d.sticker ? d.sticker.resetAt : d.st_reset;

  // Custom max values (0 = use default)
  const dl_max = d.download ? (d.download.max !== DEFAULT_LIMIT.download ? d.download.max : 0) : (d.dl_max || 0);
  const ai_max = d.ai ? (d.ai.max !== DEFAULT_LIMIT.ai ? d.ai.max : 0) : (d.ai_max || 0);
  const kuis_max = d.kuis ? (d.kuis.max !== DEFAULT_LIMIT.kuis ? d.kuis.max : 0) : (d.kuis_max || 0);
  const st_max = d.sticker ? (d.sticker.max !== DEFAULT_LIMIT.sticker ? d.sticker.max : 0) : (d.st_max || 0);

  db.prepare(`
    UPDATE limits SET name = ?, dl_used = ?, dl_reset = ?, ai_used = ?, ai_reset = ?, kuis_used = ?, kuis_reset = ?, st_used = ?, st_reset = ?, dl_max = ?, ai_max = ?, kuis_max = ?, st_max = ? WHERE id = ?
  `).run(name, dl_used, dl_reset, ai_used, ai_reset, kuis_used, kuis_reset, st_used, st_reset, dl_max, ai_max, kuis_max, st_max, sender);
}

function sisaJam(resetAt) {
  const sisa = Math.max(0, resetAt - Date.now());
  const jam  = Math.floor(sisa / 3600000);
  const mnt  = Math.floor((sisa % 3600000) / 60000);
  return `${jam}j ${mnt}m`;
}

function dnaStatus(data) {
  const total = DEFAULT_LIMIT.download + DEFAULT_LIMIT.ai + DEFAULT_LIMIT.kuis + DEFAULT_LIMIT.sticker;
  const used  = data.download.used + data.ai.used + data.kuis.used + data.sticker.used;
  const pct   = Math.round((used / total) * 100);
  if (pct >= 100) return "🔴 Habis";
  if (pct >= 60)  return "🟡 Hampir Habis";
  return "🟢 Aktif";
}

function barLimit(used, max) {
  const filled = Math.round((used / max) * 8);
  return "█".repeat(filled) + "░".repeat(8 - filled);
}

module.exports = {
  // Cek dan kurangi limit, return true kalau masih bisa
  cek(sender, type) {
    const config = require("../config");
    if (config.owners.includes(sender.split("@")[0])) return true; // Owner unlimited

    const d = getLimit(sender);
    if (!d[type]) return true;
    if (d[type].used >= d[type].max) return false;
    d[type].used++;
    saveLimit(sender, d);
    return true;
  },

  // Set nama WA user (dipanggil saat bot dapat nama dari profil)
  setName(sender, name) {
    const d = getLimit(sender);
    if (d.name !== name) {
      d.name = name || sender.split("@")[0];
      saveLimit(sender, d);
    }
  },

  // Tampilkan limit user
  async showLimit(sock, msg, sender) {
    const d = getLimit(sender);
    d.status = dnaStatus(d);

    const name = d.name || sender.split("@")[0];
    const no   = sender.split("@")[0];
    const isLid = sender.includes("@lid");

    let statusWA = "Tidak tersedia";
    try {
      const stat = await sock.fetchStatus(sender);
      if (stat && stat.status) statusWA = stat.status;
    } catch (e) {
      // Abaikan jika tidak bisa ambil status
    }

    const config = require("../config");
    const isOwner = config.owners.includes(no);
    const rank = isOwner ? "👑 Owner" : "👤 Member";

    const dNow = new Date();
    const hr = dNow.getHours();
    let ucapan = "Selamat Pagi";
    if (hr >= 11 && hr < 15) ucapan = "Selamat Siang";
    else if (hr >= 15 && hr < 18) ucapan = "Selamat Sore";
    else if (hr >= 18 || hr < 4) ucapan = "Selamat Malam";

    const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const strHariTanggal = `${hariArr[dNow.getDay()]}, ${dNow.getDate()} ${bulanArr[dNow.getMonth()]} ${dNow.getFullYear()}`;
    const strJam = dNow.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':') + " WIB";

    const text = `
══════════════════╝
Hellow, ${name}! 👋

┃ ${ucapan},
┃ Hari/Tanggal : ${strHariTanggal}
┃ Jam                : ${strJam}
┃ Met nongkrong di markas bot.
═══════ Info Lu ══════════════
👤 Nama: ${name}
🔰 Kasta: ${rank}
${isLid ? `🆔 ID Gaib: +${no}` : `📱 No Asli: +${no}`}
💬 Status WA: ${statusWA}
🌟 Tipe Akun: ${isOwner ? "♾️ Bebas Hambatan (VIP Jalur Dalem)" : d.status}

━━━━━━━━━━━━━━━━━━━━
📥 *Tukang Sedot (DL)*
   ${isOwner ? "████████ ∞/∞" : `${barLimit(d.download.used, d.download.max)} ${d.download.used}/${d.download.max}`}
   ⏱ Reset: ${isOwner ? "-" : sisaJam(d.download.resetAt)}

🤖 *Ngobrol AI*
   ${isOwner ? "████████ ∞/∞" : `${barLimit(d.ai.used, d.ai.max)} ${d.ai.used}/${d.ai.max}`}
   ⏱ Reset: ${isOwner ? "-" : sisaJam(d.ai.resetAt)}

🎮 *Mabar / Kuis*
   ${isOwner ? "████████ ∞/∞" : `${barLimit(d.kuis.used, d.kuis.max)} ${d.kuis.used}/${d.kuis.max}`}
   ⏱ Reset: ${isOwner ? "-" : sisaJam(d.kuis.resetAt)}

🖼️ *Pabrik Sticker*
   ${isOwner ? "████████ ∞/∞" : `${barLimit(d.sticker.used, d.sticker.max)} ${d.sticker.used}/${d.sticker.max}`}
   ⏱ Reset: ${isOwner ? "-" : sisaJam(d.sticker.resetAt)}
━━━━━━━━━━━━━━━━━━━━
💡 Limit balik full tiap 24 jam ye.
    `.trim();

    return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },

  // Admin: set limit custom untuk user tertentu
  setCustomLimit(sender, type, max) {
    const d = getLimit(sender);
    if (d[type]) {
      d[type].max = max;
      saveLimit(sender, d);
    }
  },

  // Admin: reset limit user
  resetLimit(sender) {
    db.prepare('DELETE FROM limits WHERE id = ?').run(sender);
  },

  // Admin: reset semua limit
  resetAll(sock, msg) {
    db.prepare('UPDATE limits SET dl_used = 0, ai_used = 0, kuis_used = 0, st_used = 0').run();
    return sock.sendMessage(msg.key.remoteJid, { text: "✅ Tsaahh! Semua limit rakjel udah gue reset jadi 0 lagi!" }, { quoted: msg });
  },

  // Admin: lihat semua user + status DNA
  async showAllLimits(sock, msg) {
    const all = db.prepare('SELECT * FROM limits').all();
    if (all.length === 0)
      return sock.sendMessage(msg.key.remoteJid, { text: "Kosong melompong njir, belom ada data limit." }, { quoted: msg });

    const rows = all.map(row => {
      const d = getLimit(row.id);
      const name = d.name || row.id.split("@")[0];
      const status = dnaStatus(d);
      const dlUsed = d.download.used;
      const aiUsed = d.ai.used;
      return `👤 ${name} (+${row.id.split("@")[0]})\n   DNA: ${status} | DL: ${dlUsed}/${d.download.max} | AI: ${aiUsed}/${d.ai.max}`;
    });

    return sock.sendMessage(msg.key.remoteJid, {
      text: `📋 *Daftar Dosa Limit Orang-orang*\n\n${rows.join("\n\n")}`,
    }, { quoted: msg });
  },

  getLimit,
};

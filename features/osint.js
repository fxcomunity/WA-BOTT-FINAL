// features/osint.js — OSINT Tools: Data Breach Check & Username Search
// !data email@example.com  → cek email kena breach ga
// !sc username             → cek username di berbagai platform

const axios = require('axios');
const google = require('googlethis');
const { reply } = require('./utils');

// ============================================
// PLATFORM LIST UNTUK USERNAME SEARCH
// ============================================
const PLATFORMS = [
  { name: 'GitHub',      url: 'https://github.com/{}',              check: (r) => r.status === 200 },
  { name: 'TikTok',      url: 'https://www.tiktok.com/@{}',         check: (r) => r.status === 200 },
  { name: 'Instagram',   url: 'https://www.instagram.com/{}/',      check: (r) => r.status === 200 },
  { name: 'Twitter/X',   url: 'https://x.com/{}',                   check: (r) => r.status === 200 },
  { name: 'Pinterest',   url: 'https://www.pinterest.com/{}/',      check: (r) => r.status === 200 },
  { name: 'Reddit',      url: 'https://www.reddit.com/user/{}',     check: (r) => r.status === 200 },
  { name: 'YouTube',     url: 'https://www.youtube.com/@{}',        check: (r) => r.status === 200 },
  { name: 'Spotify',     url: 'https://open.spotify.com/user/{}',   check: (r) => r.status === 200 },
  { name: 'Steam',       url: 'https://steamcommunity.com/id/{}',   check: (r) => r.status === 200 && !r.data.includes('The specified profile could not be found') },
  { name: 'Twitch',      url: 'https://www.twitch.tv/{}',           check: (r) => r.status === 200 },
  { name: 'LinkedIn',    url: 'https://www.linkedin.com/in/{}',     check: (r) => r.status === 200 },
  { name: 'Linktree',    url: 'https://linktr.ee/{}',               check: (r) => r.status === 200 },
];

// ============================================
// HELPER
// ============================================
function getRiskEmoji(level) {
  switch (level?.toLowerCase()) {
    case 'critical': return '🔴';
    case 'high':     return '🟠';
    case 'medium':   return '🟡';
    case 'low':      return '🟢';
    default:         return '⚪';
  }
}

function getRiskText(level) {
  switch (level?.toLowerCase()) {
    case 'critical': return 'KRITIS! Data lo kemana-mana njir!';
    case 'high':     return 'BAHAYA! Segera ganti password!';
    case 'medium':   return 'Lumayan bahaya, waspada ya!';
    case 'low':      return 'Aman, tapi tetep hati-hati.';
    default:         return 'Tidak diketahui.';
  }
}

// ============================================
// !data — CEK EMAIL BREACH & GOOGLE
// ============================================
async function checkBreach(sock, msg, email) {
  if (!email) {
    return reply(sock, msg, `⚠️ Format salah njir!\nContoh: *!data email@example.com*`);
  }

  // Validasi format email basic
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return reply(sock, msg, `❌ Format email salah bos! Contoh: *!data email@example.com*`);
  }

  await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });
  await reply(sock, msg, `🔍 Lagi ngecek email *${email}* ke Database Breach & Google OSINT...\n_Tunggu sebentar ya bos!_`);

  try {
    // 1. Cek Breach Database
    const res = await axios.get(
      `https://hackmyip.com/api/breach?email=${encodeURIComponent(email)}`,
      { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }, validateStatus: () => true }
    );
    const data = res.data?.data || null;

    // 2. Cek Google Web Search (Dorking)
    let googleResults = [];
    try {
      const gRes = await google.search(`"${email}"`, { page: 0, safe: false, additional_params: { hl: 'id' } });
      googleResults = gRes.results || [];
    } catch (e) {
      console.log("[OSINT] Google search error:", e.message);
    }

    let breachText = "";
    if (!data || (data.breaches || 0) === 0) {
      breachText = `┃ ✅ *Database Breach:* AMAN SENTOSA!\n┃ Tidak ditemukan di database kebocoran.\n`;
    } else {
      const breachCount = data.breaches || 0;
      const services = data.services || [];
      const risk = data.risk || {};
      const passwords = data.passwords || {};
      
      const serviceList = services.length > 0
        ? services.slice(0, 5).map((s, i) => `┃  ${i + 1}. ${s}`).join('\n')
        : '┃  Data tidak tersedia';

      const passInfo = passwords.total > 0
        ? `┃ 🔑 *Password bocor:* ${passwords.total} (${passwords.plain_text || 0} plain text!)\n` : '';

      breachText = 
        `┃ ⚠️ *Database Breach:* BOCOR! (${breachCount} kali)\n` +
        `┃ ${getRiskEmoji(risk.level)} *Risk Level:* ${(risk.level || 'unknown').toUpperCase()}\n` +
        `┃ 🚨 *Sumber Kebocoran Teratas:*\n` + serviceList + `\n` + passInfo;
    }

    let googleText = "";
    if (googleResults.length === 0) {
      googleText = `┃ ✅ *Google OSINT:* Bersih!\n┃ Email ini tidak terlacak di publik (Google).`;
    } else {
      const topLinks = googleResults.slice(0, 5).map((r, i) => `┃  ${i + 1}. ${r.title.substring(0, 25)}...\n┃     └ ${r.url}`).join('\n');
      googleText = `┃ 🔎 *Jejak Web Publik (Google OSINT):*\n┃ Ditemukan di ${googleResults.length} halaman web:\n${topLinks}`;
    }

    const text =
      `╭━━• [ 🌐 FULL OSINT EMAIL ] •━━╮\n` +
      `┃\n` +
      `┃ 📧 *Target:* ${email}\n` +
      `┃\n` +
      `┣━━ [ 🛡️ DEEP WEB / BREACH ] ━━\n` +
      breachText +
      `┃\n` +
      `┣━━ [ 🌍 SURFACE WEB / GOOGLE ] ━━\n` +
      googleText + `\n` +
      `┃\n` +
      `┃ 🔐 *Saran Keamanan:*\n` +
      `┃  • Segera ganti password!\n` +
      `┃  • Aktifkan 2FA di semua akun.\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(msg.key.remoteJid, { react: { text: data && data.breaches > 0 ? '⚠️' : '✅', key: msg.key } });
    return reply(sock, msg, text);

  } catch (e) {
    console.error('checkBreach error:', e.message);
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
    return reply(sock, msg, `❌ Gagal OSINT email bos! API lagi error atau koneksi terputus.`);
  }
}

// ============================================
// !sc — USERNAME SEARCH DI SEMUA WEB & GOOGLE
// ============================================
async function searchUsername(sock, msg, username) {
  if (!username) {
    return reply(sock, msg, `⚠️ Format salah njir!\nContoh: *!sc namauser*`);
  }

  // Validasi username
  if (username.length < 2 || username.length > 30) {
    return reply(sock, msg, `❌ Username harus 2-30 karakter bos!`);
  }
  if (!/^[a-zA-Z0-9._\-]+$/.test(username)) {
    return reply(sock, msg, `❌ Username cuma boleh huruf, angka, titik, underscore, dan strip bos!`);
  }

  await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });
  await reply(sock, msg,
    `🔍 *Scanning OSINT username:* @${username}\n` +
    `📡 Menelusuri Sosmed & Semua Web via Google...\n` +
    `_Tunggu ya bos, proses pencarian luas..._`
  );

  try {
    // 1. Cek Social Media Platforms (Parallel)
    const results = await Promise.allSettled(
      PLATFORMS.map(async (platform) => {
        const url = platform.url.replace('{}', encodeURIComponent(username));
        try {
          const res = await axios.get(url, {
            timeout: 8000, maxRedirects: 3, validateStatus: () => true,
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          return { name: platform.name, url: platform.url.replace('{}', username), found: platform.check(res) };
        } catch {
          return { name: platform.name, found: false, error: true };
        }
      })
    );

    const foundSocials = results.filter(r => r.value && r.value.found).map(r => r.value);
    
    // 2. Cek Google OSINT
    let googleResults = [];
    try {
      const gRes = await google.search(`"${username}" OR inurl:"${username}"`, { page: 0, safe: false });
      googleResults = gRes.results || [];
    } catch (e) {
      console.log("[OSINT] Google search error:", e.message);
    }

    // Format Pesan Sosial Media
    const socialList = foundSocials.length > 0
      ? foundSocials.map(p => `┃ ✅ *${p.name}* : ${p.url}`).join('\n')
      : '┃ ❌ Tidak ditemukan di platform sosmed utama.';

    // Format Pesan Google
    let googleText = "";
    if (googleResults.length === 0) {
      googleText = `┃ ❌ Tidak ada jejak website di Google.`;
    } else {
      const topLinks = googleResults.slice(0, 5).map((r, i) => `┃  ${i + 1}. ${r.title.substring(0, 30)}...\n┃     └ ${r.url}`).join('\n');
      googleText = `┃ 🔎 Ditemukan di ${googleResults.length} hasil pencarian:\n${topLinks}`;
    }

    const text =
      `╭━━• [ 🕵️ FULL OSINT USERNAME ] •━━╮\n` +
      `┃\n` +
      `┃ 👤 *Target:* @${username}\n` +
      `┃\n` +
      `┣━━ [ 📱 SOCIAL MEDIA ACCOUNTS ] ━━\n` +
      socialList + `\n` +
      `┃\n` +
      `┣━━ [ 🌍 HASIL WEB GOOGLE ] ━━\n` +
      googleText + `\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(msg.key.remoteJid, { react: { text: foundSocials.length > 0 || googleResults.length > 0 ? '✅' : '❌', key: msg.key } });
    return reply(sock, msg, text);

  } catch (e) {
    console.error('searchUsername error:', e.message);
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
    return reply(sock, msg, `❌ Gagal OSINT username bos!`);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = { checkBreach, searchUsername };

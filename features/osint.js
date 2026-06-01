// features/osint.js — OSINT Tools: Data Breach Check & Username Search
// !data email@example.com  → cek email kena breach ga
// !sc username             → cek username di berbagai platform

const axios = require('axios');
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
// !data — CEK EMAIL BREACH
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
  await reply(sock, msg, `🔍 Lagi ngecek email *${email}*...\n_Tunggu sebentar ya bos!_`);

  try {
    const res = await axios.get(
      `https://hackmyip.com/api/breach?email=${encodeURIComponent(email)}`,
      { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    const data = res.data?.data;

    if (!data) throw new Error('Response kosong');

    const breachCount = data.breaches || 0;
    const services   = data.services || [];
    const risk       = data.risk || {};
    const passwords  = data.passwords || {};

    // Kalau aman
    if (breachCount === 0) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      return reply(sock, msg,
        `╭━━• [ 🛡️ CEK DATA BREACH ] •━━╮\n` +
        `┃\n` +
        `┃ 📧 *Email:* ${data.email || email}\n` +
        `┃ ✅ *Status:* AMAN SENTOSA!\n` +
        `┃\n` +
        `┃ Email lo tidak ditemukan di\n` +
        `┃ database kebocoran manapun.\n` +
        `┃\n` +
        `┃ 💡 *Tips:* Tetep pake password\n` +
        `┃ unik dan aktifkan 2FA ya!\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
    }

    // Kalau kena breach
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '⚠️', key: msg.key } });

    const serviceList = services.length > 0
      ? services.slice(0, 10).map((s, i) => `┃  ${i + 1}. ${s}`).join('\n')
      : '┃  Data tidak tersedia';

    const moreText = services.length > 10
      ? `┃  ...dan ${services.length - 10} lainnya\n`
      : '';

    const passInfo = passwords.total > 0
      ? `┃ 🔑 *Password bocor:* ${passwords.total} (${passwords.plain_text || 0} plain text!)\n`
      : '';

    const text =
      `╭━━• [ ⚠️ CEK DATA BREACH ] •━━╮\n` +
      `┃\n` +
      `┃ 📧 *Email:* ${data.email || email}\n` +
      `┃ ${getRiskEmoji(risk.level)} *Risk Level:* ${(risk.level || 'unknown').toUpperCase()}\n` +
      `┃ 📊 *Risk Score:* ${risk.score || 0}/100\n` +
      `┃ 💬 *Status:* ${getRiskText(risk.level)}\n` +
      `┃\n` +
      `┃ 🚨 *Ditemukan di ${breachCount} kebocoran:*\n` +
      serviceList + '\n' +
      moreText +
      `┃\n` +
      passInfo +
      `┃ 🔐 *Saran:*\n` +
      `┃  • Ganti password sekarang!\n` +
      `┃  • Aktifkan 2FA di semua akun\n` +
      `┃  • Pakai password manager\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    return reply(sock, msg, text);

  } catch (e) {
    console.error('checkBreach error:', e.message);
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
    return reply(sock, msg, `❌ Gagal ngecek breach bos! API lagi error atau timeout.\nCoba lagi nanti ya.`);
  }
}

// ============================================
// !sc — USERNAME SEARCH DI BERBAGAI PLATFORM
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
    `🔍 *Nyari username:* @${username}\n` +
    `📡 Ngecek ${PLATFORMS.length} platform...\n` +
    `_Tunggu ya, ini butuh waktu ~${Math.ceil(PLATFORMS.length / 3)} detik..._`
  );

  // Cek semua platform secara parallel
  const results = await Promise.allSettled(
    PLATFORMS.map(async (platform) => {
      const url = platform.url.replace('{}', encodeURIComponent(username));
      try {
        const res = await axios.get(url, {
          timeout: 8000,
          maxRedirects: 3,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          validateStatus: () => true, // jangan throw untuk status apapun
        });
        const found = platform.check(res);
        return { name: platform.name, url: platform.url.replace('{}', username), found };
      } catch {
        return { name: platform.name, url: platform.url.replace('{}', username), found: false, error: true };
      }
    })
  );

  const found    = [];
  const notFound = [];
  const error    = [];

  for (const result of results) {
    const val = result.value;
    if (!val) continue;
    if (val.error)       error.push(val);
    else if (val.found)  found.push(val);
    else                 notFound.push(val);
  }

  const foundList = found.length > 0
    ? found.map(p => `┃ ✅ *${p.name}*\n┃    └ ${p.url}`).join('\n')
    : '┃ ❌ Tidak ditemukan di platform manapun.';

  const notFoundList = notFound.length > 0
    ? notFound.map(p => `┃ ❌ ${p.name}`).join('\n')
    : '';

  const text =
    `╭━━• [ 🕵️ USERNAME SEARCH ] •━━╮\n` +
    `┃\n` +
    `┃ 🔎 *Query:* @${username}\n` +
    `┃ ✅ *Ketemu:* ${found.length} platform\n` +
    `┃ ❌ *Ga ada:* ${notFound.length} platform\n` +
    `┃\n` +
    `┣━━ [ 🟢 DITEMUKAN ] ━━\n` +
    foundList + '\n' +
    (notFoundList
      ? `┃\n┣━━ [ 🔴 TIDAK ADA ] ━━\n` + notFoundList + '\n'
      : '') +
    `┃\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(msg.key.remoteJid, { react: { text: found.length > 0 ? '✅' : '❌', key: msg.key } });
  return reply(sock, msg, text);
}

// ============================================
// EXPORTS
// ============================================
module.exports = { checkBreach, searchUsername };

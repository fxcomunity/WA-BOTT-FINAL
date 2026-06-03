// features/komikTracker.js
// Auto-track chapter baru tiap 30 menit → DM ke owner
// Fallback: Komikcast → Shinigami → MangaDex

const axios  = require('axios');
const cheerio = require('cheerio');
const config  = require('../config');

// ============================================
// KOMIK YANG DI-TRACK
// ============================================
const TRACKED_COMICS = [
  {
    title:      "Ranker's Return (Remake)",
    komikcast:  'rankers-return-remake',
    shinigami:  'rankers-return-remake',
    mangadex:   "Ranker's Return",
  },
  {
    title:      "Omniscient Reader's Viewpoint",
    komikcast:  'omniscient-readers-viewpoint',
    shinigami:  'omniscient-readers-viewpoint',
    mangadex:   "Omniscient Reader's Viewpoint",
  },
  {
    title:      "Regressing With The King's Power",
    komikcast:  'regressing-with-the-kings-power',
    shinigami:  'regressing-with-the-kings-power',
    mangadex:   "Regressing With The King's Power",
  },
  {
    title:      "The 100th Regression Of The Max-Level Player",
    komikcast:  'the-100th-regression-of-the-max-level-player',
    shinigami:  'the-100th-regression-of-the-max-level-player',
    mangadex:   "The 100th Regression of the Max-Level Player",
  },
  {
    title:      "Artifact-Devouring Player",
    komikcast:  'artifact-devouring-player',
    shinigami:  'artifact-devouring-player',
    mangadex:   "Artifact-Devouring Player",
  },
  {
    title:      "Revenge Of The Iron-Blooded Sword Hound",
    komikcast:  'revenge-of-the-iron-blooded-sword-hound',
    shinigami:  'revenge-of-the-iron-blooded-sword-hound',
    mangadex:   "Revenge of the Iron-Blooded Sword Hound",
  },
  {
    title:      "Disastrous Necromancer",
    komikcast:  'disastrous-necromancer',
    shinigami:  'disastrous-necromancer',
    mangadex:   "Disastrous Necromancer",
  },
  {
    title:      "Pick Me Up",
    komikcast:  'pick-me-up',
    shinigami:  'pick-me-up',
    mangadex:   "Pick Me Up",
  },
  {
    title:      "The World After The Fall",
    komikcast:  'the-world-after-the-fall',
    shinigami:  'the-world-after-the-fall',
    mangadex:   "The World After the Fall",
  },
  {
    title:      "World's Strongest Troll",
    komikcast:  'worlds-strongest-troll',
    shinigami:  'worlds-strongest-troll',
    mangadex:   "World's Strongest Troll",
  },
];

// ============================================
// STATE — simpan chapter terakhir yang sudah dinotif
// ============================================
const lastNotified = {};  // { comicTitle: "Chapter 123" }

// ============================================
// HEADERS biar ga kedetect bot
// ============================================
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ============================================
// SOURCE 1: KOMIKCAST
// ============================================
async function fetchFromKomikcast(slug) {
  try {
    const url = `https://v2.komikcast.fit/komik/${slug}/`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $   = cheerio.load(res.data);

    // Ambil chapter pertama di list (paling baru)
    const firstChapter = $('.komik_info-chapters-item-title').first().text().trim()
      || $('ul.chapter_list li').first().find('a').text().trim()
      || $('.daftar_chapter .item').first().find('a').text().trim();

    const chapterUrl = $('.komik_info-chapters-item-title').first().closest('a').attr('href')
      || $('ul.chapter_list li').first().find('a').attr('href')
      || '';

    if (!firstChapter) return null;

    return {
      source:     '📚 Komikcast',
      chapter:    firstChapter,
      url:        chapterUrl || `https://v2.komikcast.fit/komik/${slug}/`,
      sourceUrl:  `https://v2.komikcast.fit/komik/${slug}/`,
    };
  } catch (e) {
    return null;
  }
}

// ============================================
// SOURCE 2: SHINIGAMI
// ============================================
async function fetchFromShinigami(slug) {
  try {
    const url = `https://g.shinigami.asia/manga/${slug}`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $   = cheerio.load(res.data);

    const firstChapter = $('.chapter-item').first().find('.chapter-name, a').first().text().trim()
      || $('ul.clstyle li').first().find('a em').text().trim()
      || $('.eph-num a').first().text().trim();

    const chapterUrl = $('.chapter-item a').first().attr('href')
      || $('ul.clstyle li').first().find('a').attr('href')
      || '';

    if (!firstChapter) return null;

    return {
      source:    '⚔️ Shinigami',
      chapter:   firstChapter,
      url:       chapterUrl || `https://g.shinigami.asia/manga/${slug}`,
      sourceUrl: `https://g.shinigami.asia/manga/${slug}`,
    };
  } catch (e) {
    return null;
  }
}

// ============================================
// SOURCE 3: MANGADEX (Official API - free, no key)
// ============================================
async function fetchFromMangaDex(title) {
  try {
    // Cari manga dulu
    const searchRes = await axios.get('https://api.mangadex.org/manga', {
      params: {
        title,
        limit:                    5,
        availableTranslatedLanguage: ['id', 'en'],
        order:                    { relevance: 'desc' },
      },
      timeout: 10000,
    });

    const mangas = searchRes.data?.data;
    if (!mangas?.length) return null;

    const mangaId = mangas[0].id;
    const mangaTitle = mangas[0].attributes?.title?.en
      || Object.values(mangas[0].attributes?.title || {})[0]
      || title;

    // Ambil chapter terbaru
    const chapterRes = await axios.get(`https://api.mangadex.org/manga/${mangaId}/feed`, {
      params: {
        limit:                       1,
        translatedLanguage:          ['id', 'en'],
        order:                       { chapter: 'desc' },
        contentRating:               ['safe', 'suggestive', 'erotica'],
        includes:                    ['scanlation_group'],
      },
      timeout: 10000,
    });

    const chapters = chapterRes.data?.data;
    if (!chapters?.length) return null;

    const ch     = chapters[0].attributes;
    const chNum  = ch.chapter  ? `Chapter ${ch.chapter}` : 'Chapter Terbaru';
    const chUrl  = `https://mangadex.org/chapter/${chapters[0].id}`;

    return {
      source:    '🌐 MangaDex',
      chapter:   chNum,
      url:       chUrl,
      sourceUrl: `https://mangadex.org/title/${mangaId}`,
      lang:      ch.translatedLanguage === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English',
    };
  } catch (e) {
    return null;
  }
}

// ============================================
// CEK SATU KOMIK — fallback chain
// ============================================
async function checkOneComic(comic) {
  // Coba Komikcast dulu
  let result = await fetchFromKomikcast(comic.komikcast);

  // Fallback ke Shinigami
  if (!result) {
    result = await fetchFromShinigami(comic.shinigami);
  }

  // Fallback ke MangaDex
  if (!result) {
    result = await fetchFromMangaDex(comic.mangadex);
  }

  return result;
}

// ============================================
// FORMAT NOTIF
// ============================================
function formatNotif(comic, data, isNew) {
  const badge  = isNew ? '🔔 *UPDATE BARU!*' : '📖 *Chapter Terbaru*';
  const lang   = data.lang ? `\n┃ 🌐 *Bahasa:* ${data.lang}` : '';

  return (
    `╭━━• [ ${badge} ] •━━╮\n` +
    `┃\n` +
    `┃ 📕 *${comic.title}*\n` +
    `┃ 📑 *Chapter:* ${data.chapter}\n` +
    `┃ ${data.source}\n` +
    `┃ 🕐 *Update:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB` +
    lang + '\n' +
    `┃\n` +
    `┃ 🔗 *Baca:* ${data.url}\n` +
    `┃\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━╯`
  );
}

// ============================================
// CEK SEMUA KOMIK & KIRIM NOTIF KE OWNER
// ============================================
async function checkAllComics(sock) {
  const ownerId = config.owners[0] + '@s.whatsapp.net';

  for (const comic of TRACKED_COMICS) {
    try {
      const data = await checkOneComic(comic);

      if (!data) {
        console.log(`[TRACKER] ❌ Ga bisa fetch: ${comic.title}`);
        continue;
      }

      const prevChapter = lastNotified[comic.title];
      const isNew       = prevChapter !== data.chapter;

      if (isNew) {
        console.log(`[TRACKER] 🔔 Update baru: ${comic.title} — ${data.chapter} (${data.source})`);
        lastNotified[comic.title] = data.chapter;

        await sock.sendMessage(ownerId, {
          text: formatNotif(comic, data, true),
        });

        // Delay 2 detik antar notif biar ga spam
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log(`[TRACKER] ✅ No update: ${comic.title} — masih ${data.chapter}`);
      }

    } catch (e) {
      console.error(`[TRACKER] Error cek ${comic.title}:`, e.message);
    }

    // Delay 3 detik antar request komik biar ga kena rate limit
    await new Promise(r => setTimeout(r, 3000));
  }
}

// ============================================
// COMMAND !track — Manual cek semua komik sekarang
// ============================================
async function manualCheck(sock, msg) {
  const ownerId = config.owners[0] + '@s.whatsapp.net';
  const sender  = msg.key.remoteJid;

  await sock.sendMessage(sender, {
    text: `🔍 Lagi ngecek ${TRACKED_COMICS.length} komik yang di-track...\n_Tunggu bentar ya!_`,
  }, { quoted: msg });

  const results = [];

  for (const comic of TRACKED_COMICS) {
    const data = await checkOneComic(comic);
    results.push({ comic, data });
    await new Promise(r => setTimeout(r, 2000));
  }

  let text = `╭━━• [ 📚 STATUS TRACKING ] •━━╮\n┃\n`;
  text += `┃ 🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n┃\n`;

  for (const { comic, data } of results) {
    const prev   = lastNotified[comic.title] || '-';
    const status = data
      ? (data.chapter !== prev ? '🔔 UPDATE!' : '✅ Up to date')
      : '❌ Gagal fetch';
    const chapter = data ? data.chapter : 'N/A';
    const source  = data ? data.source : '-';

    text += `┃ ${status}\n`;
    text += `┃ 📕 ${comic.title}\n`;
    text += `┃    └ ${chapter} ${source ? `(${source.replace(/[^\w\s]/gi, '').trim()})` : ''}\n`;
    text += `┃\n`;
  }

  text += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(sender, { text }, { quoted: msg });
}

// ============================================
// COMMAND !addtrack <judul> — Tambah komik baru
// ============================================
async function addTrack(sock, msg, title) {
  if (!title) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: '⚠️ Format: *!addtrack <judul komik>*\nContoh: !addtrack Solo Leveling',
    }, { quoted: msg });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

  TRACKED_COMICS.push({
    title,
    komikcast:  slug,
    shinigami:  slug,
    mangadex:   title,
  });

  return sock.sendMessage(msg.key.remoteJid, {
    text: `✅ *${title}* ditambahin ke daftar tracking!\n\nBot akan ngecek tiap 30 menit.\nSlug: \`${slug}\`\n\n⚠️ Kalau chapternya ga kedetect, mungkin slug perlu disesuaikan manual di \`komikTracker.js\`.`,
  }, { quoted: msg });
}

// ============================================
// COMMAND !tracklist — Liat daftar komik yang di-track
// ============================================
async function trackList(sock, msg) {
  let text = `╭━━• [ 📋 DAFTAR TRACKING ] •━━╮\n┃\n`;

  TRACKED_COMICS.forEach((c, i) => {
    const last = lastNotified[c.title] || 'Belum dicek';
    text += `┃ ${i + 1}. *${c.title}*\n`;
    text += `┃    └ Last: ${last}\n`;
  });

  text += `┃\n┃ Total: ${TRACKED_COMICS.length} komik\n`;
  text += `┃ ⏱️ Interval: setiap 30 menit\n`;
  text += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

// ============================================
// SEARCH — !komik KC/SG/MD <judul>
// ============================================

async function searchKomikcast(query) {
  try {
    const url = `https://v2.komikcast.fit/?s=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $   = cheerio.load(res.data);

    const results = [];
    $('.list-update_item').each((i, el) => {
      if (i >= 5) return false;
      const title   = $(el).find('.title').text().trim();
      const link    = $(el).find('a').first().attr('href') || '';
      const chapter = $(el).find('.chapter').text().trim() || '-';
      const type    = $(el).find('.type').text().trim() || '-';
      const rating  = $(el).find('.numscore').text().trim() || '-';
      if (title) results.push({ title, link, chapter, type, rating });
    });

    return results;
  } catch (e) {
    return null;
  }
}

async function searchShinigami(query) {
  try {
    const url = `https://g.shinigami.asia/?s=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $   = cheerio.load(res.data);

    const results = [];
    $('.bsx, .bs').each((i, el) => {
      if (i >= 5) return false;
      const title   = $(el).find('.bigor .tt, .ntitle, a').first().text().trim();
      const link    = $(el).find('a').first().attr('href') || '';
      const chapter = $(el).find('.epxs, .chapter').text().trim() || '-';
      const type    = $(el).find('.typeflag, .type').text().trim() || '-';
      const rating  = $(el).find('.numscore, .rating').text().trim() || '-';
      if (title) results.push({ title, link, chapter, type, rating });
    });

    return results;
  } catch (e) {
    return null;
  }
}

async function searchMangaDex(query) {
  try {
    const res = await axios.get('https://api.mangadex.org/manga', {
      params: {
        title:                       query,
        limit:                       5,
        availableTranslatedLanguage: ['id', 'en'],
        order:                       { relevance: 'desc' },
        includes:                    ['cover_art'],
      },
      timeout: 10000,
    });

    const mangas  = res.data?.data || [];
    const results = [];

    for (const m of mangas) {
      const attr    = m.attributes;
      const title   = attr.title?.en || attr.title?.id || Object.values(attr.title || {})[0] || '-';
      const status  = attr.status || '-';
      const type    = attr.originalLanguage === 'ko' ? 'Manhwa' : attr.originalLanguage === 'zh' ? 'Manhua' : 'Manga';
      const rating  = attr.contentRating || '-';
      const link    = `https://mangadex.org/title/${m.id}`;
      const year    = attr.year || '-';
      results.push({ title, link, status, type, rating, year });
    }

    return results;
  } catch (e) {
    return null;
  }
}

function formatSearchResults(source, emoji, results, query) {
  if (!results) {
    return `┃ ${emoji} *${source}* — ❌ Gagal fetch\n┃\n`;
  }
  if (!results.length) {
    return `┃ ${emoji} *${source}* — Tidak ditemukan\n┃\n`;
  }

  let text = `┣━━ ${emoji} [ ${source} ] ━━\n┃\n`;
  results.forEach((r, i) => {
    text += `┃ ${i + 1}. *${r.title}*\n`;
    if (r.chapter && r.chapter !== '-') text += `┃    📑 ${r.chapter}\n`;
    if (r.type    && r.type    !== '-') text += `┃    🏷️ ${r.type}\n`;
    if (r.status  && r.status  !== '-') text += `┃    📊 ${r.status}\n`;
    if (r.year    && r.year    !== '-') text += `┃    📅 ${r.year}\n`;
    if (r.rating  && r.rating  !== '-') text += `┃    ⭐ ${r.rating}\n`;
    text += `┃    🔗 ${r.link}\n`;
    text += `┃\n`;
  });

  return text;
}

async function searchComic(sock, msg, input) {
  if (!input) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: `⚠️ Format:\n` +
            `• *!komik KC <judul>* — Komikcast\n` +
            `• *!komik SG <judul>* — Shinigami\n` +
            `• *!komik MD <judul>* — MangaDex\n` +
            `• *!komik <judul>* — Semua source\n\n` +
            `Contoh: *!komik KC solo leveling*`,
    }, { quoted: msg });
  }

  const parts  = input.trim().split(' ');
  const source = parts[0].toUpperCase();
  const isSourceFlag = ['KC', 'SG', 'MD'].includes(source);
  const query  = isSourceFlag ? parts.slice(1).join(' ') : input;
  const target = isSourceFlag ? source : 'ALL';

  if (!query) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: `⚠️ Judul komiknya mana bos?\nContoh: *!komik KC solo leveling*`,
    }, { quoted: msg });
  }

  await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } }).catch(() => {});
  await sock.sendMessage(msg.key.remoteJid, {
    text: `🔍 Nyari *"${query}"*${target !== 'ALL' ? ` di ${target}` : ' di semua source'}...\n_Sebentar ya bos!_`,
  }, { quoted: msg });

  let body = `╭━━• [ 🔍 HASIL PENCARIAN ] •━━╮\n┃\n┃ 🔎 Query: *${query}*\n┃\n`;

  if (target === 'KC' || target === 'ALL') {
    const r = await searchKomikcast(query);
    body += formatSearchResults('Komikcast', '📚', r, query);
  }

  if (target === 'SG' || target === 'ALL') {
    const r = await searchShinigami(query);
    body += formatSearchResults('Shinigami', '⚔️', r, query);
  }

  if (target === 'MD' || target === 'ALL') {
    const r = await searchMangaDex(query);
    body += formatSearchResults('MangaDex', '🌐', r, query);
  }

  body += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } }).catch(() => {});
  return sock.sendMessage(msg.key.remoteJid, { text: body }, { quoted: msg });
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  TRACKED_COMICS,
  checkAllComics,
  manualCheck,
  addTrack,
  trackList,
  searchComic,
};

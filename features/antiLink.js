// features/antiLink.js — Klasifikasi link: promo (kick) vs sosial/lain (warn)

const config = require("../config");

// Regex untuk mendeteksi link, menangkap domain dengan TLD populer meskipun tanpa http/https/www
const linkRegex = /(?:https?:\/\/|www\.)[^\s<>'"]+|\b[a-zA-Z0-9][-a-zA-Z0-9.]*\.(?:com|net|org|co|id|me|xyz|info|biz|site|online|cc|tv|us|uk|ca|jp|fr|de|au|ru|ch|it|nl|se|no|es|br|app|dev|link|io|gg|tk|ml|ga|cf|gq|to|ly|ee|sh|pub)\b(?:\/[^\s<>'"]*)?/gi;

// Link promosi → kick langsung (kecuali ada di whitelist config / owner)
const promoPatterns = [
  /chat\.whatsapp\.com\/[^\s]+/i,
  /whatsapp\.com\/channel\/[^\s]+/i,
  /whatsapp\.com\/community\/[^\s]+/i,
  /t\.me\/[^\s]+/i,
  /telegram\.me\/[^\s]+/i,
  /telegram\.dog\/[^\s]+/i,
  /discord\.gg\/[^\s]+/i,
  /discord\.com\/invite\/[^\s]+/i,
  /wa\.me\/[^\s]+/i,
];

// Link media sosial → warn (bukan kick langsung)
const socialDomains = [
  "tiktok.com", "vm.tiktok.com", "vt.tiktok.com",
  "instagram.com", "instagr.am",
  "youtube.com", "youtu.be",
  "facebook.com", "fb.watch", "fb.com",
  "twitter.com", "x.com",
  "pinterest.com", "pin.it",
  "spotify.com", "open.spotify.com",
];

// Normalisasi teks untuk menggagalkan upaya bypass link (misal: "t (dot) me", "t[dot]me", "t . me / group")
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    // Ubah format bypass titik seperti (dot), [dot], {dot}, <dot>, atau kata " dot " menjadi "."
    .replace(/\s*[\(\[\{<]?dot[\)\]\}>]?\s*/gi, ".")
    // Ubah format bypass slash seperti (slash), [slash], {slash}, <slash>, atau " slash " menjadi "/"
    .replace(/\s*[\(\[\{<]?slash[\)\]\}>]?\s*/gi, "/")
    // Hilangkan spasi di sekitar titik jika diapit oleh huruf/angka
    .replace(/(\w+)\s*\.\s*(\w+)/g, "$1.$2")
    // Hilangkan spasi di sekitar slash jika diapit oleh huruf/angka
    .replace(/(\w+)\s*\/\s*(\w+)/g, "$1/$2");
}

function isWhitelisted(textOrLink) {
  if (!textOrLink) return false;
  const lower = textOrLink.toLowerCase();
  
  // Izinkan link yang ada di allowedLinks config
  if (config.allowedLinks.some(a => lower.includes(a.toLowerCase()))) return true;
  
  // Izinkan jika mengandung nomor hp owner (agar wa.me/owner tidak ke-kick)
  if (config.owners.some(o => lower.includes(o))) return true;
  
  return false;
}

function extractLinks(text) {
  const normalized = normalizeText(text);
  return normalized.match(linkRegex) || [];
}

function isPromoLink(link) {
  if (isWhitelisted(link)) return false;
  return promoPatterns.some(p => p.test(link));
}

function isSocialLink(link) {
  const lower = link.toLowerCase();
  return socialDomains.some(d => lower.includes(d));
}

function classifyText(text) {
  if (!text || typeof text !== "string") return { action: "none" };

  const normalized = normalizeText(text);
  const links = extractLinks(normalized);

  // Cek jika teks mengandung pola invite secara langsung (meskipun tidak terdeteksi link regex utuh)
  const hasPromoDirect = promoPatterns.some(p => p.test(normalized));
  if (hasPromoDirect && !isWhitelisted(normalized)) {
    return { action: "kick", reason: "Nyebar link promosi / invite grup (bypass detected)" };
  }

  if (links.length === 0) return { action: "none" };

  // Hanya link whitelist → aman
  const blocked = links.filter(l => !isWhitelisted(l));
  if (blocked.length === 0) return { action: "none" };

  // Ada link promo non-whitelist → kick langsung
  for (const link of blocked) {
    if (isPromoLink(link)) {
      return { action: "kick", reason: "Nyebar link promosi / invite grup" };
    }
  }

  // Link sosial / lainnya → warn dulu
  const allSocial = blocked.every(l => isSocialLink(l));
  return {
    action: "warn",
    reason: allSocial ? "Share link media sosial" : "Nyebar link",
    linkType: allSocial ? "social" : "other",
  };
}

module.exports = {
  classifyText,
  isWhitelisted,
  normalizeText,
  extractLinks,

  hasLink(text) {
    return classifyText(text).action !== "none";
  },

  hasWAInvite(text) {
    const normalized = normalizeText(text);
    return /chat\.whatsapp\.com\/[^\s]+/i.test(normalized);
  },
};

// features/antiLink.js — Klasifikasi link: promo (kick) vs sosial/lain (warn)

const config = require("../config");

const linkRegex = /(?:https?:\/\/[^\s<>'"]+|www\.[a-z0-9][-a-z0-9.]*\.[a-z]{2,}[^\s]*)/gi;

// Link promosi → kick langsung (kecuali ada di whitelist config)
const promoPatterns = [
  /chat\.whatsapp\.com\/[^\s]+/i,
  /wa\.me\/[^\s]+/i,
  /whatsapp\.com\/channel\/[^\s]+/i,
  /t\.me\/\+[^\s]+/i,
  /t\.me\/joinchat\/[^\s]+/i,
  /telegram\.me\/joinchat\/[^\s]+/i,
  /discord\.gg\/[^\s]+/i,
  /discord\.com\/invite\/[^\s]+/i,
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

function isWhitelisted(textOrLink) {
  if (!textOrLink) return false;
  const lower = textOrLink.toLowerCase();
  return config.allowedLinks.some(a => lower.includes(a.toLowerCase()));
}

function extractLinks(text) {
  return text.match(linkRegex) || [];
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

  const links = extractLinks(text);

  // Pesan tanpa URL tapi ada pola invite (mis. chat.whatsapp.com/xxx tanpa http)
  if (links.length === 0) {
    const hasPromo = promoPatterns.some(p => p.test(text));
    if (hasPromo && !isWhitelisted(text)) {
      return { action: "kick", reason: "Nyebar link promosi / invite grup" };
    }
    return { action: "none" };
  }

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

  hasLink(text) {
    return classifyText(text).action !== "none";
  },

  hasWAInvite(text) {
    return /chat\.whatsapp\.com\/[^\s]+/i.test(text);
  },
};

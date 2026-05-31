// features/antiLink.js — Klasifikasi link: promo (kick) vs sosial/lain (warn)

const config = require("../config");

const linkRegex = /(?:https?:\/\/[^\s<>'"]+|www\.[a-z0-9][-a-z0-9.]*\.[a-z]{2,}[^\s]*)/gi;
const waInviteRegex = /chat\.whatsapp\.com\/[^\s]+/i;

// Link promosi → kick langsung
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

function isAllowedByConfig(text) {
  return config.allowedLinks.some(a => text.toLowerCase().includes(a.toLowerCase()));
}

function extractLinks(text) {
  return text.match(linkRegex) || [];
}

function isPromoLink(link) {
  return promoPatterns.some(p => p.test(link));
}

function isSocialLink(link) {
  const lower = link.toLowerCase();
  return socialDomains.some(d => lower.includes(d));
}

function classifyText(text) {
  if (!text || typeof text !== "string") return { action: "none" };

  if (isAllowedByConfig(text)) return { action: "none" };

  // Cek promo di seluruh teks (invite WA kadang tanpa http)
  if (promoPatterns.some(p => p.test(text))) {
    return { action: "kick", reason: "Nyebar link promosi / invite grup" };
  }

  const links = extractLinks(text);
  if (links.length === 0) return { action: "none" };

  for (const link of links) {
    if (isAllowedByConfig(link)) continue;
    if (isPromoLink(link)) {
      return { action: "kick", reason: "Nyebar link promosi / invite grup" };
    }
  }

  const blocked = links.filter(l => !isAllowedByConfig(l));
  if (blocked.length === 0) return { action: "none" };

  const allSocial = blocked.every(l => isSocialLink(l));
  return {
    action: "warn",
    reason: allSocial ? "Share link media sosial" : "Nyebar link",
    linkType: allSocial ? "social" : "other",
  };
}

module.exports = {
  classifyText,

  hasLink(text) {
    return classifyText(text).action !== "none";
  },

  hasWAInvite(text) {
    return waInviteRegex.test(text);
  },
};

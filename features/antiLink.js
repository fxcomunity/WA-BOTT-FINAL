// features/antiLink.js — Anti Link & Anti Invite

const config = require("../config");

// Hanya deteksi URL nyata (http/https atau www. dengan TLD valid)
const linkRegex = /(?:https?:\/\/[^\s<>'"]+|www\.[a-z0-9][-a-z0-9.]*\.[a-z]{2,}[^\s]*)/gi;
const waInviteRegex = /chat\.whatsapp\.com\/[^\s]+/i;

// Domain dikecualikan (downloader & platform umum)
const whitelistedDomains = [
  "tiktok.com", "vm.tiktok.com", "vt.tiktok.com",
  "instagram.com", "instagr.am",
  "youtube.com", "youtu.be",
  "facebook.com", "fb.watch", "fb.com",
  "twitter.com", "x.com",
  "pinterest.com", "pin.it",
  "spotify.com", "open.spotify.com",
];

function isAllowedLink(link) {
  const lower = link.toLowerCase();
  if (config.allowedLinks.some(a => lower.includes(a.toLowerCase()))) return true;
  if (whitelistedDomains.some(domain => lower.includes(domain))) return true;
  return false;
}

module.exports = {
  hasLink(text) {
    if (!text || typeof text !== "string") return false;

    const links = text.match(linkRegex) || [];
    const foundBlocked = links.some(link => !isAllowedLink(link));
    if (foundBlocked) return true;

    if (this.hasWAInvite(text) && !config.allowedLinks.some(a => text.includes(a))) {
      return true;
    }

    return false;
  },

  hasWAInvite(text) {
    return waInviteRegex.test(text);
  },
};

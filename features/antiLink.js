// features/antiLink.js — Anti Link & Anti Invite

const config = require("../config");

const linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;
const waInviteRegex = /chat\.whatsapp\.com\/[^\s]+/i;

// Daftar domain yang dikecualikan dari hukuman anti-link (berguna untuk auto-downloader)
const whitelistedDomains = ["tiktok.com", "instagram.com"];

module.exports = {
  hasLink(text) {
    const links = text.match(linkRegex) || [];
    let found = links.some(link => {
      // Izinkan link yang ada di config.allowedLinks
      const isAllowedConfig = config.allowedLinks.some(a => link.includes(a));
      // Izinkan link yang ada di whitelistedDomains
      const isWhitelisted = whitelistedDomains.some(domain => link.includes(domain));
      
      return !isAllowedConfig && !isWhitelisted;
    });
    
    // Cek juga regex murni whatsapp invite jika tidak ada di atas
    if (!found) {
      // Pastiin bukan link yang di-whitelist
      const isAllowedConfig = config.allowedLinks.some(a => text.includes(a));
      if (!isAllowedConfig && this.hasWAInvite(text)) {
        found = true;
      }
    }
    return found;
  },

  hasWAInvite(text) {
    return waInviteRegex.test(text);
  },
};

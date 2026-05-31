// features/moderation.js — Anti-link: promo kick langsung, sosial/lain warn dulu

const config = require("../config");
const db = require("../database/db");
const antiLink = require("./antiLink");

db.exec(`
  CREATE TABLE IF NOT EXISTS link_strikes (
    id TEXT PRIMARY KEY,
    strikeCount INTEGER DEFAULT 0
  );
`);

function formatTimestamp() {
  const d = new Date();
  return `${d.toLocaleDateString("id-ID")} | ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;
}

module.exports = {
  analyzeViolation(text) {
    return antiLink.classifyText(text);
  },

  hasBlockedLink(text) {
    return antiLink.classifyText(text).action !== "none";
  },

  getLinkStrikes(sender) {
    return db.prepare("SELECT strikeCount FROM link_strikes WHERE id = ?").get(sender)?.strikeCount || 0;
  },

  resetLinkStrikes(sender) {
    db.prepare("DELETE FROM link_strikes WHERE id = ?").run(sender);
  },

  async handlePromoKick(sock, groupId, sender, reason = "Nyebar link promosi / invite grup") {
    await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(e =>
      console.log("Gagal kick promo-link:", e)
    );
    db.prepare("DELETE FROM link_strikes WHERE id = ?").run(sender);

    const strDate = formatTimestamp();
    const tag = `@${sender.split("@")[0]}`;

    const kickMsg = `╭━━• [ 🚷 *MAMPUS KENA KICK* (PROMOSI) ] •━━╮
┃
┃ 👤 *Target:* ${tag}
┃ 📝 *Pelanggaran:* ${reason}
┃ ⏰ *Waktu Eksekusi:* ${strDate}
┃ 💀 *Hukuman:* Kick langsung (zero tolerance)
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    return sock.sendMessage(groupId, { text: kickMsg, mentions: [sender] });
  },

  async handleLinkViolation(sock, groupId, sender, reason = "Nyebar link") {
    const max = config.antiLinkMaxStrike ?? config.maxWarn;
    let count = this.getLinkStrikes(sender);
    count++;
    db.prepare("INSERT OR REPLACE INTO link_strikes (id, strikeCount) VALUES (?, ?)").run(sender, count);

    const strDate = formatTimestamp();
    const tag = `@${sender.split("@")[0]}`;

    if (count >= max) {
      await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(e =>
        console.log("Gagal kick anti-link:", e)
      );
      db.prepare("DELETE FROM link_strikes WHERE id = ?").run(sender);

      const kickMsg = `╭━━• [ 🚷 *MAMPUS KENA KICK* (ANTI-LINK) ] •━━╮
┃
┃ 👤 *Target:* ${tag}
┃ 📝 *Alasan:* ${reason} (${max}x peringatan)
┃ ⏰ *Waktu Eksekusi:* ${strDate}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      return sock.sendMessage(groupId, { text: kickMsg, mentions: [sender] });
    }

    const icon = reason.includes("media sosial") ? "📱" : "🔗";
    const warnMsg = `╭━━• [ ${icon} *PERINGATAN LINK* (${count}/${max}) ] •━━╮
┃
┃ 👤 *Target:* ${tag}
┃ 📝 *Pelanggaran:* ${reason}
┃ ⏰ *Waktu:* ${strDate}
┃ ⚠️ *Sisa toleransi:* ${max - count} kali lagi sebelum kick
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    return sock.sendMessage(groupId, { text: warnMsg, mentions: [sender] });
  },
};

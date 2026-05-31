// features/moderation.js — Anti-link & pelanggaran moderasi otomatis

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
  hasBlockedLink(text) {
    return antiLink.hasLink(text);
  },

  getLinkStrikes(sender) {
    return db.prepare("SELECT strikeCount FROM link_strikes WHERE id = ?").get(sender)?.strikeCount || 0;
  },

  resetLinkStrikes(sender) {
    db.prepare("DELETE FROM link_strikes WHERE id = ?").run(sender);
  },

  async handleLinkViolation(sock, groupId, sender) {
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
┃ 📝 *Alasan:* Nyebar link haram (${max}x pelanggaran)
┃ ⏰ *Waktu Eksekusi:* ${strDate}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      return sock.sendMessage(groupId, { text: kickMsg, mentions: [sender] });
    }

    const warnMsg = `╭━━• [ 🔗 *PELANGGARAN LINK* (${count}/${max}) ] •━━╮
┃
┃ 👤 *Target:* ${tag}
┃ 📝 *Pelanggaran:* Nyebar link haram
┃ ⏰ *Waktu:* ${strDate}
┃ ⚠️ *Sisa toleransi link:* ${max - count} kali lagi
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    return sock.sendMessage(groupId, { text: warnMsg, mentions: [sender] });
  },
};

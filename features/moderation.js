// features/moderation.js — Anti-link: promo kick langsung, sosial/lain warn dulu (Neon PostgreSQL)

const config = require("../config");
const { sql } = require("../database/db");
const antiLink = require("./antiLink");

function formatTimestamp() {
  const d = new Date();
  return `${d.toLocaleDateString("id-ID")} | ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;
}

module.exports = {
  analyzeViolation(text, extraWhitelist = []) {
    return antiLink.classifyText(text, extraWhitelist);
  },

  hasBlockedLink(text, extraWhitelist = []) {
    return antiLink.classifyText(text, extraWhitelist).action !== "none";
  },

  async getLinkStrikes(sender) {
    const rows = await sql`SELECT "strikeCount" FROM link_strikes WHERE id = ${sender}`;
    return rows[0]?.strikeCount || 0;
  },

  async resetLinkStrikes(sender) {
    await sql`DELETE FROM link_strikes WHERE id = ${sender}`;
  },

  async handlePromoKick(sock, groupId, sender, reason = "Nyebar link promosi / invite grup") {
    await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(e =>
      console.log("Gagal kick promo-link:", e)
    );
    await sql`DELETE FROM link_strikes WHERE id = ${sender}`;

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
    let count = await this.getLinkStrikes(sender);
    count++;
    
    await sql`
      INSERT INTO link_strikes (id, "strikeCount") VALUES (${sender}, ${count})
      ON CONFLICT (id) DO UPDATE SET "strikeCount" = EXCLUDED."strikeCount"
    `;

    const strDate = formatTimestamp();
    const tag = `@${sender.split("@")[0]}`;

    if (count >= max) {
      await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(e =>
        console.log("Gagal kick anti-link:", e)
      );
      await sql`DELETE FROM link_strikes WHERE id = ${sender}`;

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

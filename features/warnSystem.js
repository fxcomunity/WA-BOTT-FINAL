// features/warnSystem.js — Sistem Warn, Kick Otomatis (Neon PostgreSQL)

const config = require("../config");
const { sql } = require('../database/db');

module.exports = {
  async warn(sock, msg, groupId, sender, args) {
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) return sock.sendMessage(groupId, { text: "❌ Tag dulu orangnya bego! Contoh: !warn @user alasan atau reply pesan target dengan !warn" }, { quoted: msg });

    let rows = await sql`SELECT "warnCount" FROM warns WHERE id = ${target}`;
    let count = rows[0]?.warnCount || 0;
    count++;
    
    await sql`
      INSERT INTO warns (id, "warnCount") VALUES (${target}, ${count})
      ON CONFLICT (id) DO UPDATE SET "warnCount" = EXCLUDED."warnCount"
    `;
    
    const max   = config.maxWarn;
    const alasan = args.slice(1).join(" ") || "Cari ribut / ngelanggar aturan";
    
    const dDate = new Date();
    const strDate = `${dDate.toLocaleDateString('id-ID')} | ${dDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    if (count >= max) {
      await sock.groupParticipantsUpdate(groupId, [target], "remove");
      await sql`DELETE FROM warns WHERE id = ${target}`;
      const kickMsg = `╭━━• [ 🚷 *MAMPUS KENA KICK* ] •━━╮
┃
┃ 👤 *Target:* @${target.split("@")[0]}
┃ 📝 *Alasan:* Dosanya udah numpuk (${max}x SP)
┃ ⏰ *Waktu Dieksekusi:* ${strDate}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      return sock.sendMessage(groupId, { text: kickMsg, mentions: [target] });
    }

    const warnMsg = `╭━━• [ ⚠️ *SURAT PERINGATAN (SP)* (${count}/${max}) ] •━━╮
┃
┃ 👤 *Target:* @${target.split("@")[0]}
┃ 📝 *Dosa:* ${alasan}
┃ ⏰ *Waktu Kejadian:* ${strDate}
┃ ⚠️ *Sisa Nyawa:* ${max - count} kali lagi
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    return sock.sendMessage(groupId, { text: warnMsg, mentions: [target] });
  },

  async resetWarn(sender) {
    await sql`DELETE FROM warns WHERE id = ${sender}`;
  },

  async getWarnList() {
    const entries = await sql`SELECT * FROM warns`;
    if (entries.length === 0) return "✅ Bersih ngab! Kaga ada yg punya SP.";
    return "📋 *Daftar Orang Bermasalah:*\n" + entries.map(v => `• ${v.id.split("@")[0]}: ${v.warnCount}x SP`).join("\n");
  },

  async getWarn(sender) {
    const rows = await sql`SELECT "warnCount" FROM warns WHERE id = ${sender}`;
    return rows[0]?.warnCount || 0;
  },

  async autoWarn(sock, groupId, sender, alasan = "Melanggar aturan grup") {
    let rows = await sql`SELECT "warnCount" FROM warns WHERE id = ${sender}`;
    let count = rows[0]?.warnCount || 0;
    count++;
    
    await sql`
      INSERT INTO warns (id, "warnCount") VALUES (${sender}, ${count})
      ON CONFLICT (id) DO UPDATE SET "warnCount" = EXCLUDED."warnCount"
    `;
    
    const max = config.maxWarn;

    const dDate = new Date();
    const strDate = `${dDate.toLocaleDateString('id-ID')} | ${dDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    if (count >= max) {
      await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(e => console.log("Gagal kick auto-warn:", e));
      await sql`DELETE FROM warns WHERE id = ${sender}`;
      const kickMsg = `╭━━• [ 🚷 *MAMPUS KENA KICK* (AUTO) ] •━━╮
┃
┃ 👤 *Target:* @${sender.split("@")[0]}
┃ 📝 *Alasan:* ${alasan} (${max}x SP)
┃ ⏰ *Waktu Eksekusi:* ${strDate}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      return sock.sendMessage(groupId, { text: kickMsg, mentions: [sender] });
    }

    const warnMsg = `╭━━• [ ⚠️ *SURAT PERINGATAN (SP)* (${count}/${max}) ] •━━╮
┃
┃ 👤 *Target:* @${sender.split("@")[0]}
┃ 📝 *Dosa:* ${alasan}
┃ ⏰ *Waktu Kejadian:* ${strDate}
┃ ⚠️ *Sisa Nyawa:* ${max - count} kali lagi
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    return sock.sendMessage(groupId, { text: warnMsg, mentions: [sender] });
  },
};

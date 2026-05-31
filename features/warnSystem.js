// features/warnSystem.js — Sistem Warn, Kick Otomatis

const config = require("../config");
const db = require('../database/db');

module.exports = {
  async warn(sock, msg, groupId, sender, args) {
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return sock.sendMessage(groupId, { text: "❌ Tag dulu orangnya bego! Contoh: !warn @user alasan" });

    let count = db.prepare('SELECT warnCount FROM warns WHERE id = ?').get(target)?.warnCount || 0;
    count++;
    db.prepare('INSERT OR REPLACE INTO warns (id, warnCount) VALUES (?, ?)').run(target, count);
    const max   = config.maxWarn;
    const alasan = args.slice(1).join(" ") || "Cari ribut / ngelanggar aturan";
    
    const dDate = new Date();
    const strDate = `${dDate.toLocaleDateString('id-ID')} | ${dDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    if (count >= max) {
      await sock.groupParticipantsUpdate(groupId, [target], "remove");
      db.prepare('DELETE FROM warns WHERE id = ?').run(target);
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

  resetWarn(sender) {
    db.prepare('DELETE FROM warns WHERE id = ?').run(sender);
  },

  getWarnList() {
    const entries = db.prepare('SELECT * FROM warns').all();
    if (entries.length === 0) return "✅ Bersih ngab! Kaga ada yg punya SP.";
    return "📋 *Daftar Orang Bermasalah:*\n" + entries.map(v => `• ${v.id.split("@")[0]}: ${v.warnCount}x SP`).join("\n");
  },

  getWarn(sender) {
    return db.prepare('SELECT warnCount FROM warns WHERE id = ?').get(sender)?.warnCount || 0;
  },
};

// features/lockGroup.js — Fitur Lock Grup (Owner Only)

const lockTimers = {};

module.exports = {
  async lock(sock, groupId) {
    await sock.groupSettingUpdate(groupId, "announcement");
    return `╭━━• [ 🔒 *GRUP DIGEMBOK* ] •━━╮
┃
┃ Berisik bet lu pada, grup gue gembok!
┃ Skrg cuma Admin yg bisa ngoceh.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
  },

  async unlock(sock, groupId, timeStr) {
    if (lockTimers[groupId]) {
      clearTimeout(lockTimers[groupId]);
      delete lockTimers[groupId];
    }

    if (timeStr) {
      const match = timeStr.match(/^(\d{1,2})[.:](\d{2})/);
      if (!match) return "❌ Format jam salah njir! Pake format 24 jam. Contoh: !unlock 06.00";
      
      let targetHour = parseInt(match[1]);
      let targetMinute = parseInt(match[2]);
      
      // Ambil waktu saat ini dalam WIB (UTC+7)
      const now = new Date();
      const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wibNow = new Date(utcNow + (7 * 3600000));
      
      let targetDate = new Date(wibNow);
      targetDate.setHours(targetHour, targetMinute, 0, 0);
      
      // Jika jam yang dituju udah lewat hari ini, jadwalkan untuk besok
      if (targetDate.getTime() <= wibNow.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const delay = targetDate.getTime() - wibNow.getTime();
      
      lockTimers[groupId] = setTimeout(async () => {
        try {
          await sock.groupSettingUpdate(groupId, "not_announcement");
          await sock.sendMessage(groupId, { text: `╭━━• [ 🔓 *GRUP DIBUKA* ] •━━╮\n┃\n┃ Sesuai jadwal bos, grup udah\n┃ gue buka otomatis. Bisa bacot!\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯` });
        } catch (err) {}
      }, delay);

      const hh = String(targetHour).padStart(2, "0");
      const mm = String(targetMinute).padStart(2, "0");
      const witaH = String((targetHour + 1) % 24).padStart(2, "0");
      const witH = String((targetHour + 2) % 24).padStart(2, "0");

      return `╭━━• [ ⏳ *JADWAL BUKA GEMBOK* ] •━━╮
┃
┃ ✅ *Sip santuy!* Grup bakal otomatis
┃ dibuka pas jam:
┃
┣━━ 🕛 *${hh}:${mm} WIB*
┣━━ 🕐 *${witaH}:${mm} WITA*
┣━━ 🕑 *${witH}:${mm} WIT*
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    }

    await sock.groupSettingUpdate(groupId, "not_announcement");
    return `╭━━• [ 🔓 *GRUP DIBUKA* ] •━━╮
┃
┃ Gembok udah gue copot njir!
┃ Skrg lu semua udah bebas bacot lagi.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
  },
};

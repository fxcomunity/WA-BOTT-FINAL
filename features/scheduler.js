// features/scheduler.js — Auto Scheduler
const cron        = require('node-cron');
const config      = require('../config');
const komikTracker = require('./komikTracker');

module.exports = {
  start: (sock) => {
    console.log("⏰ Auto Scheduler diaktifkan!");

    // 1. Laporan pagi ke owner jam 07:00
    cron.schedule('0 7 * * *', async () => {
      console.log("⏰ Menjalankan rutinitas Pagi (07:00) - Broadcast ke Owner");
      try {
        const ownerId = config.owners[0] + "@s.whatsapp.net";
        const date    = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const msgText = `🌅 *SELAMAT PAGI OWNER!*\n\n📅 Tanggal: ${date}\n✅ Sistem JackBOT v3.0.0 berjalan dengan lancar.\nSemua limit sistem harian otomatis telah disiapkan.\n\nSemoga harimu menyenangkan! 🚀`;
        await sock.sendMessage(ownerId, { text: msgText });
      } catch (e) {
        console.error("Gagal bos ngirim laporan harian:", e);
      }
    });

    // 2. 📚 KOMIK TRACKER — cek update tiap 30 menit
    cron.schedule('*/30 * * * *', async () => {
      console.log(`[TRACKER] 🔍 Ngecek update komik... (${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB)`);
      try {
        await komikTracker.checkAllComics(sock);
      } catch (e) {
        console.error('[TRACKER] Error:', e.message);
      }
    });

    console.log("📚 Komik Tracker aktif — ngecek tiap 30 menit!");
    console.log(`📋 Tracking ${komikTracker.TRACKED_COMICS.length} komik`);
  }
};
// features/scheduler.js — Auto Scheduler
const cron = require('node-cron');
const config = require('../config');

module.exports = {
  start: (sock) => {
    console.log("⏰ Auto Scheduler diaktifkan!");

    // 1. Membersihkan cache internal atau logs tiap jam 12 malam (00:00)
    // Walaupun limit reset-nya berbasis waktu individual (passive), 
    // kita bisa memberikan laporan otomatis ke Owner setiap pagi (07:00).
    cron.schedule('0 7 * * *', async () => {
      console.log("⏰ Menjalankan rutinitas Pagi (07:00) - Broadcast ke Owner");
      
      try {
        const ownerId = config.owners[0] + "@s.whatsapp.net"; // Kirim ke owner pertama
        const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const msgText = `🌅 *SELAMAT PAGI OWNER!*\n\n📅 Tanggal: ${date}\n✅ Sistem JackBOT v3.0.0 berjalan dengan lancar.\nSemua limit sistem harian otomatis telah disiapkan.\n\nSemoga harimu menyenangkan! 🚀`;
        
        await sock.sendMessage(ownerId, { text: msgText });
      } catch (e) {
        console.error("Gagal bos ngirim laporan harian:", e);
      }
    });

    // 2. Bisa ditambahkan jadwal rutin lain di sini ke depannya.
    // Contoh untuk ngingetin sholat jumat tiap jam 11:30 hari Jumat:
    // cron.schedule('30 11 * * 5', () => { ... })
  }
};
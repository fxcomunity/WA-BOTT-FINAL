// features/scheduler.js — Auto Scheduler
const cron        = require('node-cron');
const config      = require('../config');
const komikTracker = require('./komikTracker');
const axios       = require('axios');

async function checkAndBroadcastHoliday(sock) {
  try {
    const dNow = new Date();
    // Gunakan WIB (UTC+7) timezone
    const offset = 7;
    const utc = dNow.getTime() + (dNow.getTimezoneOffset() * 60000);
    const wibDate = new Date(utc + (3600000 * offset));
    
    const year = wibDate.getFullYear();
    const month = String(wibDate.getMonth() + 1).padStart(2, '0');
    const day = String(wibDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; // Format YYYY-MM-DD
    
    console.log(`[HOLIDAY] Checking holiday for date: ${todayStr}`);
    
    const res = await axios.get(`https://api-hari-libur.vercel.app/api?year=${year}`, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      timeout: 10000 
    });
    
    if (res.data && res.data.status === "success") {
      const holiday = res.data.data.find(h => h.date === todayStr);
      if (holiday) {
        console.log(`[HOLIDAY] Today is a holiday: ${holiday.description}`);
        
        // Buat ucapan yang indah
        const desc = holiday.description;
        let ucapanSpesifik = "Selamat memperingati hari besar nasional. Semoga hari ini membawa kedamaian, kebahagiaan, dan berkah melimpah bagi kita semua.";
        
        const descLower = desc.toLowerCase();
        if (descLower.includes("idul fitri")) {
          ucapanSpesifik = "Minal Aidin Wal Faizin, mohon maaf lahir dan batin. Semoga keberkahan, kedamaian, dan fitrah suci senantiasa menyertai setiap langkah hidup kita.";
        } else if (descLower.includes("idul adha")) {
          ucapanSpesifik = "Selamat Hari Raya Idul Adha. Semoga semangat pengorbanan dan ketulusan Nabi Ibrahim mempererat persaudaraan, mendatangkan keberkahan, serta kedamaian bagi sesama.";
        } else if (descLower.includes("natal")) {
          ucapanSpesifik = "Selamat Hari Raya Natal. Damai di bumi, damai di hati. Semoga kehangatan kasih Natal membawa sukacita yang melimpah dan terang bagi kita semua.";
        } else if (descLower.includes("waisak")) {
          ucapanSpesifik = "Selamat Hari Raya Waisak. Sabbe Satta Bhavantu Sukhitatta. Semoga semua makhluk hidup selamanya dalam kebahagiaan, kedamaian, dan bebas dari penderitaan.";
        } else if (descLower.includes("nyepi")) {
          ucapanSpesifik = "Selamat Hari Suci Nyepi. Dalam keheningan sepi, semoga kita dapat melakukan refleksi diri untuk menemukan kedamaian hati dan kesucian jiwa.";
        } else if (descLower.includes("kemerdekaan") || descLower.includes("pancasila")) {
          ucapanSpesifik = "Dirgahayu Republik Indonesia! Mari kita perkokoh persatuan, kerukunan, dan nilai Pancasila untuk mewujudkan bangsa yang damai, adil, dan sejahtera.";
        } else if (descLower.includes("imlek")) {
          ucapanSpesifik = "Gong Xi Fa Cai! Selamat Tahun Baru Imlek. Semoga tahun ini membawa kesehatan yang prima, keberuntungan melimpah, dan kebahagiaan bagi Anda sekeluarga.";
        } else if (descLower.includes("yesus kristus") || descLower.includes("paskah") || descLower.includes("jumat agung")) {
          ucapanSpesifik = "Selamat memperingati hari suci bagi umat Kristiani. Semoga kasih karunia, kedamaian, dan berkat yang melimpah senantiasa menaungi kehidupan kita.";
        } else if (descLower.includes("islam") || descLower.includes("mi'raj") || descLower.includes("maulid")) {
          ucapanSpesifik = "Selamat memperingati Hari Raya Umat Islam. Semoga momen ini mempertebal iman, ketakwaan, serta mendatangkan keberkahan dan kebaikan bagi kita semua.";
        }
        
        // Format Tanggal Cantik
        const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const bulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const namaHari = hariArr[wibDate.getDay()];
        const namaBulan = bulanArr[wibDate.getMonth()];
        const tanggalCantik = `${namaHari}, ${wibDate.getDate()} ${namaBulan} ${year}`;
        
        const broadcastMsg = `╭━━━• [ 📢 *PENGUMUMAN HARI BESAR* ] •━━━╮
┃
┃ 🌟 *Selamat Merayakan Hari Raya!*
┃ 
┃ 📅 *Hari/Tanggal:* ${tanggalCantik}
┃ 📌 *Peringatan:* _${desc}_
┃
┃ ${ucapanSpesifik}
┃
┃ 🕊️ _Salam toleransi dan kerukunan umat beragama._
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        const participatingGroups = await sock.groupFetchAllParticipating();
        let successCount = 0;
        
        for (const gId in participatingGroups) {
          try {
            await sock.sendMessage(gId, { text: broadcastMsg });
            successCount++;
            await new Promise(r => setTimeout(r, 2000)); // Delay 2 detik biar ga spam/rate limit
          } catch(e) {
            console.error(`[HOLIDAY] Gagal kirim ke grup ${gId}:`, e.message);
          }
        }
        console.log(`[HOLIDAY] Broadcast hari besar terkirim ke ${successCount} grup!`);
      } else {
        console.log("[HOLIDAY] Today is not a national holiday.");
      }
    }
  } catch (err) {
    console.error("[HOLIDAY] Error checking/broadcasting holiday:", err.message);
  }
}

module.exports = {
  checkAndBroadcastHoliday,
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

    // 3. 📢 HARI BESAR BROADCAST — cek tiap jam 08:00 pagi
    cron.schedule('0 8 * * *', async () => {
      console.log("[HOLIDAY] Menjalankan pengecekan hari besar harian (08:00)...");
      await checkAndBroadcastHoliday(sock);
    });

    console.log("📚 Komik Tracker aktif — ngecek tiap 30 menit!");
    console.log(`📋 Tracking ${komikTracker.TRACKED_COMICS.length} komik`);
    console.log("📢 Holiday Auto Broadcast aktif — ngecek tiap jam 08:00 pagi!");
  }
};
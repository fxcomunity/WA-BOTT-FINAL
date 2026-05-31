const axios = require('axios');
const utils = require('./utils');

const devCaption = `╭━━• [ 📥 *DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;

module.exports = {
  youtube: async (sock, msg, args) => { 
    const groupId = msg.key.remoteJid;
    const link = args[0];
    
    if (!link || (!link.includes('youtube.com') && !link.includes('youtu.be'))) {
      return sock.sendMessage(groupId, { text: "❌ Mana link YouTube-nya bos? Contoh:\n!yt https://youtu.be/xxxx" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Memproses video YouTube...");

    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const os = require('os');
      const ytdlpBin = os.platform() === 'win32' ? '.\\yt-dlp.exe' : 'yt-dlp';
      const cmd = `${ytdlpBin} -j --no-warnings -f "best[ext=mp4]/best" "${link}"`;
      const { stdout } = await execPromise(cmd);
      
      const data = JSON.parse(stdout);
      const videoUrl = data.url;
      const title = data.title || "YouTube Video";
      const fileSize = data.filesize || data.filesize_approx || 0;
      const customCaption = `╭━━• [ 📥 *YOUTUBE DOWNLOADER* ] •━━╮\n┃\n┃ 🎬 *Judul:* ${title}\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      if (fileSize > 100 * 1024 * 1024) { // Lebih dari 100MB
        await progress.stop(false);
        return sock.sendMessage(groupId, { 
          text: `❌ Video *${title}* terlalu raksasa (${Math.round(fileSize/1024/1024)}MB).\n\nBisa unduh secara manual melalui link berikut:\n🔗 ${videoUrl}` 
        }, { quoted: msg });
      } else if (fileSize > 50 * 1024 * 1024) { // 50MB - 100MB (Kirim sebagai Dokumen)
        await progress.stop(true);
        await sock.sendMessage(groupId, { text: `⚠️ Video *${title}* berukuran ${Math.round(fileSize/1024/1024)}MB. Karena melebihi 50MB, bot akan ngirimkannya dalam bentuk **Dokumen/File** agar tidak ditolak WhatsApp...` }, { quoted: msg });
        await sock.sendMessage(groupId, { 
          document: { url: videoUrl }, 
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption: customCaption 
        }, { quoted: msg });
      } else { // Di bawah 50MB (Kirim sebagai Video biasa)
        await progress.stop(true);
        await sock.sendMessage(groupId, { 
          video: { url: videoUrl }, 
          caption: customCaption 
        }, { quoted: msg });
      }
      
      await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
    } catch (error) {
      await progress.stop(false);
      console.log("YouTube Error:", error.message || error);
      await sock.sendMessage(groupId, { text: "❌ Gagal bos download video. Pastiin link valid atau server tidak diblokir YouTube." }, { quoted: msg });
    }
  },
  
  tiktok: async (sock, msg, args) => { 
    const groupId = msg.key.remoteJid;
    const link = args[0]; 
    
    if (!link || !link.includes('tiktok.com')) {
      return sock.sendMessage(groupId, { text: "❌ Mana link TikTok-nya bos? Contoh:\n!tt https://vt.tiktok.com/xxxx/" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Memproses video TikTok...");

    try {
      const { data } = await axios.post('https://www.tikwm.com/api/', { url: link });
      
      if (data.code === 0 && data.data) {
        const videoData = data.data;
        const videoUrl = videoData.play;
        const title = videoData.title || "TikTok Video";
        const author = videoData.author?.nickname || "Unknown";

        const caption = `╭━━• [ 🎵 *TIKTOK DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Kreator:* ${author}\n┃ 📝 *Deskripsi:* ${title}\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *No Watermark!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;

        await progress.stop(true);
        await sock.sendMessage(groupId, { video: { url: videoUrl }, caption: caption }, { quoted: msg });
        await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
      } else {
        await progress.stop(false);
        await sock.sendMessage(groupId, { text: "❌ Gagal bos download video. Pastiin link publik!" }, { quoted: msg });
      }
    } catch (error) {
      await progress.stop(false);
      console.log("TikTok Error:", error);
      await sock.sendMessage(groupId, { text: "❌ Ada error njir pada server downloader." }, { quoted: msg });
    }
  },
  
  instagram: async (sock, msg, args) => { 
    const groupId = msg.key.remoteJid;
    const link = args[0];
    if (!link || !link.includes('instagram.com')) {
      return sock.sendMessage(groupId, { text: "❌ Mana link Instagram-nya bos? Contoh:\n!ig https://www.instagram.com/reel/xxxx" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Memproses konten Instagram...");

    try {
      const { igdl } = require('btch-downloader');
      const data = await igdl(link);
      
      if (data && data.status && data.result && data.result.length > 0) {
        // Ambil HANYA 1 MEDIA yang URL-nya valid
        const validMedia = data.result.find(item => item.url && item.url.trim() !== '');
        
        if (!validMedia) {
          throw new Error("API mengembalikan array kosong atau URL tidak valid");
        }
        
        const mediaUrl = validMedia.url;
        const isImage = mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.webp') || mediaUrl.includes('.png');
        
        // Verifikasi apakah URL ini BUKAN HTML/Captcha dari server scraper
        try {
          const axios = require('axios');
          const headRes = await axios.head(mediaUrl);
          const contentType = headRes.headers['content-type'] || '';
          if (contentType.includes('text/html')) {
             throw new Error("URL berisi halaman HTML/Captcha, bukan file media asli");
          }
        } catch (e) {
          if (e.message.includes('HTML')) throw e; // Lanjutkan error HTML
          // Abaikan error head lain (misal 405 Method Not Allowed)
        }

        await progress.stop(true);
        if (isImage) {
          await sock.sendMessage(groupId, { 
            image: { url: mediaUrl }, 
            caption: devCaption 
          }, { quoted: msg });
        } else {
          await sock.sendMessage(groupId, { 
            video: { url: mediaUrl }, 
            caption: devCaption 
          }, { quoted: msg });
        }
        await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
      } else {
        await progress.stop(false);
        await sock.sendMessage(groupId, { text: "❌ Gagal bos download postingan Instagram. (Video/Foto tidak ketemu)" }, { quoted: msg });
      }
    } catch (error) {
      await progress.stop(false);
      console.log("IG Error:", error.message || error);
      await sock.sendMessage(groupId, { text: "❌ Gagal bos download Instagram. Pastiin link publik (tidak diprivate) atau coba beberapa saat lagi." }, { quoted: msg });
    }
  },
  
  pinterest: async (sock, msg, sender, args) => {
    const groupId = msg.key.remoteJid;
    const query = args.join(" ");
    
    if (!query) {
      return sock.sendMessage(groupId, { text: "❌ Masukkan kata kunci! Contoh: !pin jokowi" }, { quoted: msg });
    }

    // Reaction loading (optional, tapi bagus buat feedback)
    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Mencari gambar Pinterest...");

    try {
      const { pinterest } = require('btch-downloader');
      const data = await pinterest(query);
      
      const images = data?.result?.result?.result;
      if (data && data.status && images && images.length > 0) {
        // Ambil HANYA 1 secara acak agar bervariasi jika di-search berkali-kali
        const randomImage = images[Math.floor(Math.random() * images.length)];
        
        await progress.stop(true);
        // Kirim hasil ke JAPRI (nomor pengirim)
        await sock.sendMessage(sender, { 
          image: { url: randomImage }, 
          caption: `📌 *PINTEREST SEARCH*\n\n🔎 Kata Kunci: *${query}*\n👤 Developer: 陈嘉杰 | Val` 
        });
        
        // Beri reaksi ceklis di grup
        await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
      } else {
        await progress.stop(false);
        await sock.sendMessage(groupId, { text: "❌ Gambar tidak ketemu." }, { quoted: msg });
      }
    } catch (error) {
      await progress.stop(false);
      console.log("Pinterest Error:", error.message || error);
      await sock.sendMessage(groupId, { text: "❌ Ada error njir saat mencari gambar di Pinterest." }, { quoted: msg });
    }
  },

  fb: async (sock, msg, args) => {
    const groupId = msg.key.remoteJid;
    const link = args[0];
    if (!link || !link.includes('facebook.com') && !link.includes('fb.watch') && !link.includes('fb.com')) {
      return sock.sendMessage(groupId, { text: "❌ Link salah! Contoh: !fb https://www.facebook.com/watch/?v=123" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Memproses video Facebook...");

    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      const os = require('os');
      const ytdlpBin = os.platform() === 'win32' ? '.\\yt-dlp.exe' : 'yt-dlp';
      
      const cmd = `${ytdlpBin} -j --no-warnings -f "best[ext=mp4]/best" "${link}"`;
      const { stdout } = await execPromise(cmd);
      const data = JSON.parse(stdout);
      
      const videoUrl = data.url;
      const customCaption = `╭━━• [ 📥 *FB DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      await progress.stop(true);
      await sock.sendMessage(groupId, { video: { url: videoUrl }, caption: customCaption }, { quoted: msg });
    } catch (error) {
      await progress.stop(false);
      console.log("FB Error:", error.message || error);
      await sock.sendMessage(groupId, { text: "❌ Gagal bos download Facebook. Link salah, diprivat, atau diblokir." }, { quoted: msg });
    }
  },

  tw: async (sock, msg, args) => {
    const groupId = msg.key.remoteJid;
    const link = args[0];
    if (!link || (!link.includes('twitter.com') && !link.includes('x.com'))) {
      return sock.sendMessage(groupId, { text: "❌ Link salah! Contoh: !tw https://x.com/user/status/123" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Memproses video X/Twitter...");

    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      const os = require('os');
      const ytdlpBin = os.platform() === 'win32' ? '.\\yt-dlp.exe' : 'yt-dlp';
      
      const cmd = `${ytdlpBin} -j --no-warnings -f "best[ext=mp4]/best" "${link}"`;
      const { stdout } = await execPromise(cmd);
      const data = JSON.parse(stdout);
      
      const videoUrl = data.url;
      const customCaption = `╭━━• [ 📥 *X DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      await progress.stop(true);
      await sock.sendMessage(groupId, { video: { url: videoUrl }, caption: customCaption }, { quoted: msg });
    } catch (error) {
      await progress.stop(false);
      console.log("Twitter Error:", error.message || error);
      await sock.sendMessage(groupId, { text: "❌ Gagal bos download Twitter/X. Link salah, diprivat, atau diblokir." }, { quoted: msg });
    }
  }
};
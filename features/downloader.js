const axios = require('axios');
const utils = require('./utils');

const pendingTikTokDownloads = new Map();

const devCaption = `╭━━• [ 📥 *DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;

async function resolveDomainViaDoH(domain) {
  try {
    const dnsRes = await axios.get('https://cloudflare-dns.com/dns-query', {
      params: { name: domain, type: 'A' },
      headers: { 'Accept': 'application/dns-json' },
      timeout: 5000
    });
    const answers = dnsRes.data?.Answer;
    if (!answers || answers.length === 0) return null;
    for (const ans of answers) {
      if (ans.type === 1 && /^\d+\.\d+\.\d+\.\d+$/.test(ans.data)) {
        return ans.data;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

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
      const { spawn } = require('child_process');
      const os = require('os');
      const ytdlpBin = os.platform() === 'win32' ? '.\\yt-dlp.exe' : 'yt-dlp';
      const stdout = await new Promise((resolve, reject) => {
        const proc = spawn(ytdlpBin, ['-j','--no-warnings','-f','best[ext=mp4]/best', link]);
        let data = '';
        proc.stdout.on('data', (chunk) => data += chunk);
        proc.stderr.on('data', (chunk) => console.error('yt-dlp error:', chunk.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve(data);
          else reject(new Error(`yt-dlp exited with code ${code}`));
        });
      });
      
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

    const { jidNormalizedUser } = require('atexovi-baileys');
    let sender = msg.key.participant || msg.key.remoteJid;
    if (msg.key.fromMe) {
      sender = jidNormalizedUser(sock.user.id);
    } else {
      sender = jidNormalizedUser(sender);
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Memproses video TikTok...");

    try {
      const { data } = await axios.post('https://www.tikwm.com/api/', { url: link });
      
      if (data.code === 0 && data.data) {
        const videoData = data.data;
        const title = videoData.title || "TikTok Video";
        const author = videoData.author?.nickname || "Unknown";

        // Cek jika link berupa slideshow/gambar
        if (videoData.images && videoData.images.length > 0) {
          await progress.stop(true);
          
          const questionText = `⚠️ *[ TIKTOK DOWNLOADER ]* ⚠️\n\n` +
            `Link TikTok ini dideteksi berisi *Slideshow/Gambar* (bukan video mentah biasa).\n\n` +
            `Silakan pilih salah satu opsi format unduhan:\n` +
            `*A.* Gambar (Kirim semua foto asli secara terpisah)\n` +
            `*B.* Video (Kirim dalam bentuk video slideshow)\n\n` +
            `_Balas pesan ini dengan mengetik *A* atau *B*._`;
            
          const sentMsg = await sock.sendMessage(groupId, { text: questionText }, { quoted: msg });
          console.log(`[TIKTOK] Menyimpan sesi download untuk JID: ${sender} dengan ID Pesan: ${sentMsg.key.id}`);

          pendingTikTokDownloads.set(sentMsg.key.id, {
            videoData,
            link,
            groupId,
            sender,
            quotedMsg: msg,
            timestamp: Date.now()
          });
          return;
        }

        const videoUrl = videoData.play;
        const caption = `╭━━• [ 🎵 *TIKTOK DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Kreator:* ${author}\n┃ 📝 *Deskripsi:* ${title}\n┃ 📁 *Tipe File:* Video\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *No Watermark!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;

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
      const { spawn } = require('child_process');
      const os = require('os');
      const ytdlpBin = os.platform() === 'win32' ? '.\\yt-dlp.exe' : 'yt-dlp';
      
      const stdout = await new Promise((resolve, reject) => {
        const proc = spawn(ytdlpBin, ['-j', '--no-warnings', '-f', 'best[ext=mp4]/best', link]);
        let data = '';
        proc.stdout.on('data', (chunk) => data += chunk);
        proc.stderr.on('data', (chunk) => console.error('yt-dlp error:', chunk.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve(data);
          else reject(new Error(`yt-dlp exited with code ${code}`));
        });
      });

      const data = JSON.parse(stdout);
      const videoUrl = data.url;
      const customCaption = `╭━━• [ 📥 *FB DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      await progress.stop(true);
      await sock.sendMessage(groupId, { video: { url: videoUrl }, caption: customCaption }, { quoted: msg });
      await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
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
      const { spawn } = require('child_process');
      const os = require('os');
      const ytdlpBin = os.platform() === 'win32' ? '.\\yt-dlp.exe' : 'yt-dlp';
      
      const stdout = await new Promise((resolve, reject) => {
        const proc = spawn(ytdlpBin, ['-j', '--no-warnings', '-f', 'best[ext=mp4]/best', link]);
        let data = '';
        proc.stdout.on('data', (chunk) => data += chunk);
        proc.stderr.on('data', (chunk) => console.error('yt-dlp error:', chunk.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve(data);
          else reject(new Error(`yt-dlp exited with code ${code}`));
        });
      });

      const data = JSON.parse(stdout);
      const videoUrl = data.url;
      const customCaption = `╭━━• [ 📥 *X DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      await progress.stop(true);
      await sock.sendMessage(groupId, { video: { url: videoUrl }, caption: customCaption }, { quoted: msg });
      await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
    } catch (error) {
      await progress.stop(false);
      console.log("Twitter Error:", error.message || error);
      await sock.sendMessage(groupId, { text: "❌ Gagal bos download Twitter/X. Link salah, diprivat, atau diblokir." }, { quoted: msg });
    }
  },

  komik: async (sock, msg, args) => {
    const groupId = msg.key.remoteJid;
    const link = args[0];
    
    if (!link || !link.startsWith('http')) {
      return sock.sendMessage(groupId, { text: "❌ Masukkan link chapter komiknya bos!\nContoh: *!kmk https://v2.komikcast.fit/chapter/...*" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } }).catch(() => {});
    const progress = await utils.simulateProgress(sock, groupId, msg, "⏳ Sedang mengunduh halaman komik...");

    try {
      const cheerio = require('cheerio');
      const { PDFDocument } = require('pdf-lib');
      const { Jimp } = require('jimp');
      const fs = require('fs');
      const path = require('path');

      const imageUrls = [];
      const seen = new Set();
      let title = '';
      const https = require('https');

      // Bypass Komikcast React SPA API using DoH resolver
      if (link.includes('v2.komikcast.fit')) {
        const kcMatch = link.match(/v2\.komikcast\.fit\/series\/([a-zA-Z0-9_\-]+)\/chapter\/([a-zA-Z0-9_\-]+)/i);
        if (kcMatch) {
          const seriesSlug = kcMatch[1];
          const chapterSlug = kcMatch[2];
          const domain = 'be.komikcast.cc';
          
          try {
            const ip = await resolveDomainViaDoH(domain);
            if (ip) {
              const agent = new https.Agent({
                servername: domain,
                rejectUnauthorized: false
              });
              const apiUrl = `https://${ip}/series/${seriesSlug}/chapters/${chapterSlug}`;
              const apiRes = await axios.get(apiUrl, {
                headers: {
                  'Host': domain,
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  'Accept': 'application/json'
                },
                httpsAgent: agent,
                timeout: 15000
              });
              
              if (apiRes.data?.data?.data?.images) {
                const images = apiRes.data.data.data.images;
                images.forEach(img => {
                  if (img && img.startsWith('http') && !seen.has(img)) {
                    seen.add(img);
                    imageUrls.push(img);
                  }
                });
                const chIndex = apiRes.data.data.chapterIndex || chapterSlug;
                title = `${seriesSlug.replace(/-/g, ' ')} - Chapter ${chIndex}`;
              }
            }
          } catch (apiErr) {
            console.error("[KOMIKCAST BYPASS ERROR]:", apiErr.message);
          }
        }
      }

      // Fallback ke scraping HTML biasa jika bukan komikcast atau bypass gagal
      if (imageUrls.length === 0) {
        // Fetch HTML
        const res = await axios.get(link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          },
          timeout: 25000
        });

        const $ = cheerio.load(res.data);

        // Coba cari di readerarea komikcast/shinigami
        const readerImages = $('#readerarea img, .reader-area img');
        if (readerImages.length > 0) {
          readerImages.each((i, el) => {
            let src = $(el).attr('data-src') || $(el).attr('lazy-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
            if (src) {
              src = src.trim();
              if (src.startsWith('http') && !seen.has(src)) {
                seen.add(src);
                imageUrls.push(src);
              }
            }
          });
        }

        // Fallback ke entry-content / post-content
        if (imageUrls.length === 0) {
          $('.entry-content img, .post-content img').each((i, el) => {
            let src = $(el).attr('data-src') || $(el).attr('lazy-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
            if (src) {
              src = src.trim();
              if (src.startsWith('http') && !seen.has(src)) {
                seen.add(src);
                imageUrls.push(src);
              }
            }
          });
        }

        // Ambil Judul Chapter
        title = $('h1.entry-title').text().trim() 
                    || $('.headpost h1').text().trim() 
                    || $('.chapter-title').text().trim() 
                    || 'Chapter Komik';
      }

      if (imageUrls.length === 0) {
        await progress.stop(false);
        return sock.sendMessage(groupId, { text: "❌ Tidak menemukan gambar di chapter komik tersebut. Pastikan link benar dan dari situs yang didukung!" }, { quoted: msg });
      }

      title = title.replace(/[^a-zA-Z0-9\s-_]/g, '').trim(); // Bersihkan nama file

      await progress.update(`⏳ Mengunduh ${imageUrls.length} halaman gambar...`);

      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < imageUrls.length; i++) {
        const imgUrl = imageUrls[i];
        try {
          // Download image buffer
          const imgRes = await axios.get(imgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            responseType: 'arraybuffer',
            timeout: 25000
          });

          const imgBuffer = Buffer.from(imgRes.data);

          // Gunakan Jimp untuk konversi ke JPEG agar seragam dan support WebP
          const img = await Jimp.read(imgBuffer);
          const jpegBuffer = await img.getBuffer('image/jpeg');

          // Embed ke PDF
          const embedImg = await pdfDoc.embedJpg(new Uint8Array(jpegBuffer));
          const page = pdfDoc.addPage([embedImg.width, embedImg.height]);
          page.drawImage(embedImg, {
            x: 0,
            y: 0,
            width: embedImg.width,
            height: embedImg.height,
          });

          // Update progress sesekali agar user tahu
          if ((i + 1) % 10 === 0 || i === imageUrls.length - 1) {
            await progress.update(`⏳ Menyusun PDF: ${i + 1}/${imageUrls.length} halaman...`);
          }
        } catch (imgErr) {
          console.error(`Gagal download halaman ${i + 1}: ${imgUrl}`, imgErr.message);
          // Lewati halaman yang rusak/gagal download
        }
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      
      // Simpan sementara di workspace
      const tempPath = path.join(__dirname, '..', `temp_${Date.now()}.pdf`);
      fs.writeFileSync(tempPath, pdfBytes);

      await progress.stop(true);
      await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } }).catch(() => {});

      // Kirim dokumen PDF ke WA
      await sock.sendMessage(groupId, {
        document: fs.readFileSync(tempPath),
        mimetype: 'application/pdf',
        fileName: `${title}.pdf`,
        caption: `╭━━• [ 📥 *KOMIK DOWNLOADER* ] •━━╮\n┃\n┃ 📕 *Judul:* ${title}\n┃ 📑 *Total:* ${imageUrls.length} Halaman\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *Sukses diunduh!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
      }, { quoted: msg });

      // Hapus file temp
      fs.unlinkSync(tempPath);

    } catch (error) {
      await progress.stop(false);
      console.error("Komik download error:", error);
      await sock.sendMessage(groupId, { text: `❌ Gagal mengunduh komik. Error: ${error.message}` }, { quoted: msg });
    }
  },
  
  handlePendingTikTok: async (sock, msg, sender, body) => {
    const choice = body.trim().charAt(0).toUpperCase();
    if (choice !== 'A' && choice !== 'B') {
      return false;
    }

    const quotedMsgId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    let sessionKey = null;

    console.log(`[TIKTOK] Menerima input: "${body}" dari JID: ${sender}. Quoted Msg ID: ${quotedMsgId}. Daftar sesi aktif:`, [...pendingTikTokDownloads.keys()]);

    if (quotedMsgId && pendingTikTokDownloads.has(quotedMsgId)) {
      sessionKey = quotedMsgId;
    } else {
      // Fallback: cari berdasarkan sender JID
      for (const [key, value] of pendingTikTokDownloads.entries()) {
        if (value.sender === sender && (Date.now() - value.timestamp < 300000)) {
          sessionKey = key;
          break;
        }
      }
    }

    if (!sessionKey) {
      console.log(`[TIKTOK] Tidak ada sesi aktif yang cocok untuk JID: ${sender} atau Quoted Msg ID: ${quotedMsgId}`);
      return false;
    }
    
    const session = pendingTikTokDownloads.get(sessionKey);
    // Hapus sesi agar tidak bisa dipicu berulang-ulang
    pendingTikTokDownloads.delete(sessionKey);
    
    if (Date.now() - session.timestamp > 300000) {
      console.log(`[TIKTOK] Sesi ditemukan tetapi sudah kedaluwarsa.`);
      return false;
    }
    
    const { videoData, groupId, quotedMsg } = session;
    const title = videoData.title || "TikTok Video";
    const author = videoData.author?.nickname || "Unknown";
    
    await sock.sendMessage(groupId, { react: { text: "⏳", key: msg.key } });
    
    if (choice === 'A') {
      try {
        const images = videoData.images;
        if (!images || images.length === 0) {
          await sock.sendMessage(groupId, { text: "❌ Tidak menemukan gambar pada data TikTok ini." }, { quoted: msg });
          return true;
        }
        
        const caption = `╭━━• [ 🎵 *TIKTOK DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Kreator:* ${author}\n┃ 📝 *Deskripsi:* ${title}\n┃ 📁 *Tipe File:* Gambar\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *No Watermark!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        
        for (let i = 0; i < images.length; i++) {
          const imgUrl = images[i];
          if (i === 0) {
            await sock.sendMessage(groupId, { image: { url: imgUrl }, caption: caption }, { quoted: quotedMsg });
          } else {
            await sock.sendMessage(groupId, { image: { url: imgUrl } });
          }
        }
        await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
      } catch (e) {
        console.error("TikTok Images Send Error:", e);
        await sock.sendMessage(groupId, { text: "❌ Gagal mengirim gambar TikTok." }, { quoted: msg });
      }
    } else if (choice === 'B') {
      try {
        const videoUrl = videoData.play;
        const caption = `╭━━• [ 🎵 *TIKTOK DOWNLOADER* ] •━━╮\n┃\n┃ 👤 *Kreator:* ${author}\n┃ 📝 *Deskripsi:* ${title}\n┃ 📁 *Tipe File:* Video\n┃ 👤 *Developer:* 陈嘉杰 | Val\n┃ ✅ *No Watermark!*\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        
        await sock.sendMessage(groupId, { video: { url: videoUrl }, caption: caption }, { quoted: quotedMsg });
        await sock.sendMessage(groupId, { react: { text: "✅", key: msg.key } });
      } catch (e) {
        console.error("TikTok Video Send Error:", e);
        await sock.sendMessage(groupId, { text: "❌ Gagal mengirim video TikTok." }, { quoted: msg });
      }
    }
    
    return true;
  }
};
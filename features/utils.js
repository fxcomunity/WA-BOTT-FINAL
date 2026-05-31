const axios = require('axios');

module.exports = {
  cuaca: async (kota) => { 
    if (!kota) return "❌ Format salah! Contoh: !cuaca Jakarta";
    try {
      const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(kota)}?format=%l:+%C+%t+(Terasa+seperti+%f)+%w+%h`);
      return `🌤️ *INFO CUACA*\n\n${data.trim()}`;
    } catch (e) {
      return "❌ Gagal bos mengambil data cuaca. Pastiin nama kota benar.";
    }
  },
  
  kurs: async (mataUang) => { 
    if (!mataUang) return "❌ Format salah! Contoh: !kurs USD";
    try {
      const code = mataUang.toUpperCase();
      const { data } = await axios.get(`https://api.exchangerate-api.com/v4/latest/${code}`);
      const idr = data.rates.IDR;
      if (!idr) return `❌ Mata uang ${code} tidak ketemu.`;
      
      // Format number to Rupiah
      const formattedIdr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(idr);
      return `💱 *KURS MATA UANG*\n\n1 ${code} = ${formattedIdr}`;
    } catch (e) {
      return "❌ Gagal bos mengambil data kurs. Gunakan kode valid (misal: USD, EUR, JPY).";
    }
  },
  
  buatQR: async (sock, msg, text) => {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format salah! Contoh: !qr https://google.com atau !qr Halo dunia" }, { quoted: msg });
    }
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
    await sock.sendMessage(msg.key.remoteJid, {
      image: { url: apiUrl },
      caption: `✅ *QR Code Sukses Dibuat!*\n\nData: ${text}`
    }, { quoted: msg });
  },
  
  setReminder: async (sock, msg, sender, args) => { 
    const groupId = msg.key.remoteJid;
    const minutes = parseInt(args[0]);
    const pesanReminder = args.slice(1).join(" ") || "Waktu habis!";
    
    if (isNaN(minutes) || minutes <= 0) {
      return sock.sendMessage(groupId, { text: "❌ Format salah! Contoh: !remind 5 Buka puasa" }, { quoted: msg });
    }

    await sock.sendMessage(groupId, { text: `✅ Pengingat dipasang! Saya akan mengingatkanmu dalam ${minutes} menit.` }, { quoted: msg });

    setTimeout(async () => {
      await sock.sendMessage(groupId, { 
        text: `⏰ *PENGINGAT!*\n\nHalo @${sender.split("@")[0]},\n📝 Pesan: ${pesanReminder}`,
        mentions: [sender]
      });
    }, minutes * 60 * 1000);
  },
  
  getTTS: async (sock, msg, text) => {
    if (!text) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Teksnya mana? Contoh: !tts Halo semua" }, { quoted: msg });
    
    // Batasi teks agar tidak terlalu panjang
    if (text.length > 200) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Teks terlalu panjang! Maksimal 200 karakter." }, { quoted: msg });
    
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
      await sock.sendMessage(msg.key.remoteJid, { 
        audio: { url }, 
        mimetype: 'audio/mp4',
        ptt: true // ptt: true akan ngirimnya sebagai Voice Note (VN)
      }, { quoted: msg });
    } catch (e) {
      console.error("Gagal bos ngirim TTS:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal bos memproses suara." }, { quoted: msg });
    }
  },
  
  getJadwalSholat: async (sock, msg, kota) => {
    if (!kota) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Masukkan nama kota! Contoh: !jadwalsholat jakarta" }, { quoted: msg });
    
    try {
      // 1. Cari ID kota
      const searchRes = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`);
      const searchData = searchRes.data.data;
      
      if (!searchData || searchData.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: `❌ Kota "${kota}" tidak ketemu.` }, { quoted: msg });
      }
      
      const idKota = searchData[0].id;
      const namaKotaStr = searchData[0].lokasi;
      
      // 2. Ambil jadwal hari ini berdasarkan ID kota
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const jadwalRes = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${idKota}/${year}/${month}/${day}`);
      const jadwal = jadwalRes.data.data.jadwal;
      
      const textMsg = `╭━━• [ 🕌 *JADWAL SHOLAT* ] •━━╮\n┃\n┃ 📍 *Lokasi:* ${namaKotaStr}\n┃ 📅 *Tanggal:* ${jadwal.tanggal}\n┃ \n┃ 🌅 *Imsak:* ${jadwal.imsak}\n┃ 🌄 *Subuh:* ${jadwal.subuh}\n┃ ☀️ *Terbit:* ${jadwal.terbit}\n┃ 🌞 *Dhuha:* ${jadwal.dhuha}\n┃ 🕛 *Dzuhur:* ${jadwal.dzuhur}\n┃ 🕒 *Ashar:* ${jadwal.ashar}\n┃ 🌇 *Maghrib:* ${jadwal.maghrib}\n┃ 🌙 *Isya:* ${jadwal.isya}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      await sock.sendMessage(msg.key.remoteJid, { text: textMsg }, { quoted: msg });
    } catch (e) {
      console.error("Gagal bos mendapatkan jadwal sholat:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal bos mengambil data jadwal sholat. Coba lagi nanti." }, { quoted: msg });
    }
  },

  translateText: async (sock, msg, text) => {
    let sourceText = text;
    // Cek apakah me-reply pesan
    const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                       msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
                       
    if (!sourceText && quotedText) {
      sourceText = quotedText;
    }

    if (!sourceText) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Teksnya mana? Balas pesan dengan !tr atau ketik !tr [teks]" }, { quoted: msg });
    }

    try {
      const { data } = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(sourceText)}`);
      const translated = data[0].map(item => item[0]).join('');
      
      const langDetected = data[2] ? data[2].toUpperCase() : 'AUTO';
      
      const replyMsg = `🌐 *TERJEMAHAN (${langDetected} ➔ ID)*\n\n${translated}`;
      await sock.sendMessage(msg.key.remoteJid, { text: replyMsg }, { quoted: msg });
    } catch (e) {
      console.error("Translate error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal bos menerjemahkan teks." }, { quoted: msg });
    }
  },

  generateImage: async (sock, msg, prompt) => {
    if (!prompt) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Masukkan deskripsi gambar! Contoh: !imagine Kucing pakai kacamata hitam" }, { quoted: msg });
    
    await sock.sendMessage(msg.key.remoteJid, { text: "⏳ *Sedang melukis gambar (AI)...* Tolong sabar bentar cuy." }, { quoted: msg });
    
    try {
      // Menggunakan endpoint dari siputzx atau endpoint free text2img lainnya
      const apiUrl = `https://api.siputzx.my.id/api/ai/text2img?prompt=${encodeURIComponent(prompt)}`;
      
      await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: apiUrl },
        caption: `🎨 *Hasil AI Imagine*\n\n📝 *Prompt:* ${prompt}`
      }, { quoted: msg });
      
    } catch (e) {
      console.error("Imagine error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal bos bikin gambar dari AI. Coba lagi nanti." }, { quoted: msg });
    }
  },

  simulateProgress: async (sock, groupId, msg, textPrefix) => {
    const buildBar = (p) => {
      const totalBlocks = 10;
      const filledBlocks = Math.floor(p / 10);
      const emptyBlocks = totalBlocks - filledBlocks;
      const filledStr = "█".repeat(filledBlocks);
      const emptyStr = "▒".repeat(emptyBlocks);
      return `[${filledStr}${emptyStr}] ${p}%`;
    };

    let sentMsg = await sock.sendMessage(groupId, { text: `${textPrefix}\n\n⏳ *Memproses:*\n${buildBar(0)}` }, { quoted: msg });
    let stopped = false;
    
    const frames = [12, 28, 45, 63, 85, 99];
    
    const editLoop = async () => {
      for (const p of frames) {
        if (stopped) break;
        await new Promise(r => setTimeout(r, 600));
        if (stopped) break;
        try {
          await sock.sendMessage(groupId, { text: `${textPrefix}\n\n⏳ *Memproses:*\n${buildBar(p)}`, edit: sentMsg.key });
        } catch (e) {}
      }
    };
    
    editLoop();
    
    return {
      stop: async (success = true) => {
        stopped = true;
        let text = success ? `✅ *Selesai!*\n[██████████] 100%` : `❌ *Gagal bos!*\n[▒▒▒▒▒▒▒▒▒▒] ERROR`;
        try {
          await sock.sendMessage(groupId, { text: `${textPrefix}\n\n${text}`, edit: sentMsg.key });
        } catch (e) {}
      }
    };
  },

  reply: async (sock, msg, text, mentions = []) => {
    return sock.sendMessage(msg.key.remoteJid, { text, mentions }, { quoted: msg });
  },

};
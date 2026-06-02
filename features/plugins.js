const axios = require('axios');
const { downloadMediaMessage, generateWAMessageFromContent } = require('atexovi-baileys');
const FormData = require('form-data');

async function uploadUguu(buffer) {
  let form = new FormData();
  form.append('files[]', buffer, { filename: 'image.jpg' });

  const res = await axios.post('https://uguu.se/upload.php', form, {
    headers: { ...form.getHeaders() },
    timeout: 30000 // 30 detik maksimal
  });

  const json = res.data;
  if (!json.files || !json.files[0]) throw new Error('Upload gagal');

  return json.files[0].url;
}

async function kompresBuffer(imageBuffer, contentType) {
  const storeRes = await axios.post('https://tinypng.com/backend/opt/store', imageBuffer, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/octet-stream',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 30000
  });

  const { key, size: originalSize } = storeRes.data;

  const processRes = await axios.post('https://tinypng.com/backend/opt/process', {
    key,
    originalType: contentType,
    originalSize
  }, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 30000
  });

  return { originalSize, ...processRes.data };
}

module.exports = {
  listPlugins: async (sock, msg) => {
    const text = `*✦ ──『 🔌 DAFTAR PLUGIN 』── ✦*

┌──❖ *T O O L S*
│ ⚡ *!fakeff* [nickname]
│    ↳ Bikin gambar Fake Lobby FF
│ ⚡ *!kompres* (Balas gambar/reply)
│    ↳ Kompres ukuran gambar gratis
│ ⚡ *!hd* (Balas gambar/reply)
│    ↳ Perjelas/Enhance gambar HD
└───────────────┈ ⳹

_Silakan ketik perintah di atas secara langsung untuk menggunakan fiturnya._`;
    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },

  fakeff: async (sock, msg, text) => {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Cara pakai:\n!fakeff Nickname` }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });
      const apiUrl = `https://api.nexray.web.id/maker/fakelobyff?nickname=${encodeURIComponent(text)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(apiUrl, {
        headers: { Accept: 'image/*' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('fetch error');

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) throw new Error('invalid');

      const buffer = await res.arrayBuffer();

      await sock.sendMessage(msg.key.remoteJid, {
        image: Buffer.from(buffer),
        caption: `Fake Lobby FF\nNickname: ${text}`
      }, { quoted: msg });

    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error saat mengambil gambar.' }, { quoted: msg });
    }
  },

  kompres: async (sock, msg) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isImage = msg.message?.imageMessage;
    
    let targetMsg = null;
    let mime = "";

    if (isImage) {
      targetMsg = msg;
      mime = msg.message.imageMessage.mimetype;
    } else if (quotedMsg?.imageMessage) {
      targetMsg = { 
        key: {
          remoteJid: msg.key.remoteJid,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant
        },
        message: quotedMsg 
      };
      mime = quotedMsg.imageMessage.mimetype;
    } else {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kirim atau balas gambar dengan command !kompres" }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

    try {
      const imgBuffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const result = await kompresBuffer(imgBuffer, mime);

      const fmt = b => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
      const hemat = (((result.originalSize - result.size) / result.originalSize) * 100).toFixed(1);

      const caption =
        `*≡ K O M P R E S - G A M B A R ≡*\n\n` +
        `      Raw  : ${fmt(result.originalSize)}\n` +
        `      New  : ${fmt(result.size)}\n` +
        `      Hemat: ${hemat}%\n` +
        `      Size : ${result.width}x${result.height}`;

      const { data: resultBuf } = await axios.get(result.url, { responseType: 'arraybuffer', timeout: 30000 });

      await sock.sendMessage(msg.key.remoteJid, { image: Buffer.from(resultBuf), caption }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Gagal kompres gambar' }, { quoted: msg });
    }
  },

  enhancer: async (sock, msg) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isImage = msg.message?.imageMessage;
    
    let targetMsg = null;
    let mime = "";

    if (isImage) {
      targetMsg = msg;
      mime = msg.message.imageMessage.mimetype;
    } else if (quotedMsg?.imageMessage) {
      targetMsg = { 
        key: {
          remoteJid: msg.key.remoteJid,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant
        },
        message: quotedMsg 
      };
      mime = quotedMsg.imageMessage.mimetype;
    } else {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kirim atau balas gambar dengan command !hd" }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

    try {
      const imgBuffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const url = await uploadUguu(imgBuffer);
      const apiUrl = `https://api.nexray.eu.cc/tools/v1/enhancer?url=${encodeURIComponent(url)}`;
      
      const { data: resultBuf } = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 30000 });

      await sock.sendMessage(msg.key.remoteJid, { image: Buffer.from(resultBuf), caption: "✨ Selesai Diperjelas (HD)" }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Gagal memproses gambar (enhancer)' }, { quoted: msg });
    }
  }
};


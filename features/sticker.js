// features/sticker.js — Fitur Pembuat Stiker

const { downloadMediaMessage } = require('atexovi-baileys');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  async createSticker(sock, msg, groupId) {
    try {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      
      let targetMessage;
      if (isImage) {
        targetMessage = msg;
      } else if (isQuotedImage) {
        targetMessage = {
          key: {
            remoteJid: msg.key.remoteJid,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
          },
          message: msg.message.extendedTextMessage.contextInfo.quotedMessage
        };
      } else {
        await sock.sendMessage(groupId, { text: "❌ Kirim gambar dengan caption !s atau balas gambar dengan !s" }, { quoted: msg });
        return;
      }

      await sock.sendMessage(groupId, { text: "⏳ Sedang bikin stiker..." }, { quoted: msg });

      // Download buffer
      const buffer = await downloadMediaMessage(
        targetMessage,
        'buffer',
        {},
        { 
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      );

      const tmpIn = path.join(__dirname, `../tmp_${Date.now()}.jpg`);
      const tmpOut = path.join(__dirname, `../tmp_${Date.now()}.webp`);
      
      fs.writeFileSync(tmpIn, buffer);

      // Convert to webp using ffmpeg
      ffmpeg(tmpIn)
        .on('error', async (err) => {
          console.error(err);
          await sock.sendMessage(groupId, { text: "❌ Gagal bos bikin stiker!" }, { quoted: msg });
          try { fs.unlinkSync(tmpIn); } catch (e) {}
          try { fs.unlinkSync(tmpOut); } catch (e) {}
        })
        .on('end', async () => {
          const webpBuffer = fs.readFileSync(tmpOut);
          await sock.sendMessage(groupId, { sticker: webpBuffer }, { quoted: msg });
          
          // Cleanup
          fs.unlinkSync(tmpIn);
          fs.unlinkSync(tmpOut);
        })
        .addOutputOptions([
          "-vcodec", "libwebp",
          "-vf", "scale='min(320,iw)':min(320,ih):force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, format=rgba",
          "-loop", "0",
          "-ss", "00:00:00.0",
          "-t", "00:00:05.0",
          "-preset", "default",
          "-an",
          "-vsync", "0"
        ])
        .toFormat('webp')
        .save(tmpOut);

    } catch (err) {
      console.error(err);
      await sock.sendMessage(groupId, { text: "❌ Ada error njir saat memproses gambar." }, { quoted: msg });
    }
  },

  async createBratSticker(sock, msg, groupId, text) {
    if (!text) return sock.sendMessage(groupId, { text: "❌ Teksnya mana woy? Contoh: !brat gue ganteng" }, { quoted: msg });
    await sock.sendMessage(groupId, { text: "⏳ Bentar ngab, lagi bikin stiker brat..." }, { quoted: msg });
    
    try {
      const axios = require('axios');
      const apiUrl = `https://siputzx-bart.hf.space/?q=${encodeURIComponent(text)}`;
      const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data, 'binary');

      const tmpIn = path.join(__dirname, `../tmp_brat_${Date.now()}.png`);
      const tmpOut = path.join(__dirname, `../tmp_brat_${Date.now()}.webp`);
      
      fs.writeFileSync(tmpIn, buffer);

      ffmpeg(tmpIn)
        .on('error', async (err) => {
          console.error(err);
          await sock.sendMessage(groupId, { text: "❌ Gagal bos buat stiker brat ngab!" }, { quoted: msg });
          try { fs.unlinkSync(tmpIn); } catch (e) {}
        })
        .on('end', async () => {
          const webpBuffer = fs.readFileSync(tmpOut);
          await sock.sendMessage(groupId, { sticker: webpBuffer }, { quoted: msg });
          try {
            fs.unlinkSync(tmpIn);
            fs.unlinkSync(tmpOut);
          } catch (e) {}
        })
        .addOutputOptions([
          "-vcodec", "libwebp",
          "-vf", "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=15, pad=512:512:-1:-1:color=white@0.0, format=rgba",
          "-loop", "0",
          "-preset", "default",
          "-an",
          "-vsync", "0"
        ])
        .toFormat('webp')
        .save(tmpOut);
    } catch (err) {
      console.error(err);
      await sock.sendMessage(groupId, { text: "❌ Waduh API Brat-nya lagi gangguan ngab, sabar yak." }, { quoted: msg });
    }
  },

  async imgFromSticker(sock, msg, groupId) {
    try {
      const isQuotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
      if (!isQuotedSticker) {
        return sock.sendMessage(groupId, { text: "❌ Balas stiker yang ingin diubah menjadi gambar dengan !toimg" }, { quoted: msg });
      }

      await sock.sendMessage(groupId, { text: "⏳ Lagi diproses nih stiker menjadi gambar..." }, { quoted: msg });

      const targetMessage = {
        key: {
          remoteJid: msg.key.remoteJid,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant
        },
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage
      };

      const buffer = await downloadMediaMessage(
        targetMessage,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const tmpIn = path.join(__dirname, `../tmp_${Date.now()}.webp`);
      const tmpOut = path.join(__dirname, `../tmp_${Date.now()}.png`);
      fs.writeFileSync(tmpIn, buffer);

      ffmpeg(tmpIn)
        .on('error', async (err) => {
          console.error(err);
          await sock.sendMessage(groupId, { text: "❌ Gagal bos mengonversi stiker ke gambar! Pastiin itu stiker statis, bukan animasi." }, { quoted: msg });
          try { fs.unlinkSync(tmpIn); } catch(e){}
        })
        .on('end', async () => {
          const imgBuffer = fs.readFileSync(tmpOut);
          await sock.sendMessage(groupId, { image: imgBuffer, caption: "✅ Selesai! Stiker telah diubah menjadi gambar." }, { quoted: msg });
          try { fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); } catch(e){}
        })
        .save(tmpOut);

    } catch (err) {
      console.error("toimg error:", err);
      await sock.sendMessage(groupId, { text: "❌ Ada error njir saat memproses gambar." }, { quoted: msg });
    }
  }
};

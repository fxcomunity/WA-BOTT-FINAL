// features/audioEffects.js — Fitur Pengubah Suara Lengkap

const { downloadContentFromMessage } = require('atexovi-baileys');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const effects = {
  bass: "-af bass=g=15:f=110:w=0.3",
  chipmunk: "-af atempo=1.5,asetrate=44100*1.5",
  tupai: "-af atempo=1.5,asetrate=44100*1.5",
  robot: "-af asetrate=44100*0.8,atempo=1.25,extrastereo",
  slow: "-af atempo=0.7",
  fast: "-af atempo=1.5",
  echo: "-af aecho=0.8:0.9:1000:0.3",
  reverb: "-af aecho=0.8:0.8:60:0.4",
  nightcore: "-af asetrate=44100*1.25,atempo=1.25",
  reverse: "-af areverse",
  vibrato: "-af vibrato=f=6.5:d=0.5",
  dalek: "-af flanger=delay=0:depth=5:regen=0:width=100:speed=2:shape=sine:phase=0:interp=linear"
};

module.exports = {
  effectsList: Object.keys(effects),
  
  applyEffect: async (sock, msg, effectName) => {
    const groupId = msg.key.remoteJid;
    
    try {
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      // Pastikan yang di-reply adalah audio atau vn
      if (!quotedMsg || (!quotedMsg.audioMessage && !quotedMsg.documentMessage?.mimetype?.includes('audio'))) {
        return sock.sendMessage(groupId, { text: `❌ Balas sebuah pesan suara/audio dengan command !${effectName}` }, { quoted: msg });
      }

      await sock.sendMessage(groupId, { text: `⏳ Sedang mengubah suara jadi ${effectName.toUpperCase()}...` }, { quoted: msg });

      const mediaObject = quotedMsg.audioMessage || quotedMsg.documentMessage;
      const mediaType = quotedMsg.audioMessage ? 'audio' : 'document';
      
      const stream = await downloadContentFromMessage(mediaObject, mediaType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const timestamp = Date.now();
      const tmpIn = path.join(__dirname, `../tmp_audio_in_${timestamp}.ogg`);
      const tmpOut = path.join(__dirname, `../tmp_audio_out_${timestamp}.mp3`);
      
      fs.writeFileSync(tmpIn, buffer);

      const filterArgs = effects[effectName].split(" ");

      ffmpeg(tmpIn)
        .on('error', async (err) => {
          console.error(`Error ffmpeg ${effectName}:`, err);
          await sock.sendMessage(groupId, { text: "❌ Gagal memproses audio. File mungkin rusak atau format tidak didukung." }, { quoted: msg });
          try { fs.unlinkSync(tmpIn); } catch(e){}
        })
        .on('end', async () => {
          const outBuffer = fs.readFileSync(tmpOut);
          
          // Kirim sebagai audio/mp4 dengan flag ptt: true (agar dikirim sebagai Voice Note)
          await sock.sendMessage(groupId, { 
            audio: outBuffer, 
            mimetype: 'audio/mp4',
            ptt: true 
          }, { quoted: msg });
          
          // Cleanup
          try { 
            fs.unlinkSync(tmpIn); 
            fs.unlinkSync(tmpOut); 
          } catch(e){}
        })
        .outputOptions(filterArgs)
        .save(tmpOut);

    } catch (err) {
      console.error(`audioEffects ${effectName} error:`, err);
      await sock.sendMessage(groupId, { text: `❌ Terjadi kesalahan saat memproses audio: ${err.message}\n\n${err.stack}` }, { quoted: msg });
    }
  }
};

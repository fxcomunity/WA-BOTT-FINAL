const axios = require('axios');

function formatNumber(num) {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
  spotifyPlay: async (sock, msg, text) => {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format salah! Contoh:\n!spotifyplay Payung Teduh Mari Bercerita" }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });

    try {
      let api = `https://api.nexray.web.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`;
      let { data } = await axios.get(api);

      if (!data.status) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ Lagu tidak ditemukan di Spotify' }, { quoted: msg });
      }

      let v = data.result;
      let caption = `— *SPOTIFY PLAY* —
 
❀ *Title* : ${v.title}
❀ *Artist* : ${v.artist}
❀ *Album* : ${v.album}
 
❀ *Duration* : ${v.duration}
❀ *Popularity* : ${formatNumber(v.popularity)}
 
❀ *Release* : ${v.release_at}`.trim();

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: v.thumbnail },
        caption
      }, { quoted: msg });

      let head = await axios.head(v.download_url);
      let size = Number(head.headers['content-length'] || 0);
      let sizeMB = size / 1024 / 1024;

      if (sizeMB > 50) {
        await sock.sendMessage(msg.key.remoteJid, {
          document: { url: v.download_url },
          mimetype: 'audio/mpeg',
          fileName: v.title + '.mp3'
        }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          audio: { url: v.download_url },
          mimetype: 'audio/mpeg',
          fileName: v.title + '.mp3'
        }, { quoted: msg });
      }
      
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Gagal mengambil lagu dari API' }, { quoted: msg });
    }
  },

  spotifySearch: async (sock, msg, text) => {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Masukkan judul lagu\n\nContoh:\n!spotifysearch swim chase atlantic" }, { quoted: msg });
    }
    
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });

    try {
      let { data } = await axios.get(`https://api.nexray.eu.cc/search/spotify?q=${encodeURIComponent(text)}`);

      if (!data.status || !data.result.length) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ Lagu tidak ditemukan' }, { quoted: msg });
      }

      let result = data.result.slice(0, 10);
      let caption = `— *SPOTIFY SEARCH* —\n\n`;

      for (let i = 0; i < result.length; i++) {
        let v = result[i];
        caption += `❀ *Title* : ${v.title}\n`;
        caption += `❀ *Artist* : ${v.artist}\n`;
        caption += `❀ *Album* : ${v.album}\n`;
        caption += `❀ *Duration* : ${v.duration}\n`;
        caption += `❀ *Popularity* : ${v.popularity}\n`;
        caption += `❀ *Release* : ${v.release_date}\n`;
        caption += `❀ *URL* : ${v.url}\n`;

        if (i !== result.length - 1) {
          caption += `\n──────────────────\n\n`;
        }
      }

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: result[0].thumbnail },
        caption
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (e) {
      console.log(e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Terjadi kesalahan saat mencari lagu (API Error)' }, { quoted: msg });
    }
  }
};

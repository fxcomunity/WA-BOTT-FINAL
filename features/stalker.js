// features/stalker.js — Stalking Tools OP

const axios = require('axios');
const { reply } = require('./utils');

module.exports = {
  igStalk: async (sock, msg, username) => {
    if (!username) return reply(sock, msg, "⚠️ Pake format yg bener njir: !igstalk [username]");
    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔍", key: msg.key } });
      // Gunakan API publik widipe
      const res = await axios.get(`https://widipe.com/igstalk?uname=${username}`);
      if (!res.data.status) throw new Error();
      
      const data = res.data.result;
      const text = `📸 *IG STALKER* 📸\n\n` +
                   `👤 *Username:* ${data.username}\n` +
                   `📛 *Fullname:* ${data.fullname}\n` +
                   `👥 *Followers:* ${data.followers}\n` +
                   `🫂 *Following:* ${data.following}\n` +
                   `📝 *Posts:* ${data.posts}\n` +
                   `📜 *Bio:* ${data.bio}\n\n` +
                   `🔗 *Link:* https://instagram.com/${data.username}`;
                   
      await sock.sendMessage(msg.key.remoteJid, { image: { url: data.profile_pic }, caption: text }, { quoted: msg });
    } catch (e) {
      await reply(sock, msg, "❌ Username IG kaga ketemu ato server API lagi ampas.");
    }
  },

  ttStalk: async (sock, msg, username) => {
    if (!username) return reply(sock, msg, "⚠️ Pake format yg bener njir: !ttstalk [username]");
    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔍", key: msg.key } });
      const res = await axios.get(`https://widipe.com/tiktokstalk?user=${username}`);
      if (!res.data.status) throw new Error();
      
      const data = res.data.result;
      const text = `🎵 *TIKTOK STALKER* 🎵\n\n` +
                   `👤 *Username:* ${data.username}\n` +
                   `📛 *Nickname:* ${data.nickname}\n` +
                   `👥 *Followers:* ${data.followers}\n` +
                   `🫂 *Following:* ${data.following}\n` +
                   `❤️ *Likes:* ${data.likes}\n` +
                   `📝 *Video:* ${data.video}\n` +
                   `📜 *Bio:* ${data.bio}`;
                   
      await sock.sendMessage(msg.key.remoteJid, { image: { url: data.profile_pic }, caption: text }, { quoted: msg });
    } catch (e) {
      await reply(sock, msg, "❌ Username TikTok kaga ketemu ato server API lagi ampas.");
    }
  },

  ghStalk: async (sock, msg, username) => {
    if (!username) return reply(sock, msg, "⚠️ Pake format yg bener njir: !ghstalk [username]");
    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔍", key: msg.key } });
      const res = await axios.get(`https://api.github.com/users/${username}`);
      const data = res.data;
      
      const text = `🐙 *GITHUB STALKER* 🐙\n\n` +
                   `👤 *Username:* ${data.login}\n` +
                   `📛 *Name:* ${data.name || "-"}\n` +
                   `🏢 *Company:* ${data.company || "-"}\n` +
                   `📍 *Location:* ${data.location || "-"}\n` +
                   `👥 *Followers:* ${data.followers}\n` +
                   `🫂 *Following:* ${data.following}\n` +
                   `📦 *Public Repos:* ${data.public_repos}\n` +
                   `📜 *Bio:* ${data.bio || "-"}\n\n` +
                   `🔗 *Link:* ${data.html_url}`;
                   
      await sock.sendMessage(msg.key.remoteJid, { image: { url: data.avatar_url }, caption: text }, { quoted: msg });
    } catch (e) {
      await reply(sock, msg, "❌ Username GitHub kaga ketemu ato server API lagi ampas.");
    }
  }
};

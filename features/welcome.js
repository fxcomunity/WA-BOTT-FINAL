// features/welcome.js — Welcome & Goodbye Member

module.exports = {
  async sendWelcome(sock, groupId, participants) {
    const meta = await sock.groupMetadata(groupId);
    const groupName = encodeURIComponent(meta.subject);
    const memberCount = meta.participants.length;

    for (const jid of participants) {
      let avatar = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
      try {
        avatar = await sock.profilePictureUrl(jid, 'image');
      } catch (err) {}

      const userName = encodeURIComponent(jid.split("@")[0]);
      const encAvatar = encodeURIComponent(avatar);
      
      // Menggunakan popcat API untuk generate kartu welcome
      const bg = encodeURIComponent("https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1000&q=80");
      const url = `https://api.popcat.xyz/welcomecard?background=${bg}&text1=${userName}&text2=Welcome+to+${groupName}&text3=Member+${memberCount}&avatar=${encAvatar}`;

      const textMsg = `🎉 *WELCOME!* 🎉\nHalo @${jid.split("@")[0]}, selamat datang di *${meta.subject}*!\n\nKetik !help untuk melihat daftar perintah bot.\nPatuhi peraturan grup ya! 🙏`;

      try {
        await sock.sendMessage(groupId, {
          image: { url: url },
          caption: textMsg,
          mentions: [jid],
        });
      } catch (e) {
        // Fallback jika API gagal/lambat
        await sock.sendMessage(groupId, { text: textMsg, mentions: [jid] });
      }
    }
  },

  async sendGoodbye(sock, groupId, participants) {
    const meta = await sock.groupMetadata(groupId);
    for (const jid of participants) {
      await sock.sendMessage(groupId, {
        text: `👋 Sampai jumpa @${jid.split("@")[0]}, terima kasih sudah bergabung di *${meta.subject}*!`,
        mentions: [jid],
      });
    }
  },
};

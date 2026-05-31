// features/admin.js — Admin Tools OP

const config = require("../config");
const { reply } = require("./utils");

module.exports = {
  promote: async (sock, msg, groupId, targetJid) => {
    try {
      await sock.groupParticipantsUpdate(groupId, [targetJid], "promote");
      await reply(sock, msg, `✅ Tsaahh! @${targetJid.split("@")[0]} skrg udah diangkat jadi Admin grup (Bekingan dalem)!`, [targetJid]);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal bos promote njir! Lu kata bot punya wewenang kalo bukan admin?`);
    }
  },
  
  demote: async (sock, msg, groupId, targetJid) => {
    try {
      await sock.groupParticipantsUpdate(groupId, [targetJid], "demote");
      await reply(sock, msg, `✅ Mampus! Pangkat @${targetJid.split("@")[0]} udah gue cabut jadi rakyat jelata lagi.`, [targetJid]);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal bos nurunin pangkat. Bot harus jadi admin dulu bos!`);
    }
  },

  kickall: async (sock, msg, groupId, sender) => {
    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const participants = groupMetadata.participants;
      
      let kickedCount = 0;
      for (let p of participants) {
        // Jangan kick bot, owner bot, pembuat grup, dan sender (admin yang eksekusi)
        const isBot = p.id === sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const isOwnerBot = config.owners.includes(p.id.split("@")[0]);
        const isCreator = p.id === groupMetadata.owner;
        const isSender = p.id === sender;
        const isAdmin = p.admin !== null; // Optional: Jangan kick admin lain
        
        if (!isBot && !isOwnerBot && !isCreator && !isSender && !isAdmin) {
          await sock.groupParticipantsUpdate(groupId, [p.id], "remove");
          kickedCount++;
          // Jeda sedikit biar gak dibanned wa
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      await reply(sock, msg, `✅ *Kiamat Selesai!* Sukses nendang *${kickedCount} orang* ke luar angkasa (Bot, Admin & Owner selamat).`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal bos bantai masal njir, pastiin bot udah diangkat jadi admin!`);
    }
  },

  setName: async (sock, msg, groupId, newName) => {
    if (!newName) return reply(sock, msg, `⚠️ Format salah njir: !setname [Nama Baru]`);
    try {
      await sock.groupUpdateSubject(groupId, newName);
      await reply(sock, msg, `✅ Done ngab! Nama grup berhasil diubah jadi: *${newName}*`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal bos ngab, bot kaga admin!`);
    }
  },

  setDesc: async (sock, msg, groupId, newDesc) => {
    if (!newDesc) return reply(sock, msg, `⚠️ Ngetik yg bener ngab: !setdesc [Deskripsi Baru]`);
    try {
      await sock.groupUpdateDescription(groupId, newDesc);
      await reply(sock, msg, `✅ Deskripsi grup udah kelar diupdate!`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal bos cuy, pastiin bot dijadiin admin dulu.`);
    }
  },

  setPp: async (sock, msg, groupId, downloadMediaMessage) => {
    const isImage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!isImage) return reply(sock, msg, `⚠️ Kirim ato reply foto pake caption !setpp bos!`);
    
    try {
      // Logic download media akan dilakukan di index.js
      await reply(sock, msg, `⏳ Sabar njir, lagi proses ganti PP grup...`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal bos ganti PP njir, bot harus admin!`);
    }
  }
};

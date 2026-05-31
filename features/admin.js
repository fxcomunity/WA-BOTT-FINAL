// features/admin.js — Admin Tools OP

const config = require("../config");
const { reply } = require("./utils");

module.exports = {
  promote: async (sock, msg, groupId, targetJid) => {
    try {
      await sock.groupParticipantsUpdate(groupId, [targetJid], "promote");
      await reply(sock, msg, `✅ Sukses menaikkan jabatan @${targetJid.split("@")[0]} menjadi Admin Grup!`, [targetJid]);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal promote. Pastikan bot adalah admin.`);
    }
  },
  
  demote: async (sock, msg, groupId, targetJid) => {
    try {
      await sock.groupParticipantsUpdate(groupId, [targetJid], "demote");
      await reply(sock, msg, `✅ Sukses menurunkan jabatan @${targetJid.split("@")[0]} menjadi Member biasa.`, [targetJid]);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal demote. Pastikan bot adalah admin.`);
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
      
      await reply(sock, msg, `✅ Sukses mengeluarkan *${kickedCount} member* dari grup (Bot, Admin & Owner dikecualikan).`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal eksekusi Kick All. Pastikan bot adalah admin.`);
    }
  },

  setName: async (sock, msg, groupId, newName) => {
    if (!newName) return reply(sock, msg, `⚠️ Penggunaan: !setname [Nama Baru]`);
    try {
      await sock.groupUpdateSubject(groupId, newName);
      await reply(sock, msg, `✅ Sukses mengubah nama grup menjadi: *${newName}*`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal. Pastikan bot adalah admin.`);
    }
  },

  setDesc: async (sock, msg, groupId, newDesc) => {
    if (!newDesc) return reply(sock, msg, `⚠️ Penggunaan: !setdesc [Deskripsi Baru]`);
    try {
      await sock.groupUpdateDescription(groupId, newDesc);
      await reply(sock, msg, `✅ Sukses mengubah deskripsi grup.`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal. Pastikan bot adalah admin.`);
    }
  },

  setPp: async (sock, msg, groupId, downloadMediaMessage) => {
    const isImage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!isImage) return reply(sock, msg, `⚠️ Kirim/reply gambar dengan caption !setpp`);
    
    try {
      // Logic download media akan dilakukan di index.js
      await reply(sock, msg, `⏳ Sedang mengganti foto profil grup...`);
    } catch (e) {
      await reply(sock, msg, `❌ Gagal. Pastikan bot adalah admin.`);
    }
  }
};

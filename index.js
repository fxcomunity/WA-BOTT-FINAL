// ============================================
// index.js — JackBOT v3.0.0
// WhatsApp Group Bot pake Baileys
// ============================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage, jidNormalizedUser } = require("atexovi-baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require('fs');
const config = require("./config");

const messageCache = new Map();
const processedMessages = new Set();

// Import semua fitur
const antiSpam    = require("./features/antiSpam");
const antiLink    = require("./features/antiLink");
const admin       = require("./features/admin");
const stalker     = require("./features/stalker");
const welcome     = require("./features/welcome");
const warnSystem  = require("./features/warnSystem");
const lockGroup   = require("./features/lockGroup");
const economy     = require("./features/economy");
const games       = require("./features/games");
const downloader  = require("./features/downloader");
const scheduler   = require("./features/scheduler");
const statistics  = require("./features/statistics");
const aiChatbot   = require("./features/aiChatbot");
const utils       = require("./features/utils");
const spotify     = require("./features/spotify");
const limitSystem = require("./features/limitSystem");
const sticker     = require("./features/sticker");
const afk         = require("./features/afk");
const fun         = require("./features/fun");
const audioEffects = require("./features/audioEffects");

// ============================================
// FUNGSI CEK ADMIN (DENGAN CACHE ANTI TIMEOUT)
// ============================================
const groupAdminsCache = new Map();

const getGroupAdmins = async (sock, groupId) => {
    try {
        if (groupAdminsCache.has(groupId)) {
            const cached = groupAdminsCache.get(groupId);
            if (Date.now() - cached.timestamp < 900000) { // 15 menit
                return cached.admins;
            }
        }
        const metadata = await sock.groupMetadata(groupId);
        const admins = metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => jidNormalizedUser(p.id));
        groupAdminsCache.set(groupId, { admins, timestamp: Date.now() });
        return admins;
    } catch (e) {
        if (groupAdminsCache.has(groupId)) return groupAdminsCache.get(groupId).admins;
        throw e; // Throw to be caught by caller if completely failed
    }
};

const isAdmin = async (sock, groupId, sender) => {
    try {
        if (!groupId) return false;
        const admins = await getGroupAdmins(sock, groupId);
        return admins.includes(jidNormalizedUser(sender));
    } catch (e) {
        return false;
    }
};

// ============================================
// SETTINGS / STATE
// ============================================
const settingsPath = './settings.json';

let botSettings = { isSelfMode: false };
if (fs.existsSync(settingsPath)) {
  try {
    botSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch(e) {
    console.error("Gagal bos membaca settings.json:", e);
  }
} else {
  fs.writeFileSync(settingsPath, JSON.stringify(botSettings, null, 2));
}

let isSelfMode = botSettings.isSelfMode;

const saveSettings = () => {
  botSettings.isSelfMode = isSelfMode;
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(botSettings, null, 2));
  } catch(e) {
    console.error("Gagal bos menyimpan settings:", e);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
// ============================================
// CACHE SYSTEM
// ============================================
const groupMetadataCache = {};
const getGroupMetadata = async (sock, groupId) => {
  if (!groupId.endsWith("@g.us")) return null;
  const now = Date.now();
  // Cache for 15 minutes (900000 ms)
  if (groupMetadataCache[groupId] && (now - groupMetadataCache[groupId].timestamp < 900000)) {
    return groupMetadataCache[groupId].data;
  }
  const meta = await sock.groupMetadata(groupId);
  groupMetadataCache[groupId] = { data: meta, timestamp: now };
  return meta;
};

const isOwner  = (sock, sender) => config.owners.includes(sender.split("@")[0]) || sender.split("@")[0] === sock.user.id.split(":")[0];

const reply = (sock, msg, text) =>
  sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });

// ============================================
// MAIN BOT
// ============================================

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["JackBOT", "Chrome", "3.0.0"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    getMessage: async (key) => {
      const msg = messageCache.get(key.id);
      return msg?.message || undefined;
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ============================================
  // KONEKSI
  // ============================================
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      require("qrcode-terminal").generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Koneksi terputus. Reconnect:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ JackBOT berhasil terhubung!");
      scheduler.start(sock);
    }
  });

  // ============================================
  // MEMBER JOIN / LEAVE
  // ============================================
  sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
    if (action === "add")    await welcome.sendWelcome(sock, id, participants);
    if (action === "remove") await welcome.sendGoodbye(sock, id, participants);
  });

  // ============================================
  // PESAN MASUK
  // ============================================
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    try {
      if (type !== "notify") return;
      const msg = messages[0];
      if (!msg.message) {
      // Handle Anti-Delete for simple message deletes
      if (msg.messageStubType === 68 || msg.messageStubType === 2) {
         // Baileys may sometimes emit REVOKE as a stub type, but usually it's protocolMessage
      }
      return;
    }
      
      if (!msg.key || !msg.key.id) return;
      
      // Mencegah proses duplikat dari Baileys (Bug WA Multi-Device)
      if (processedMessages.has(msg.key.id)) return;
      processedMessages.add(msg.key.id);
      if (processedMessages.size > 2000) {
        processedMessages.delete(processedMessages.keys().next().value);
      }

      // Save to cache for Anti-Delete
    if (msg.key && msg.key.id) {
      messageCache.set(msg.key.id, msg);
      if (messageCache.size > 1000) {
        const firstKey = messageCache.keys().next().value;
        messageCache.delete(firstKey);
      }
    }
    
    // Auto-Read dipindah ke bawah biar cuma jalan pas ada command (hemat bandwidth & ngurangin delay)
    
    // Handle Anti-ViewOnce
    const isViewOnce = msg.message?.viewOnceMessage || msg.message?.viewOnceMessageV2 || msg.message?.viewOnceMessageV2Extension;
    if (isViewOnce && msg.key.remoteJid.endsWith("@g.us")) {
      const voMessage = isViewOnce.message;
      const mediaType = voMessage.imageMessage ? 'image' : voMessage.videoMessage ? 'video' : null;
      if (mediaType) {
        try {
          const mediaObj = {
            key: msg.key,
            message: voMessage
          };
          const buffer = await downloadMediaMessage(mediaObj, 'buffer', {}, { 
            logger: require('pino')({ level: 'silent' }) 
          });
          const sender = msg.key.participant || msg.key.remoteJid;
          const caption = `📸 *ANTI VIEW-ONCE* 📸\n\nKetahuan kirim foto/video 1x lihat nih @${sender.split("@")[0]}! 😜`;
          
          if (mediaType === 'image') {
            await sock.sendMessage(msg.key.remoteJid, { image: buffer, caption: caption, mentions: [sender] });
          } else {
            await sock.sendMessage(msg.key.remoteJid, { video: buffer, caption: caption, mentions: [sender] });
          }
        } catch (e) {
          console.log("Anti View-Once Error:", e);
        }
      }
    }
    
    // Handle Anti-Delete (REVOKE)
    if (msg.message.protocolMessage && msg.message.protocolMessage.type === 0) { // 0 is REVOKE
      const deletedKey = msg.message.protocolMessage.key;
      const originalMsg = messageCache.get(deletedKey.id);
      
      if (originalMsg) {
        const devNumber = config.owners[0] + "@s.whatsapp.net";
        const deleter = msg.key.participant || msg.key.remoteJid;
        const sender = deletedKey.participant || deletedKey.remoteJid;
        
        let groupName = deletedKey.remoteJid;
        if (deletedKey.remoteJid.endsWith('@g.us')) {
            try {
                const meta = await sock.groupMetadata(deletedKey.remoteJid);
                groupName = meta.subject;
            } catch (e) {
                groupName = deletedKey.remoteJid.split('@')[0];
            }
        }
        
        let teks = `🚨 *ANTI-DELETE*\n\n` +
                   `Pesan ditarik oleh: @${deleter.split("@")[0]}\n`;
        if (deleter !== sender) {
            teks += `(Pesan milik: @${sender.split("@")[0]})\n`;
        }
        teks += `Dari Grup: ${groupName}\n\n` +
                `_Pesan berhasil diselamatkan dan diteruskan ke Developer._`;
                   
        await sock.sendMessage(devNumber, { text: teks, mentions: [sender, deleter] });
        await sock.sendMessage(devNumber, { forward: originalMsg });
      }
      return;
    }
    
    let nativeFlowId = "";
    try {
      if (msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        const params = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
        if (params.id) nativeFlowId = params.id;
      }
    } catch(e) {}

    const body = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      nativeFlowId || ""
    ).trim();

    // Cegah loop dari pesan sendiri kecuali itu adalah command
    if (msg.key.fromMe && !body.startsWith(config.prefix)) return;

    // Auto-React (Bot Hidup) - Dibatasi 30% chance biar kaga spam network dan bikin lag
    if (!msg.key.fromMe && body && Math.random() < 0.3) {
      const lowerBody = body.toLowerCase();
      if (lowerBody.match(/wkwk|haha|hehe|lol|lmao/)) {
        sock.sendMessage(msg.key.remoteJid, { react: { text: "😂", key: msg.key } }).catch(()=>{});
      } else if (lowerBody.match(/sedih|nangis|huhu|hik/)) {
        sock.sendMessage(msg.key.remoteJid, { react: { text: "😢", key: msg.key } }).catch(()=>{});
      } else if (lowerBody.match(/marah|kesel|anjir|bgst/)) {
        sock.sendMessage(msg.key.remoteJid, { react: { text: "🤬", key: msg.key } }).catch(()=>{});
      } else if (lowerBody.match(/keren|mantap|gila|anjay/)) {
        sock.sendMessage(msg.key.remoteJid, { react: { text: "🔥", key: msg.key } }).catch(()=>{});
      } else if (lowerBody.match(/bot/)) {
        sock.sendMessage(msg.key.remoteJid, { react: { text: "🤖", key: msg.key } }).catch(()=>{});
      }
    }

    const groupId  = msg.key.remoteJid;
    const isGroup  = groupId?.endsWith("@g.us");

    let sender = msg.key.participant || msg.key.remoteJid;
    if (msg.key.fromMe) {
      sender = jidNormalizedUser(sock.user.id);
    }

    const isMenuFallback = ["1", "2", "3", "4", "5", "6"].includes(body);
    let isCmd = false;
    let args = [];
    let cmd = "";

    if (body.startsWith(config.prefix)) {
      isCmd = true;
      args = body.slice(config.prefix.length).trim().split(/\s+/);
      cmd = args.shift()?.toLowerCase();
    } else {
      // Tanpa prefix, cek apakah kata pertama adalah valid command
      args = body.trim().split(/\s+/);
      const possibleCmd = args.shift()?.toLowerCase();
      
      const validCommands = [
        "self", "on", "public", "lock", "unlock", "shutdown", "pengumuman", "setowner", "add", "warn", "kick", "mute", "unmute", "del", "delete", "resetwarn", "warnlist", "tagall", "slowmode", "poll", "endpoll", "help", "menu", "afk", "sticker", "s", "brat", "info", "status", "daily", "saldo", "transfer", "shop", "beli", "serang", "lari", "potion", "skills", "belajar", "skill", "levelup", "upgrade", "leaderboard", "lb", "mancing", "berburu", "nambang", "inv", "inventory", "sell", "use", "pakai", "cekbot", "promote", "demote", "kickall", "setname", "setdesc", "setpp", "igstalk", "ttstalk", "ghstalk", "tutor", "kuis", "tebak", "jawab", "stats", "mystats", "topaktif", "ping", "quotes", "fakta", "apakah", "bisakah", "kapankah", "rate", "jodoh", "cekkhodam", "toimg", "tr", "translate", "menfess", "imagine", "tts", "jadwalsholat", "cuaca", "kurs", "qr", "spotifyplay", "spplay", "spotifysearch", "spotifys", "sps", "remind", "yt", "tt", "ig", "pin", "gambar", "pinterest", "fb", "tw", "x", "limit", "ceklimit", "rvo", "sw", "limitall", "resetlimit", "setlimit",
        ...audioEffects.effectsList
      ];

      if (validCommands.includes(possibleCmd)) {
        isCmd = true;
        cmd = possibleCmd;
      }
    }

    // Untuk fallback angka dan tombol balasan
    if (isMenuFallback || msg.message?.buttonsResponseMessage || nativeFlowId) {
      isCmd = true;
      args = body.split(/\s+/);
      cmd = args.shift()?.toLowerCase();
    }
    
    // Auto-Read HANYA JIKA ITU COMMAND (Biar bot ga lemot nge-read semua chat orang)
    if (isCmd && msg.key && !msg.key.fromMe) {
      sock.readMessages([msg.key]).catch(() => {});
    }

    const ownerCheck = isOwner(sock, sender);
    const adminCheck = await isAdmin(sock, groupId, sender);

    // MODE SELF: Abaikan semua command jika bukan dari owner
    if (isSelfMode && !ownerCheck && isCmd) {
      return;
    }

    // Tambah statistik
    if (isGroup && config.features.statistics) statistics.track(groupId, sender);

    // Tambah poin ekonomi per pesan
    if (isGroup && config.features.economy) economy.addCoins(sender, config.activeReward);

    // Ambil & simpan nama WA user otomatis ke limit system
    limitSystem.setName(sender, msg.pushName || sender.split("@")[0]);

    // ============================================
    // CEK STATUS AFK
    // ============================================
    if (afk.checkAfk(sender)) {
      await sock.sendMessage(groupId, { text: `👋 Yow @${sender.split("@")[0]} udah balik dari pertapaan AFK nya!`, mentions: [sender] }, { quoted: msg });
    }

    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (let jid of mentionedJids) {
      const afkData = afk.getAfkReason(jid);
      if (afkData) {
        await reply(sock, msg, `💤 Woi jgn ditag, orangnya lagi molor/sibuk (AFK)!\nAlasan: ${afkData.reason}`);
      }
    }

    // ============================================
    // ANTI-SPAM / FLOOD
    // ============================================
    if (config.features.antiSpam && !adminCheck && !ownerCheck) {
      const spammed = antiSpam.check(sender);
      if (spammed) {
        await sock.sendMessage(groupId, { delete: msg.key });
        await reply(sock, msg, `⚠️ @${sender.split("@")[0]} lu nyepam njir! Kalo masih ngetik cepet w kick!`);
        return;
      }
    }


    // ============================================
    // ANTI LINK (Auto-Kick)
    // ============================================
    if (isGroup && config.features.antiLink && !adminCheck && !ownerCheck) {
      if (antiLink.hasLink(body)) {
        try {
          const botId = jidNormalizedUser(sock.user.id);
          const botIsAdmin = await isAdmin(sock, groupId, botId);
          
          if (botIsAdmin) {
            await sock.sendMessage(groupId, { delete: msg.key }).catch(e => console.log("Gagal bos hapus pesan link:", e));
            await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(e => console.log("Gagal bos kick member:", e));
            
            const dDate = new Date();
            const strDate = `${dDate.toLocaleDateString('id-ID')} | ${dDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
            
            const kickMsg = `╭━━• [ 🚷 *MAMPUS KENA KICK* (AUTO) ] •━━╮
┃
┃ 👤 *Target:* @${sender.split("@")[0]}
┃ 📝 *Pelanggaran:* Nyebar Link Haram
┃ ⏰ *Waktu Eksekusi:* ${strDate}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
            await sock.sendMessage(groupId, { text: kickMsg, mentions: [sender] });
          } else {
            await reply(sock, msg, `⚠️ Woi @${sender.split("@")[0]} nyebar link njir! Admin asli tolong kick nih bocah (Gue belom diangkat admin soalnya)!`);
          }
        } catch (e) {
          console.error("AntiLink Error:", e);
        }
        return;
      }
    }

    // ============================================
    // ANTI FORWARD MASSAL
    // ============================================
    if (isGroup && config.features.antiForward && !adminCheck && !ownerCheck) {
      if (msg.message?.extendedTextMessage?.contextInfo?.forwardingScore > 5) {
        await sock.sendMessage(groupId, { delete: msg.key });
        return;
      }
    }

    // ============================================
    // ANTI KATA KASAR (Dihapus sesuai request)
    // ============================================

    // ============================================
    // AI CHATBOT
    // ============================================
    if (config.features.aiChatbot) {
      const triggered = config.aiTrigger.some(t => body.toLowerCase().startsWith(t));
      if (triggered) {
        const question = body.split(/,|:/)[1]?.trim() || args.join(" ");
        if (question) {
          if (!limitSystem.cek(sender, "ai"))
            return reply(sock, msg, `❌ Limit AI lu udah abis ngab! Ketik !limit buat ngecek sisa jatah preman lu.`);
          const jawaban = await aiChatbot.ask(question);
          await reply(sock, msg, jawaban);
          return;
        }
      }
    }

    // ============================================
    // AUTO-DOWNLOADER (TikTok & Instagram)
    // ============================================
    if (!isCmd && config.features.downloader) {
      if (body.includes("tiktok.com")) {
        await downloader.tiktok(sock, msg, body.split(/\s+/));
        return;
      }
      if (body.includes("instagram.com")) {
        await downloader.instagram(sock, msg, body.split(/\s+/));
        return;
      }
    }

    // ============================================
    // COMMANDS
    // ============================================
    if (!isCmd) return;

    // Otomatis berikan reaksi 🕒 saat sebuah command tereksekusi
    await sock.sendMessage(groupId, { react: { text: "🕒", key: msg.key } });

    switch (cmd) {

      // ---------- OWNER ONLY ----------
      case "self":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma owner!");
        isSelfMode = true;
        saveSettings();
        await reply(sock, msg, "🔇 *Mode SELF Aktif!*\nBot sekarang cuma akan merespon perintah dari Owner. (Tersimpan permanen)");
        break;

      case "on":
      case "public":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma owner!");
        isSelfMode = false;
        saveSettings();
        await reply(sock, msg, "🔊 *Mode PUBLIC Aktif!*\nBot sekarang kembali melayani semua member grup. (Tersimpan permanen)");
        break;

      case "lock":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Yeee lu bukan admin, gabisa ngunci grup bos!");
        const resLock = await lockGroup.lock(sock, groupId);
        await reply(sock, msg, resLock);
        break;

      case "unlock":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Yeee lu bukan admin, gabisa buka grup bos!");
        const resUnlock = await lockGroup.unlock(sock, groupId, args[0]);
        await reply(sock, msg, resUnlock);
        break;

      case "shutdown":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma owner!");
        await reply(sock, msg, "👋 Bot dimatikan. Sampai jumpa!");
        process.exit(0);

      case "pengumuman":
        if (sender.split("@")[0] !== "129003956510974") {
          return reply(sock, msg, "❌ Cuma nomor +129003956510974 yang bisa memakai command ini!");
        }
        
        const teksPengumuman = args.join(" ") || "Bot akan melakukan maintenance. Tolong maaf atas ketidaknyamanannya.";
        const dPengumuman = new Date();
        const strWaktuPengumuman = `${dPengumuman.toLocaleDateString('id-ID')} | ${dPengumuman.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
        
        const broadcastMsg = `╭━━• [ 📢 *PENGUMUMAN GLOBAL* ] •━━╮
┃
┃ ⚠️ *Pesan:* ${teksPengumuman}
┃ ⏰ *Waktu:* ${strWaktuPengumuman}
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n📢 Perhatian semua member!`;

        const participatingGroups = await sock.groupFetchAllParticipating();
        let successCount = 0;
        
        for (const gId in participatingGroups) {
          const groupInfo = participatingGroups[gId];
          const members = groupInfo.participants.map(p => p.id);
          try {
            await sock.sendMessage(gId, { text: broadcastMsg, mentions: members });
            successCount++;
          } catch(e) {
            console.error(`Gagal bos ngirim pengumuman ke grup ${gId}:`, e.message);
          }
        }
        await reply(sock, msg, `✅ Pengumuman berhasil dikirim ke ${successCount} grup!`);
        break;

      case "setowner":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma owner!");
        // Tambah owner baru sementara (runtime only)
        const newOwner = args[0]?.replace(/[^0-9]/g, "");
        if (newOwner) config.owners.push(newOwner);
        await reply(sock, msg, `✅ ${newOwner} ditambah sebagai owner sementara.`);
        break;

      // ---------- ADMIN & OWNER ----------
      case "add":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const addTarget = args[0]?.replace(/[^0-9]/g, "");
        if (!addTarget) return reply(sock, msg, "❌ Masukkan nomor yang mau ditambah! Contoh: !add 6281234567890");
        
        const addJid = addTarget + "@s.whatsapp.net";
        try {
          const addRes = await sock.groupParticipantsUpdate(groupId, [addJid], "add");
          if (addRes[0]?.status === 403 || addRes[0]?.status === "403") {
            await reply(sock, msg, "⚠️ Pengaturan privasi orang tersebut mencegah bot menambahkannya secara otomatis. Coba kirim link grup.");
          } else if (addRes[0]?.status === 409 || addRes[0]?.status === "409") {
            await reply(sock, msg, "✅ Nomor tersebut udah ada di dalam grup.");
          } else {
            await sock.sendMessage(groupId, { text: `✅ Sukses mengundang @${addTarget} ke grup!`, mentions: [addJid] }, { quoted: msg });
          }
        } catch (e) {
          await reply(sock, msg, "❌ Gagal bos menambahkan nomor. Pastiin nomor tersebut terdaftar di WhatsApp.");
        }
        break;

      case "warn":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await warnSystem.warn(sock, msg, groupId, sender, args);
        break;

      case "kick":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const kickTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!kickTarget) return reply(sock, msg, "❌ Tag siapa yang mau dikick! Contoh: !kick @user alasan");
        
        const alasanKick = args.slice(1).join(" ") || "Melanggar peraturan grup";
        const dKick = new Date();
        const strKick = `${dKick.toLocaleDateString('id-ID')} | ${dKick.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
        
        await sock.groupParticipantsUpdate(groupId, [kickTarget], "remove");
        
        const kickMsg = `╭━━• [ 🚷 *MEMBER DIKICK* ] •━━╮
┃
┃ 👤 *Target:* @${kickTarget.split("@")[0]}
┃ 📝 *Pelanggaran:* ${alasanKick}
┃ ⏰ *Waktu Eksekusi:* ${strKick}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        await sock.sendMessage(groupId, { text: kickMsg, mentions: [kickTarget] }, { quoted: msg });
        break;

      case "mute":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const muteTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!muteTarget) return reply(sock, msg, "❌ Tag siapa yang mau dimute! Contoh: !mute @user 10");
        
        const muteDur = parseInt(args[1]) || config.muteDuration;
        antiSpam.mute(muteTarget, muteDur);
        
        const dMute = new Date();
        const strMute = `${dMute.toLocaleDateString('id-ID')} | ${dMute.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
        
        const muteMsg = `╭━━• [ 🔇 *MEMBER DIMUTE* ] •━━╮
┃
┃ 👤 *Target:* @${muteTarget.split("@")[0]}
┃ ⏳ *Durasi Hukuman:* ${muteDur} Menit
┃ ⏰ *Waktu Eksekusi:* ${strMute}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        await sock.sendMessage(groupId, { text: muteMsg, mentions: [muteTarget] }, { quoted: msg });
        break;

      case "unmute":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const unmuteTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (unmuteTarget) {
          antiSpam.unmute(unmuteTarget);
          await reply(sock, msg, `🔊 ${unmuteTarget.split("@")[0]} di-unmute.`);
        }
        break;

      case "del":
      case "delete":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const quotedMsgForDel = msg.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsgForDel?.stanzaId) return reply(sock, msg, "❌ Balas pesan yang ingin dihapus dengan !del");
        
        try {
          let rawBotId = sock.user.id;
          if (rawBotId.includes(':')) rawBotId = rawBotId.split(':')[0] + '@s.whatsapp.net';
          else if (!rawBotId.includes('@')) rawBotId = rawBotId + '@s.whatsapp.net';
          const botId = rawBotId;
          const key = {
            remoteJid: msg.key.remoteJid,
            fromMe: jidNormalizedUser(quotedMsgForDel.participant) === botId,
            id: quotedMsgForDel.stanzaId,
            participant: quotedMsgForDel.participant
          };
          await sock.sendMessage(msg.key.remoteJid, { delete: key });
        } catch (e) {
          console.error("Delete error:", e);
          await reply(sock, msg, "❌ Gagal bos ngapus pesan. Pastiin bot adalah admin.");
        }
        break;

      case "resetwarn":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const resetTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (resetTarget) {

          warnSystem.resetWarn(resetTarget);
          await reply(sock, msg, `✅ Warn ${resetTarget.split("@")[0]} direset.`);
        }
        break;

      case "warnlist":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await reply(sock, msg, warnSystem.getWarnList());
        break;

      case "tagall":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const meta = await sock.groupMetadata(groupId);
        const mentions = meta.participants.map(p => p.id);
        const tagText = args.join(" ") || "📢 Perhatian semua member!";
        const mentionStr = mentions.map(m => `@${m.split("@")[0]}`).join(" ");
        await sock.sendMessage(groupId, { text: `${tagText}\n\n${mentionStr}`, mentions });
        break;

      case "slowmode":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const delay = parseInt(args[0]) || 30;
        antiSpam.setSlowMode(delay);
        await reply(sock, msg, `⏱️ Slow mode aktif: ${delay} detik antar pesan.`);
        break;

      case "poll":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await games.createPoll(sock, groupId, args);
        break;

      case "endpoll":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await games.endPoll(sock, groupId, msg);
        break;

      // ---------- SEMUA MEMBER ----------
      case "help":
      case "menu":
        const name = msg.pushName || sender.split("@")[0];
        
        const dNow = new Date();
        const hr = dNow.getHours();
        let ucapan = "Selamat Pagi";
        if (hr >= 11 && hr < 15) ucapan = "Selamat Siang";
        else if (hr >= 15 && hr < 18) ucapan = "Selamat Sore";
        else if (hr >= 18 || hr < 4) ucapan = "Selamat Malam";

        const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const bulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const strHariTanggal = `${hariArr[dNow.getDay()]}, ${dNow.getDate()} ${bulanArr[dNow.getMonth()]} ${dNow.getFullYear()}`;
        const strJam = dNow.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':') + " WIB";

        const helpMsg = `╭━━• [ 🤖 *JackBOT* ] •━━╮
┃
┃ Yow kak *${name}*, ${ucapan}! 👋
┃ Met nongkrong bareng asisten lu.
┃
┣━━• [ 📅 *INFO* ] •━━
┃ 📆 Hari     : ${strHariTanggal}
┃ 🕒 Waktu    : ${strJam}
┃
┣━━• [ 🌐 *KOMUNITAS SEPANG* ] •━━
┃ ➯ https://github.com/fxcomunity
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
✨ *Pencet tombol "Pilih Kategori" di bawah buat cek fitur kece dari JackBOT!* 👇`;
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            image: { url: "https://i.ibb.co.com/BKNmDQf9/images.jpg" },
            caption: helpMsg,
            footer: "JackBOT v3.0.0",
            interactiveButtons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "Pilih Kategori",
                  sections: [
                    {
                      title: "Kategori Menu",
                      rows: [
                        { title: "Menu Khusus Owner", description: "Perintah khusus owner bot", id: "btn_owner" },
                        { title: "Menu Admin Grup", description: "Perintah khusus admin grup", id: "btn_admin" },
                        { title: "Menu Member Utama", description: "Perintah umum untuk semua member", id: "btn_member" },
                        { title: "Menu Economy RPG", description: "Mancing, Nambang, Combat & Skills", id: "btn_rpg" },
                        { title: "Menu Game & Hiburan", description: "Game interaktif & tebak-tebakan", id: "btn_game" },
                        { title: "Menu Downloader", description: "Download TikTok, IG, YT, dll", id: "btn_downloader" },
                        { title: "Developer Info", description: "Informasi website & developer", id: "btn_dev" },
                        { title: "Spotify Music", description: "Download lagu dari Spotify", id: "btn_spotify" },
                        { title: "Voice Changer", description: "Ubah suara VN jadi lucu", id: "btn_voice" }
                      ]
                    }
                  ]
                })
              }
            ]
          }, { });
        } catch(e) {
          console.log("Error sending menu:", e);
          await sock.sendMessage(msg.key.remoteJid, { text: helpMsg });
        }
        break;

      case "btn_owner": {
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma Owner yang bisa liat detail menu ini!");
        const txt = getHelpText(ownerCheck, adminCheck, "owner") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "1":
      case "btn_admin": {
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Cuma admin yg bisa liat ini bos!");
        const txt = getHelpText(ownerCheck, adminCheck, "admin") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }
      
      case "2":
      case "btn_member": {
        const txt = getHelpText(ownerCheck, adminCheck, "member") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }
      
      case "3":
      case "btn_game": {
        const txt = getHelpText(ownerCheck, adminCheck, "game") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt });
        break;
      }
      
      case "btn_rpg": {
        const txt = getHelpText(ownerCheck, adminCheck, "rpg") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt });
        break;
      }
      
      case "btn_downloader": {
        const txt = getHelpText(ownerCheck, adminCheck, "downloader") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "4":
      case "btn_dev":
      case "menu_4": {
        const txt = getHelpText(ownerCheck, adminCheck, "dev") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "5":
      case "btn_spotify":
      case "menu_5": {
        const txt = getHelpText(ownerCheck, adminCheck, "spotify") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "6":
      case "btn_voice":
      case "menu_6": {
        const txt = getHelpText(ownerCheck, adminCheck, "voice") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "afk":
        const alasan = args.join(" ");
        afk.setAfk(sender, alasan, new Date());
        await reply(sock, msg, `✅ Kamu sekarang AFK.\nAlasan: ${alasan || "Sedang sibuk"}\nKetikan apa saja nanti untuk membatalkan AFK.`);
        break;
      
      case "sticker":
      case "s":
        await sticker.createSticker(sock, msg, groupId);
        break;

      case "brat":
        if (!limitSystem.cek(sender, "sticker"))
          return reply(sock, msg, `❌ Limit sticker kamu habis hari ini ngab!`);
        await sticker.createBratSticker(sock, msg, groupId, args.join(" "));
        break;

      case "info":
        if (args.length > 0) {
           const query = args.join(" ").toLowerCase();
           
           if (query === "rpg" || query === "panduan") {
             let guide = `📖 *BUKU PINTAR RPG (BUAT LU YANG NOOB)* 📖\n\n`;
             guide += `⛏️ *CARA MAIN (BACA BIAR GAK BEGO)*\n`;
             guide += `• *Cari Duit*: Ketik \`!nambang\` tiap bbrp menit buat mulung batu. Kalo dapet ore, jual pake \`!sell [nama]\` biar dapet Gold (duit).\n`;
             guide += `• *Selain Batu*: Lu juga bisa \`!mancing\` ato \`!berburu\` buat cari bahan lain. Jangan rebahan doang!\n\n`;
             guide += `❤️ *DARAH (HP) & MANA (MP)*\n`;
             guide += `• *HP*: Darah lu bakal ngurang kalo digebuk monster. Kalo mau idup, beli Potion di \`!shop\` trus minum pake \`!pakai potion_kecil\`. Darah juga nambah dikit otomatis tiap lu nambang.\n`;
             guide += `• *MP*: Ini bensin buat ngeluarin skill sihir. Bakal nge-charge 5 poin tiap lu \`!nambang\`, ato instan nenggak *Mana Potion*.\n\n`;
             guide += `👹 *MONSTER & BOSS BANGSAT*\n`;
             guide += `Pas nambang, kadang ada monster nyebelin nyegat lu.\n`;
             guide += `• Ketik \`!serang\` kalo lu ngerasa jago (dapet drop lumayan).\n`;
             guide += `• Ketik \`!lari\` kalo darah lu sekarat (daripada mati konyol).\n`;
             guide += `• *Boss* (Mythos): HP tebel asu, tapi ngedrop *Mythical Ore*.\n\n`;
             guide += `🧙‍♂️ *SKILL MAGIC & BIKIN OP*\n`;
             guide += `• *Liat Skill*: Ketik \`!skills\` buat ngintip jurus apa aja yang bisa lu pelajarin.\n`;
             guide += `• *Belajar*: Ketik \`!belajar [nama_skill]\` (contoh: !belajar deteksi harta). Modal dikit bos!\n`;
             guide += `• *Upgrade*: Ketik \`!levelup [nama_skill]\` biar jurus lu makin mematikan (Max Lv.5).\n`;
             guide += `• *Pake Skill*: Ketik \`!skill [nama_skill]\` buat pamer.\n\n`;
             guide += `💡 *TIPS*: Ketik \`!info [nama monster/artefak]\` buat nge-kepo-in detail stats mereka.`;
             return reply(sock, msg, guide);
           }

           if (query === "skills" || query === "skill") {
             const skillsData = require('./features/skillsData');
             let msgInfo = `📖 *BUKU PINTAR SKILL RPG* 📖\n\n`;
             for (const s of skillsData.skills) {
               msgInfo += `✨ *${s.name}*\n`;
               msgInfo += `🔸 Tipe: ${s.type.toUpperCase()}\n`;
               msgInfo += `🔸 Cara Dapet: ${s.source}\n`;
               msgInfo += `🔸 Cara Upgrade: Ketik !levelup ${s.id} (butuh Gold/Item/Level sesuai tier-nya)\n`;
               msgInfo += `🔸 Efek Maksimal (Lv.5): ${s.levels[4].desc}\n\n`;
             }
             msgInfo += `💡 *TIPS*: Ketik !skills buat liat skill yang lu punya, dan !belajar [nama_skill] buat mulai belajar!`;
             return reply(sock, msg, msgInfo);
           }

           const rpgData = require('./features/rpgData');
           
           if (query === "boss" || query === "monster") {
             let msgInfo = `📖 *BUKU PINTAR MONSTER & BOSS* 📖\n\n`;
             for (let t = 1; t <= 6; t++) {
               const tierName = rpgData.monsterTiers[t].name;
               const tierMonsters = rpgData.monsters.filter(m => m.tier === t);
               msgInfo += `🌟 *TIER ${t} - ${tierName.toUpperCase()}*\n`;
               tierMonsters.forEach(m => {
                 msgInfo += `▪️ ${m.name} (HP: ${m.maxHp}, Dmg: ${m.damage[0]}-${m.damage[1]})\n`;
               });
               msgInfo += `\n`;
             }
             msgInfo += `💡 *TIPS*: Ketik !info [nama_monster] buat ngeliat detail stat & drop-annya!`;
             return reply(sock, msg, msgInfo);
           }
           
           if (query === "artefak" || query === "artifact") {
             let msgInfo = `📖 *BUKU PINTAR ARTEFAK* 📖\n\n`;
             for (let t = 1; t <= 6; t++) {
               const tierName = rpgData.artifactTiers[t].name;
               const tierArtifacts = rpgData.artifacts.filter(a => a.tier === t);
               msgInfo += `🌟 *TIER ${t} - ${tierName.toUpperCase()}*\n`;
               tierArtifacts.forEach(a => {
                 msgInfo += `▪️ ${a.name} (${a.type})\n`;
               });
               msgInfo += `\n`;
             }
             msgInfo += `💡 *TIPS*: Ketik !info [nama_artefak] buat ngeliat efek detail & harganya!`;
             return reply(sock, msg, msgInfo);
           }

           if (query === "enchant" || query === "enchants") {
             const enchantsData = require('./features/enchantsData');
             let msgInfo = `📖 *BUKU PINTAR ENCHANTMENT* 📖\n\n`;
             enchantsData.enchants.forEach(e => {
               msgInfo += `✨ *Nama enchant* : ${e.name}\n`;
               msgInfo += `🔸 *Tipe* : ${e.tier}\n`;
               msgInfo += `🔸 *Ability enchant* : ${e.ability}\n`;
               msgInfo += `🔸 *Chance* : ${e.chance}\n\n`;
             });
             msgInfo += `💡 *TIPS*: Enchant bisa dibeli di !shop atau didapet dari hoki pas nambang/mancing!`;
             return reply(sock, msg, msgInfo);
           }

           // search monster
           const monster = rpgData.monsters.find(m => m.name.toLowerCase().includes(query) || m.id === query);
           if (monster) {
             let msgInfo = `📖 *BESTIARY: ${monster.name}*\n\n`;
             msgInfo += `🌟 Tier: ${rpgData.monsterTiers[monster.tier].name}\n`;
             msgInfo += `❤️ HP: ${monster.maxHp}\n`;
             msgInfo += `⚔️ Damage: ${monster.damage[0]} - ${monster.damage[1]}\n`;
             msgInfo += `✨ Ability: ${monster.ability}\n`;
             msgInfo += `💰 Drop Gold: ${monster.dropGold[0]} - ${monster.dropGold[1]}\n`;
             msgInfo += `📦 Drop Item: ${monster.dropItem}\n`;
             await reply(sock, msg, msgInfo);
             break;
           }
           
           // search artifact
           const artifact = rpgData.artifacts.find(a => a.name.toLowerCase().includes(query) || a.id === query);
           if (artifact) {
             let msgInfo = `📖 *ARTIFACT: ${artifact.name}*\n\n`;
             msgInfo += `🌟 Tier: ${rpgData.artifactTiers[artifact.tier].name}\n`;
             msgInfo += `⚙️ Tipe: ${artifact.type}\n`;
             if (artifact.action === "buff") msgInfo += `⚡ Efek: Buff [${artifact.buff}] selama ${artifact.duration} menit\n`;
             if (artifact.action === "heal") msgInfo += `⚡ Efek: Heal ${artifact.amount} HP\n`;
             if (artifact.action === "instant_ore" || artifact.action === "instant_epic" || artifact.action === "instant_massive") msgInfo += `⚡ Efek: Instan Drop (${artifact.action})\n`;
             if (artifact.action === "reset_cd") msgInfo += `⚡ Efek: Reset CD Tambang\n`;
             if (artifact.action === "heal_status") msgInfo += `⚡ Efek: Menyembuhkan status buruk\n`;
             msgInfo += `💰 Harga Jual: ${artifact.price} koin\n`;
             await reply(sock, msg, msgInfo);
             break;
           }
           
           await reply(sock, msg, `❌ Tidak menemukan monster atau artefak dengan nama '${query}'.\nKetik !info tanpa spasi untuk info grup.`);
           break;
        } else {
           const w = economy.getWallet(sender);
           if (w && w.combat && w.combat.active) {
              const rpgData = require('./features/rpgData');
              const monster = rpgData.monsters.find(m => m.id === w.combat.monsterId);
              let msgInfo = `🔎 *MENGAMAT MONSTER SAAT INI*\n\n`;
              msgInfo += `👹 Nama: ${monster.name}\n`;
              msgInfo += `🌟 Tier: ${rpgData.monsterTiers[monster.tier].name}\n`;
              msgInfo += `❤️ Sisa HP: ${w.combat.monsterHp}/${w.combat.monsterMaxHp}\n`;
              msgInfo += `⚔️ Damage: ${monster.damage[0]} - ${monster.damage[1]}\n`;
              msgInfo += `✨ Ability: ${monster.ability}\n`;
              await reply(sock, msg, msgInfo);
              break;
           }
           
           const groupInfo = await sock.groupMetadata(groupId);
           await reply(sock, msg, `📋 *Info Grup*\nNama: ${groupInfo.subject}\nMember: ${groupInfo.participants.length}\nDeskripsi: ${groupInfo.desc || "-"}\n\n_Ketik *!info rpg* untuk panduan lengkap bermain RPG tambang._`);
        }
        break;

      case "status":
        const stTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
        const stName = stTarget === sender ? (msg.pushName || stTarget.split("@")[0]) : stTarget.split("@")[0];
        
        let stRole = "👤 Member Biasa";
        if (config.owners.includes(stTarget.split("@")[0])) {
          stRole = "👑 Owner / Pencipta";
        } else {
          const mData = await sock.groupMetadata(groupId);
          const stIsAdmin = mData.participants.find(p => p.id === stTarget)?.admin != null;
          if (stIsAdmin) stRole = "🛡️ Admin Grup";
        }
        
        const stWallet = economy.getRawWallet(stTarget);
        const stWarns = warnSystem.getWarn(stTarget);
        const maxW = config.maxWarn;
        const stLimit = limitSystem.cek(stTarget, "download") ? "Tersedia" : "Habis";
        
        const statusMsg = `╭━━• [ 📊 *STATUS MEMBER* ] •━━╮
┃ 
┃ 👤 *Nama:* ${stName}
┃ 🏷️ *Nomor:* ${stTarget.split("@")[0]}
┃ 🎖️ *Role:* ${stRole}
┃ ⏳ *Lama Bergabung:* Sejak awal (Data tidak direkam)
┃  
┣━━ [ 💰 DOMPET & LEVEL ]
┃ 🪙 *Koin:* ${stWallet.coins}
┃ 📈 *Level:* ${stWallet.level}
┃ ✨ *XP:* ${stWallet.xp} / ${stWallet.level * 100}
┃ 
┣━━ [ 🛡️ REPUTASI & LIMIT ]
┃ ⚠️ *Peringatan:* ${stWarns} / ${maxW}
┃ 📥 *Limit DL:* ${stLimit}
┃  
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        await sock.sendMessage(groupId, { text: statusMsg, mentions: [stTarget] }, { quoted: msg });
        break;

      case "daily":
        await economy.daily(sock, msg, sender);
        break;

      case "saldo":
        await economy.cekSaldo(sock, msg, sender);
        break;

      case "transfer":
        await economy.transfer(sock, msg, sender, args);
        break;

      case "shop":
        await economy.shop(sock, msg);
        break;

      case "beli":
        await economy.beli(sock, msg, sender, args);
        break;

      // =====================================
      // RPG COMBAT
      // =====================================
      case "serang":
        const combatSerang = require('./features/combat');
        await combatSerang.serang(sock, msg, sender);
        break;
      case "lari":
        const combatLari = require('./features/combat');
        await combatLari.lari(sock, msg, sender);
        break;
      case "potion":
        const combatPotion = require('./features/combat');
        await combatPotion.usePotion(sock, msg, sender);
        break;

      // =====================================
      // RPG SKILLS & MAGIC
      // =====================================
      case "skills":
        const skillsFeature = require('./features/skills');
        await skillsFeature.listSkills(sock, msg, sender);
        break;
      case "belajar":
        const skillsBelajar = require('./features/skills');
        await skillsBelajar.belajar(sock, msg, sender, args);
        break;
      case "skill":
        const skillsUse = require('./features/skills');
        await skillsUse.useSkill(sock, msg, sender, args);
        break;
      case "levelup":
      case "upgrade":
        const skillsLevelup = require('./features/skills');
        await skillsLevelup.levelupSkill(sock, msg, sender, args);
        break;

      case "leaderboard":
      case "lb":
        await economy.leaderboard(sock, msg, groupId);
        break;

      case "gacha":
        await economy.gacha(sock, msg, sender, args);
        break;

      case "mancing":
        await economy.mancing(sock, msg, sender);
        break;

      case "berburu":
        await economy.berburu(sock, msg, sender);
        break;

      case "nambang":
        await economy.nambang(sock, msg, sender);
        break;

      case "inv":
      case "inventory":
        await economy.inventory(sock, msg, sender);
        break;
        
      case "sell":
        await economy.sell(sock, msg, sender, args);
        break;

      case "use":
      case "pakai":
        await economy.pakai(sock, msg, sender, args);
        break;

      case "cekbot":
        if (!ownerCheck) return;
        try {
          const admins = await getGroupAdmins(sock, groupId);
          const rawBotId = sock.user.id;
          const parsedId = jidNormalizedUser(rawBotId);
          
          let debugTxt = `DEBUG INFO:\n- sock.user.id: ${rawBotId}\n- parsedId: ${parsedId}\n- isAdmin: ${admins.includes(parsedId)}\n- Admins list:\n${admins.join('\n')}`;
          await reply(sock, msg, debugTxt);
        } catch (e) {
          await reply(sock, msg, "Error: " + e.message);
        }
        break;



      // ==========================================
      // FITUR ADMIN OP
      // ==========================================
      case "promote":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!ownerCheck) return reply(sock, msg, "⚠️ Fitur ini dibatasi cuma untuk Owner bot!");
        const targetPromote = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] + "@s.whatsapp.net";
        if (!targetPromote) return reply(sock, msg, "⚠️ Tag member yang ingin dinaikkan pangkatnya!");
        await admin.promote(sock, msg, groupId, targetPromote);
        break;

      case "demote":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!ownerCheck) return reply(sock, msg, "⚠️ Fitur ini dibatasi cuma untuk Owner bot!");
        const targetDemote = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] + "@s.whatsapp.net";
        if (!targetDemote) return reply(sock, msg, "⚠️ Tag admin yang ingin diturunkan pangkatnya!");
        await admin.demote(sock, msg, groupId, targetDemote);
        break;

      case "kickall":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        if (!ownerCheck) return reply(sock, msg, "⚠️ Fitur super berbahaya ini dibatasi cuma untuk Owner bot!"); // Biar aman
        await admin.kickall(sock, msg, groupId, sender);
        break;

      case "setname":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await admin.setName(sock, msg, groupId, args.join(" "));
        break;

      case "setdesc":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await admin.setDesc(sock, msg, groupId, args.join(" "));
        break;

      case "setpp":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await admin.setPp(sock, msg, groupId, downloadMediaMessage);
        break;

      // ==========================================
      // FITUR STALKER OP
      // ==========================================
      case "igstalk":
        await stalker.igStalk(sock, msg, args[0]);
        break;

      case "ttstalk":
        await stalker.ttStalk(sock, msg, args[0]);
        break;

      case "ghstalk":
        await stalker.ghStalk(sock, msg, args[0]);
        break;

      case "tutor":
        const tutorMsg = `🎓 *TUTORIAL JackBOT* 🎓

1️⃣ *Sistem Ekonomi (Koin)*
Koin digunakan untuk membeli item di \`!shop\` atau mentransfer ke teman (\`!transfer\`). Dapatkan koin dengan cara:
- Chat aktif di grup (setiap pesan menambah koin/XP)
- Mainkan \`!kuis\` atau \`!tebak\`
- Ambil koin gratis setiap hari via \`!daily\`

2️⃣ *Sistem Limit (Kuota)*
Beberapa fitur butuh limit:
- \`!s\` (Sticker)
- Tanya AI
- Main Kuis / Game
- Download (\`!yt\`, \`!tt\`, dll)
Setiap user diberi jatah limit harian. Jika habis, tunggu besok hari karena limit di-reset otomatis setiap 24 jam. Owner memiliki limit tak terbatas (∞).

3️⃣ *Fitur Unggulan*
- *AFK*: Ketik \`!afk tidur\` jika sedang sibuk, bot akan memberitahu siapa saja yang me-mention kamu.
- *Sticker*: Balas/kirim gambar dengan *caption* \`!s\`.
- *AI*: Ajak bot ngobrol pintar dengan mengetik \`bot, [pertanyaanmu]\`.

Selamat bersenang-senang! 🎉`;
        await reply(sock, msg, tutorMsg);
        break;

      case "kuis":
        if (!limitSystem.cek(sender, "kuis"))
          return reply(sock, msg, `❌ Limit game kamu habis hari ini! Ketik !limit untuk cek sisa.`);
        await games.startQuiz(sock, msg, groupId);
        break;

      case "tebak":
        await games.tebaknomor(sock, msg, groupId, sender);
        break;

      case "jawab":
        await games.jawab(sock, msg, groupId, sender, args);
        break;

      case "stats":
        await reply(sock, msg, statistics.getGroupStats(groupId));
        break;

      case "mystats":
        await reply(sock, msg, statistics.getUserStats(sender));
        break;

      case "topaktif":
        await reply(sock, msg, statistics.getTopActive(groupId));
        break;

      case "ping": {
        const os = require('os');
        const pingStart = Date.now();
        await sock.sendMessage(groupId, { react: { text: "🚀", key: msg.key } });
        const pingEnd = Date.now();
        
        const uptime = process.uptime();
        const d = Math.floor(uptime / (3600*24));
        const h = Math.floor(uptime % (3600*24) / 3600);
        const m = Math.floor(uptime % 3600 / 60);
        const s = Math.floor(uptime % 60);
        const uptimeStr = `${d} Hari, ${h} Jam, ${m} Menit, ${s} Detik`;

        const totalRAM = Math.round(os.totalmem() / 1024 / 1024);
        const freeRAM = Math.round(os.freemem() / 1024 / 1024);
        const usedRAM = totalRAM - freeRAM;

        const text = `🏓 *PONG!*\n\n` +
                     `⚡ *Kecepatan Respon:* ${pingEnd - pingStart} ms\n` +
                     `⏱️ *Uptime Bot:* ${uptimeStr}\n` +
                     `💻 *Platform:* ${os.type()} ${os.release()}\n` +
                     `💾 *RAM:* ${usedRAM} MB / ${totalRAM} MB\n\n` +
                     `👤 *Developer:* 陈嘉杰 | Val`;

        await reply(sock, msg, text);
        break;
      }

      case "quotes":
        await fun.getQuote(sock, msg);
        break;

      case "fakta":
        await fun.getFakta(sock, msg);
        break;

      case "apakah":
        await fun.getApakah(sock, msg, args.join(" "));
        break;

      case "bisakah":
        await fun.getBisakah(sock, msg, args.join(" "));
        break;

      case "kapankah":
        await fun.getKapankah(sock, msg, args.join(" "));
        break;

      case "rate":
        await fun.getRate(sock, msg, args.join(" "));
        break;

      case "jodoh":
        await fun.getJodoh(sock, msg);
        break;

      case "cekkhodam":
        await fun.getCekKhodam(sock, msg, args.join(" "));
        break;

      case "toimg":
        await sticker.imgFromSticker(sock, msg, groupId);
        break;

      case "tr":
      case "translate":
        await utils.translateText(sock, msg, args.join(" "));
        break;

      case "menfess":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await fun.sendMenfess(sock, msg, sender, args);
        break;

      case "imagine":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit harian kamu habis! Minta owner buat nambah.");
        await fun.imagine(sock, msg, args.join(" "));
        break;

      case "tts":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await utils.getTTS(sock, msg, args.join(" "));
        break;

      case "jadwalsholat":
        await utils.getJadwalSholat(sock, msg, args.join(" "));
        break;

      case "cuaca":
        await reply(sock, msg, await utils.cuaca(args[0]));
        break;

      case "kurs":
        await reply(sock, msg, await utils.kurs(args[0]));
        break;

      case "qr":
        await utils.buatQR(sock, msg, args.join(" "));
        break;

      case "spotifyplay":
      case "spplay":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit download kamu habis hari ini ngab!");
        await spotify.spotifyPlay(sock, msg, args.join(" "));
        break;

      case "spotifysearch":
      case "spotifys":
      case "sps":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit download kamu habis hari ini ngab!");
        await spotify.spotifySearch(sock, msg, args.join(" "));
        break;

      case "remind":
        await utils.setReminder(sock, msg, sender, args);
        break;

      case "yt":
        if (!config.features.downloader) break;
        if (!limitSystem.cek(sender, "download"))
          return reply(sock, msg, `❌ Limit download kamu habis! Ketik !limit untuk cek sisa.`);
        await downloader.youtube(sock, msg, args);
        break;

      case "tt":
        if (!config.features.downloader) break;
        if (!limitSystem.cek(sender, "download"))
          return reply(sock, msg, `❌ Limit download kamu habis! Ketik !limit untuk cek sisa.`);
        await downloader.tiktok(sock, msg, args);
        break;

      case "ig":
        if (!config.features.downloader) break;
        if (!limitSystem.cek(sender, "download"))
          return reply(sock, msg, `❌ Limit download kamu habis! Ketik !limit untuk cek sisa.`);
        await downloader.instagram(sock, msg, args);
        break;

      case "pin":
      case "gambar":
      case "pinterest":
        if (!config.features.downloader) break;
        if (!limitSystem.cek(sender, "download"))
          return reply(sock, msg, `❌ Limit download kamu habis! Ketik !limit untuk cek sisa.`);
        await downloader.pinterest(sock, msg, sender, args);
        break;

      case "fb":
        if (!config.features.downloader) break;
        if (!limitSystem.cek(sender, "download"))
          return reply(sock, msg, `❌ Limit download kamu habis! Ketik !limit untuk cek sisa.`);
        await downloader.fb(sock, msg, args);
        break;
      
      case "tw":
      case "x":
        if (!config.features.downloader) break;
        if (!limitSystem.cek(sender, "download"))
          return reply(sock, msg, `❌ Limit download kamu habis! Ketik !limit untuk cek sisa.`);
        await downloader.tw(sock, msg, args);
        break;

      case "limit":
      case "ceklimit":
        await limitSystem.showLimit(sock, msg, sender);
        break;

      case "rvo":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma owner yang bisa pake fitur ini!");
        try {
          const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          if (!quotedMsg) {
            return reply(sock, msg, "❌ Balas pesan View Once (Sekali Lihat) dengan command !rvo");
          }
          
          let viewOnceInner = quotedMsg.viewOnceMessage?.message || quotedMsg.viewOnceMessageV2?.message || quotedMsg.viewOnceMessageV2Extension?.message || quotedMsg;
          
          let mediaType = Object.keys(viewOnceInner).find(k => k === 'imageMessage' || k === 'videoMessage' || k === 'audioMessage');
          
          let isViewOnce = quotedMsg.viewOnceMessage || quotedMsg.viewOnceMessageV2 || quotedMsg.viewOnceMessageV2Extension || (mediaType && viewOnceInner[mediaType]?.viewOnce);
          
          if (!isViewOnce || !mediaType) {
            return reply(sock, msg, "❌ Balas pesan View Once (Sekali Lihat) dengan command !rvo");
          }
          
          await reply(sock, msg, "🔓 Membuka pesan rahasia...");
          
          const fakeMsg = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant
            },
            message: viewOnceInner
          };
          
          const buffer = await downloadMediaMessage(
            fakeMsg,
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          
          const caption = viewOnceInner[mediaType]?.caption || "";
          
          if (mediaType === 'imageMessage') {
            await sock.sendMessage(groupId, { image: buffer, caption: `🔓 *Anti View Once*\n\n📝 Caption: ${caption}` }, { quoted: msg });
          } else if (mediaType === 'videoMessage') {
            await sock.sendMessage(groupId, { video: buffer, caption: `🔓 *Anti View Once*\n\n📝 Caption: ${caption}` }, { quoted: msg });
          } else if (mediaType === 'audioMessage') {
            await sock.sendMessage(groupId, { audio: buffer, ptt: true }, { quoted: msg });
          } else {
            await reply(sock, msg, "❌ Format media tidak didukung.");
          }
        } catch (e) {
          console.error("RVO Error:", e);
          await reply(sock, msg, "❌ Gagal bos membuka pesan View Once.");
        }
        break;

      case "sw":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma owner yang bisa pake fitur ini!");
        try {
          const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          
          if (!quotedMsg || (!quotedMsg.imageMessage && !quotedMsg.videoMessage && !quotedMsg.extendedTextMessage)) {
            return reply(sock, msg, "❌ Balas status WA (foto/video/teks) dengan command !sw");
          }

          const isImage = quotedMsg.imageMessage;
          const isVideo = quotedMsg.videoMessage;
          const isText = quotedMsg.extendedTextMessage;
          
          const caption = isImage?.caption || isVideo?.caption || isText?.text || "";
          
          if (isImage || isVideo) {
            const fakeMsg = {
              key: {
                remoteJid: msg.key.remoteJid,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
              },
              message: quotedMsg
            };
            
            const buffer = await downloadMediaMessage(
              fakeMsg,
              'buffer',
              {},
              { logger: console, reuploadRequest: sock.updateMediaMessage }
            );
            
            if (isImage) {
              await sock.sendMessage(msg.key.remoteJid, { image: buffer, caption: caption }, { quoted: msg });
            } else {
              await sock.sendMessage(msg.key.remoteJid, { video: buffer, caption: caption }, { quoted: msg });
            }
          } else if (isText) {
            await sock.sendMessage(msg.key.remoteJid, { text: caption }, { quoted: msg });
          }
        } catch (e) {
          console.error("SW Error:", e);
          await reply(sock, msg, "❌ Gagal bos download status.");
        }
        break;



      case "bass":
      case "chipmunk":
      case "tupai":
      case "robot":
      case "slow":
      case "fast":
      case "echo":
      case "reverb":
      case "nightcore":
      case "reverse":
      case "vibrato":
      case "dalek":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await audioEffects.applyEffect(sock, msg, cmd);
        break;

      case "limitall":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        await limitSystem.showAllLimits(sock, msg);
        break;

      case "resetlimit":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const rlTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (rlTarget) {
          limitSystem.resetLimit(rlTarget);
          await reply(sock, msg, `✅ Limit @${rlTarget.split("@")[0]} berhasil direset!`);
        }
        break;

      case "setlimit":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan admin grup cuy, diem aja!");
        const slTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const slType   = args[1]; // download/ai/kuis/sticker
        const slMax    = parseInt(args[2]);
        if (slTarget && slType && slMax) {
          limitSystem.setCustomLimit(slTarget, slType, slMax);
          await reply(sock, msg, `✅ Limit ${slType} @${slTarget.split("@")[0]} diset ke ${slMax}.`);
        } else {
          await reply(sock, msg, "Format: !setlimit @user [download/ai/kuis/sticker] [jumlah]");
        }
        break;

      default:
        // Tidak ada command yang cocok, abaikan
        break;
      }
    } catch (globalErr) {
      console.error("Global Message Processing Error:", globalErr);
    }
  });
}

// ============================================
// HELPER: MENU TEXT
// ============================================
function getHelpText(isOwner = false, isAdmin = false, kategori = "all") {
  if (kategori === "admin") {
    let text = `╭━━• [ 🛡️ *MENU ADMIN* ] •━━╮
┃ ➯ !add [nomor]
┃    ↳ Masukin nomor orang ke grup
┃ ➯ !kick @user [alasan]
┃    ↳ Tendang beban grup
┃ ➯ !warn @user [alasan]
┃    ↳ SP1 buat member bandel
┃ ➯ !mute @user [mnt]
┃    ↳ Bikin member kicep/bisu
┃ ➯ !unmute @user
┃    ↳ Buka segel bisu
┃ ➯ !del
┃    ↳ Hapus chat ampas (reply)
┃ ➯ !resetwarn @user
┃    ↳ Ampunin 1 dosa member
┃ ➯ !warnlist
┃    ↳ List orang-orang bandel
┃ ➯ !lock
┃    ↳ Gembok grup (admin doang yg ngoceh)
┃ ➯ !unlock [jam]
┃    ↳ Buka gembok grup (Contoh: !unlock 06.00)
┃ ➯ !tagall [pesan]
┃    ↳ Bangunin semua orang
┃ ➯ !slowmode [detik]
┃    ↳ Bikin ngetik jadi lelet
┃ ➯ !poll "tanya" op1|op2
┃    ↳ Bikin voting
┃ ➯ !endpoll
┃    ↳ Kelarin voting
┃ 
┃ ┣━━ [ 👑 FITUR ADMIN OP ]
┃ ➯ !setname [teks]
┃    ↳ Ubah nama grup
┃ ➯ !setdesc [teks]
┃    ↳ Ubah deskripsi grup
┃ ➯ !setpp
┃    ↳ Ganti foto profil grup (reply)
╰━━━━━━━━━━━━━━━━━━━╯`;
    return text;
  }

  if (kategori === "owner") {
    if (!isOwner) return "❌ Dih sapa lu? Cuma Owner yg bisa pake ini!";
    return `╭━━• [ 👑 *MENU OWNER* ] •━━╮
┃ ➯ !lock [durasi]
┃    ↳ Gembok grup
┃ ➯ !unlock
┃    ↳ Buka gembok grup
┃ ➯ !shutdown
┃    ↳ Matiin bot paksa njir
┃ ➯ !setowner @user
┃    ↳ Tambah bekingan owner
┃ ➯ !limitall
┃    ↳ Cek sisa limit semua user
┃ ➯ !resetlimit @user
┃    ↳ Reset limit miskiner
┃ ➯ !setlimit @user [jenis]
┃    ↳ Seting limit sesuka hati
┃ ➯ !sw
┃    ↳ Nyolong Status WA
┃ ➯ !rvo
┃    ↳ Buka rahasia View Once (gabisa sembunyi lu)
┃ ➯ !promote [@tag]
┃    ↳ Angkat derajat jadi admin
┃ ➯ !demote [@tag]
┃    ↳ Turunin pangkat admin jadi jongos
┃ ➯ !kickall
┃    ↳ ⚠️ Kiamat grup (Kick semua)
╰━━━━━━━━━━━━━━━━━━━╯`;
  }
  
  if (kategori === "member") {
    return `╭━━• [ 👤 *MENU RAKYAT JELATA* ] •━━╮
┃ 
┃ ➯ !status [@user]
┃    ↳ Cek profil & KTP lu
┃ ➯ !s / !sticker
┃    ↳ Bikin stiker (biar kaga garing)
┃ ➯ !brat [teks]
┃    ↳ Bikin stiker gaya album BRAT
┃ ➯ !afk [alasan]
┃    ↳ Pasang status sibuk/molor
┃ ➯ bot, [tanya]
┃    ↳ Ngobrol random sama AI (gue)
┃ 
┣━━ [ 💰 DUIT & LIMIT ]
┃ ➯ !limit
┃    ↳ Cek sisa limit lu (awas abis)
┃ ➯ !daily
┃    ↳ Klaim jatah preman harian
┃ ➯ !saldo
┃    ↳ Cek duit & level lu
┃ ➯ !transfer @user jml
┃    ↳ Sedekah koin ke temen
┃ ➯ !shop
┃    ↳ Buka pasar malem (toko)
┃ ➯ !leaderboard
┃    ↳ Liat siapa yg paling kaya
┃ ➯ !tutor
┃    ↳ Baca panduan, biar ga nanya mulu
┃ 
┣━━ [ 📈 STATISTIK KEPOS ]
┃ ➯ !stats
┃    ↳ Lihat ringkasan data grup
┃ ➯ !mystats
┃    ↳ Liat ringkasan dosa lu
┃ ➯ !topaktif
┃    ↳ Daftar orang paling bacot di grup
┃ 
┣━━ [ 🛠️ TOOL GABUT & STALKER ]
┃ ➯ !imagine [deskripsi]
┃    ↳ Bikin gambar pake AI
┃ ➯ !cuaca [kota]
┃    ↳ Cek pawang hujan daerah lu
┃ ➯ !kurs [uang]
┃    ↳ Cek konversi duit
┃ ➯ !qr [teks]
┃    ↳ Bikin barcode QR
┃ ➯ !remind [wkt] [pesan]
┃    ↳ Alarm biar lu ga lupa
┃ ➯ !igstalk [username]
┃    ↳ Intip IG orang diem-diem
┃ ➯ !ttstalk [username]
┃    ↳ Kepoin TikTok orang
┃ ➯ !ghstalk [username]
┃    ↳ Intip GitHub sepuh
╰━━━━━━━━━━━━━━━━━━━╯`;
  }
  
  if (kategori === "game") {
    return `╭━━• [ 🎮 *GAME & FUN* ] •━━╮
┃ 
┣━━ [ 🎯 PERMAINAN KUIS ]
┃ ➯ !kuis
┃    ↳ Main tebak pengetahuan
┃ ➯ !tebak
┃    ↳ Main tebak angka rahasia
┃ ➯ !jawab [angka]
┃    ↳ Menjawab tebakan angka
┃ 
┣━━ [ 🎭 FUN & HIBURAN ]
┃ ➯ !cekkhodam [nama]
┃    ↳ Cek khodam pendampingmu
┃ ➯ !jodoh @user1 @user2
┃    ↳ Cek kecocokan jodoh
┃ ➯ !ping
┃    ↳ Cek kecepatan respon bot
┃ ➯ !quotes
┃    ↳ Minta kata mutiara/motivasi
┃ ➯ !fakta
┃    ↳ Baca fakta unik dunia
┃ ➯ !apakah [tanya]
┃    ↳ Ramalan jawaban Ya/Tidak
┃ ➯ !bisakah [tanya]
┃    ↳ Prediksi Bisa/Tidak
┃ ➯ !kapankah [tanya]
┃    ↳ Prediksi waktu kejadian
┃ ➯ !rate [nama]
┃    ↳ Cek persentase skor
╰━━━━━━━━━━━━━━━━━━━╯`;
  }
  if (kategori === "rpg") {
    return `╭━━• [ ⚔️ *ECONOMY & RPG* ] •━━╮
┃ 
┣━━ [ ⛏️ KERJA KERAS BAGAI QUDA ]
┃ ➯ !nambang
┃    ↳ Mulung batu & material 
┃ ➯ !mancing
┃    ↳ Mancing mania mantap
┃ ➯ !berburu
┃    ↳ Berburu hewan di utan
┃ 
┣━━ [ 💰 DUIT & BARANG ]
┃ ➯ !inv / !inventory
┃    ↳ Ngintip isi tas & status darah
┃ ➯ !saldo
┃    ↳ Liat harta & level lu
┃ ➯ !shop
┃    ↳ Buka pasar malem
┃ ➯ !beli [id]
┃    ↳ Check out barang / potion
┃ ➯ !sell / !jual [nama_item] [jumlah]
┃    ↳ Ngejual rongsokan hasil mulung
┃ ➯ !pakai [nama_item]
┃    ↳ Nenggak potion / pake item
┃ 
┣━━ [ 🧙‍♂️ MAGIC BIAR OP ]
┃ ➯ !skills
┃    ↳ Liat daftar skill sihir
┃ ➯ !belajar [nama_skill]
┃    ↳ Belajar jurus baru (modal dikit)
┃ ➯ !levelup [nama_skill]
┃    ↳ Upgrade skill biar makin gacor
┃ ➯ !skill [nama_skill]
┃    ↳ Pamer ngeluarin jurus
┃ 
┣━━ [ ⚔️ GELUT SYSTEM ]
┃ ➯ !serang
┃    ↳ Gebuk monster pas nambang
┃ ➯ !potion
┃    ↳ Minum ramuan pas sekarat
┃ ➯ !lari
┃    ↳ Kabur njir daripada mati
┃ ➯ !info rpg
┃    ↳ 📖 Baca panduan lengkap buat noob
┃ ➯ !info [nama_monster]
┃    ↳ Kepoin stat & drop monster
╰━━━━━━━━━━━━━━━━━━━╯`;
  }
  
  if (kategori === "downloader") {
    return `╭━━• [ 📥 *TUKANG SEDOT* ] •━━╮
┃ 
┃ ➯ Auto-Downloader
┃    ↳ Kirim link TikTok/IG, ntar langsung gue sedot
┃ ➯ !yt [link] [resolusi]
┃    ↳ Colong video/audio YouTube
┃ ➯ !tt [link]
┃    ↳ Sedot TikTok (Tanpa Watermark njir)
┃ ➯ !ig [link]
┃    ↳ Sedot konten IG
┃ ➯ !fb [link]
┃    ↳ Sedot video FB (kalo masih ada yg pake)
┃ ➯ !tw / !x [link]
┃    ↳ Sedot video Twitter/X
┃ ➯ !pin [kata kunci]
┃    ↳ Nyari asupan Pinterest (dikirim ke DM/Japri)
╰━━━━━━━━━━━━━━━━━━━╯`;
  }
  if (kategori === "spotify") {
    return `╭━━• [ 🎵 *ANAK INDIE (SPOTIFY)* ] •━━╮
┃ 
┃ ➯ !spotifyplay [judul lagu]
┃    ↳ Langsung sedot MP3 lagu kesukaan lu
┃      (Contoh: !spplay Payung Teduh)
┃ 
┃ ➯ !spotifysearch [judul]
┃    ↳ Nyari list lagu di Spotify
┃      (Contoh: !spotifys Hindia)
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
  }

  if (kategori === "voice") {
    return `╭━━• [ 🎙️ *EDIT SUARA VN* ] •━━╮
┃ 
┃ ➯ !bass
┃    ↳ Suara bass jebol
┃ ➯ !chipmunk / !tupai
┃    ↳ Suara kejepit pintu (tupai)
┃ ➯ !robot
┃    ↳ Suara kaleng rombeng (robot)
┃ ➯ !slow
┃    ↳ Efek lelet banget
┃ ➯ !fast
┃    ↳ Efek ngebut
┃ ➯ !echo
┃    ↳ Suara mantul-mantul
┃ ➯ !reverb
┃    ↳ Suara konser di kamar mandi
┃ ➯ !nightcore
┃    ↳ Suara wibu (cepet + tinggi)
┃ ➯ !reverse
┃    ↳ Suara mundur (manggil setan)
┃ ➯ !vibrato
┃    ↳ Suara getar-getar kedinginan
┃ ➯ !dalek
┃    ↳ Suara monster aneh
┃ 
┃ 📌 *Cara pakenya bambang:*
┃ Reply/balas sebuah Voice Note (VN) pake 
┃ salah satu command di atas.
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
  }
  
  if (kategori === "dev") {
    return `╭━━• [ 💻 *INFO DEVELOPER* ] •━━╮
┃ 
┣━━ [ 🌐 WEBSITE ]
┃ ➯ https://jack-scanner.biz.id (Nunggu Confirmasi dari PANDI)
┃ ➯ https://fxcomunity.vercel.app/
┃ 
┣━━ [ 📞 NOMOR DEVELOPER ]
┃ ➯ https://wa.me/62895404147521
┃ ➯ https://wa.me/6289531526042
╰━━━━━━━━━━━━━━━━━━━╯`;
  }

  return `🤖 *JackBOT*\n\nKetik !menu buat liat daftar isi bossku.`;
}

// Jalankan bot
startBot().catch(console.error);

// PATCH: inject limitSystem after economy line

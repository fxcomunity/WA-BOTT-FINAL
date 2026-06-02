// ============================================
// index.js — JackBOT v3.0.0
// WhatsApp Group Bot pake Baileys
// ============================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage, jidNormalizedUser, generateWAMessageFromContent, prepareWAMessageMedia } = require("atexovi-baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require('fs');
const config = require("./config");

// Global exception/rejection handlers to prevent process crashes on unexpected errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

function validateConfig() {
  if (config.features.aiChatbot && !config.hasValidApiKeys()) {
    console.warn("⚠️ [CONFIG] aiChatbot dinonaktifkan — tidak ada API key valid di .env");
    console.warn("   Isi GEMINI_API_KEY / OPENAI_API_KEY / DEEPSEEK_API_KEY / MISTRAL_API_KEY di file .env");
    config.features.aiChatbot = false;
  } else if (config.features.aiChatbot) {
    const active = Object.entries(config.apiKeys).filter(([, v]) => v).map(([k]) => k);
    console.log(`✅ [CONFIG] AI chatbot aktif — provider: ${active.join(", ")}`);
  }
}
validateConfig();

const messageCache = new Map();
const processedMessages = new Set();

// Import semua fitur
const antiSpam    = require("./features/antiSpam");
const moderation  = require("./features/moderation");
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
const plugins     = require("./features/plugins");
const osint       = require("./features/osint");

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
        const normSender = jidNormalizedUser(sender);
        if (admins.includes(normSender)) return true;
        
        // Cek jika sender adalah bot (bisa phone number atau LID)
        const isBot = normSender === jidNormalizedUser(sock.user.id) || (sock.user.lid && normSender === jidNormalizedUser(sock.user.lid));
        if (isBot) {
            const botIds = [
                jidNormalizedUser(sock.user.id),
                sock.user.lid ? jidNormalizedUser(sock.user.lid) : null
            ].filter(Boolean);
            return admins.some(adminJid => botIds.includes(adminJid));
        }
        return false;
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

const sendInteractiveMessage = async (sock, jid, text, footer, buttons, quotedMsg = null, imagePath = null) => {
  try {
    let headerParams = { title: "", hasMediaAttachment: false };
    
    if (imagePath && fs.existsSync(imagePath)) {
      const mediaMsg = await prepareWAMessageMedia({ image: fs.readFileSync(imagePath) }, { upload: sock.waUploadToServer });
      headerParams = {
        title: "",
        hasMediaAttachment: true,
        imageMessage: mediaMsg.imageMessage
      };
    }

    const messageContent = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: {
            body: { text },
            footer: { text: footer || "" },
            header: headerParams,
            nativeFlowMessage: {
              buttons: buttons.map(b => ({
                name: b.name || "quick_reply",
                buttonParamsJson: JSON.stringify(b.params || {})
              }))
            }
          }
        }
      }
    };
    const msgObj = generateWAMessageFromContent(jid, messageContent, { quoted: quotedMsg });
    await sock.relayMessage(jid, msgObj.message, { messageId: msgObj.key.id });
  } catch (e) {
    console.error("Error sending interactive message:", e);
    await sock.sendMessage(jid, { text: text }, { quoted: quotedMsg });
  }
};

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
  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      require("qrcode-terminal").generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Koneksi terputus. Reconnect:", shouldReconnect);
      if (shouldReconnect) setTimeout(() => startBot(), 5000);
    } else if (connection === "open") {
      console.log("✅ JackBOT berhasil terhubung!");
      scheduler.start(sock);

      // Auto unfollow semua newsletter
      try {
        if (sock.getNewsletters && sock.unsubscribeNewsletter) {
          const newsletters = await sock.getNewsletters();
          if (newsletters && newsletters.length > 0) {
            for (const nl of newsletters) {
              await sock.unsubscribeNewsletter(nl.id);
              console.log("✅ Unfollowed newsletter:", nl.id);
            }
          }
        }
      } catch (e) {
        console.log("ℹ️ Gagal atau tidak support unfollow newsletter otomatis.");
      }
    }
  });

  // ============================================
  // MEMBER JOIN / LEAVE
  // ============================================
  sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
    groupAdminsCache.delete(id);
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
      // Path 1: nativeFlowResponseMessage (Baileys / WA terbaru)
      const nfr = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage;
      if (nfr?.paramsJson) {
        const params = JSON.parse(nfr.paramsJson);
        if (params.id) nativeFlowId = params.id;
      }
      // Path 2: listResponseMessage (list reply)
      const lr = msg.message?.listResponseMessage;
      if (!nativeFlowId && lr?.singleSelectReply?.selectedRowId) {
        nativeFlowId = lr.singleSelectReply.selectedRowId;
      }
      // Path 3: templateButtonReplyMessage
      const tbr = msg.message?.templateButtonReplyMessage;
      if (!nativeFlowId && tbr?.selectedId) {
        nativeFlowId = tbr.selectedId;
      }
    } catch(e) { console.log("[DEBUG] Error parsing button response:", e.message); }

    const body = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
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

    const isMenuFallback = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].includes(body);
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
        "self", "on", "public", "lock", "unlock", "shutdown", "pengumuman", "setowner", "add", "warn", "kick", "mute", "unmute", "del", "delete", "resetwarn", "warnlist", "tagall", "slowmode", "poll", "endpoll", "help", "menu", "afk", "sticker", "s", "brat", "info", "status", "daily", "saldo", "transfer", "shop", "beli", "serang", "lari", "potion", "skills", "belajar", "skill", "levelup", "upgrade", "leaderboard", "lb", "gacha", "mancing", "berburu", "nambang", "inv", "inventory", "sell", "use", "pakai", "cekbot", "promote", "demote", "kickall", "setname", "setdesc", "setpp", "igstalk", "ttstalk", "ghstalk", "tutor", "kuis", "tebak", "jawab", "stats", "mystats", "topaktif", "ping", "quotes", "fakta", "apakah", "bisakah", "kapankah", "rate", "jodoh", "cekkhodam", "toimg", "tr", "translate", "menfess", "imagine", "tts", "jadwalsholat", "cuaca", "kurs", "qr", "spotifyplay", "spplay", "spotifysearch", "spotifys", "sps", "remind", "yt", "tt", "ig", "pin", "gambar", "pinterest", "fb", "tw", "x", "limit", "ceklimit", "rvo", "sw", "limitall", "resetlimit", "setlimit", "sc", "data", "meigen",
        ...audioEffects.effectsList
      ];

      if (validCommands.includes(possibleCmd)) {
        isCmd = true;
        cmd = possibleCmd;
      }
    }

    // Untuk fallback angka dan tombol balasan (list reply / interactive button)
    const isButtonReply = !!(msg.message?.buttonsResponseMessage || msg.message?.listResponseMessage || msg.message?.templateButtonReplyMessage || nativeFlowId);
    if (isMenuFallback || isButtonReply) {
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
    // Super Owner — hanya pemilik terdaftar di config.owners yang bisa !self / !public
    const isSuperOwner = ownerCheck;

    // MODE SELF: Abaikan semua command jika bukan dari owner
    if (isSelfMode && !ownerCheck && isCmd) {
      return;
    }

    // Cek otorisasi grup resmi
    if (isCmd && !ownerCheck) {
      const allowedGroups = config.allowedGroups || [];
      let isAuthorized = false;
      
      if (isGroup) {
        if (allowedGroups.includes(groupId)) {
          isAuthorized = true;
        }
      } else {
        // DM/Private Chat: Cek apakah user adalah anggota salah satu grup resmi
        for (const groupJid of allowedGroups) {
          try {
            const metadata = await getGroupMetadata(sock, groupJid);
            if (metadata && metadata.participants) {
              const found = metadata.participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender));
              if (found) {
                isAuthorized = true;
                break;
              }
            }
          } catch (e) {
            console.error(`[AUTH] Gagal mengecek keanggotaan grup ${groupJid}:`, e.message);
          }
        }
      }
      
      if (!isAuthorized && allowedGroups.length > 0) {
        return reply(sock, msg, "⚠️ *AKSES DITOLAK* ⚠️\n\nMaaf ngab, bot ini hanya dapat digunakan oleh anggota grup resmi JackBOT.\n\nSilakan bergabung ke grup resmi terlebih dahulu!");
      }
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
    // ANTI LINK — promo/invite = kick langsung, sosial/lain = warn dulu
    // Admin grup & owner bot dikecualikan (bebas kirim link apapun)
    // ============================================
    let adminNumbers = [];
    if (isGroup) {
      try {
        const groupAdmins = await getGroupAdmins(sock, groupId);
        adminNumbers = groupAdmins.map(jid => jid.split("@")[0]);
      } catch (e) {
        console.error("Gagal mengambil list admin untuk whitelist nomor:", e);
      }
    }

    let shouldCheckLink = !isCmd;
    if (isCmd) {
      const downloaderMap = {
        yt: [/youtube\.com/i, /youtu\.be/i],
        tt: [/tiktok\.com/i, /douyin\.com/i],
        ig: [/instagram\.com/i, /instagr\.am/i],
        fb: [/facebook\.com/i, /fb\.watch/i, /fb\.com/i],
        tw: [/twitter\.com/i, /x\.com/i],
        x: [/twitter\.com/i, /x\.com/i],
        spotifyplay: [/spotify\.com/i],
        spplay: [/spotify\.com/i],
        spotifysearch: [/spotify\.com/i],
        spotifys: [/spotify\.com/i],
        sps: [/spotify\.com/i],
        pinterest: [/pinterest\.com/i, /pin\.it/i],
        gambar: [/pinterest\.com/i, /pin\.it/i],
        pin: [/pinterest\.com/i, /pin\.it/i]
      };

      const violation = moderation.analyzeViolation(body, adminNumbers);
      if (violation.action !== "none") {
        if (["tanya", "translate", "tr", "qr", "menfess"].includes(cmd)) {
          if (violation.action === "kick") {
            shouldCheckLink = true;
          }
        } else {
          const allowedPatterns = downloaderMap[cmd];
          if (allowedPatterns) {
            const { extractLinks } = require("./features/antiLink");
            const links = extractLinks(body);
            const hasInvalidLink = links.some(link => !allowedPatterns.some(pattern => pattern.test(link)));
            if (hasInvalidLink) {
              shouldCheckLink = true;
            }
          } else {
            shouldCheckLink = true;
          }
        }
      }
    }

    if (isGroup && config.features.antiLink && !adminCheck && !ownerCheck && shouldCheckLink) {
      const violation = moderation.analyzeViolation(body, adminNumbers);
      if (violation.action !== "none") {
        try {
          const botId = jidNormalizedUser(sock.user.id);
          const botIsAdmin = await isAdmin(sock, groupId, botId);

          if (botIsAdmin) {
            await sock.sendMessage(groupId, { delete: msg.key }).catch(e => console.log("Gagal bos hapus pesan link:", e));

            if (violation.action === "kick") {
              await moderation.handlePromoKick(sock, groupId, sender, violation.reason);
            } else {
              await moderation.handleLinkViolation(sock, groupId, sender, violation.reason);
            }
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

    // --- GLOBAL COOLDOWN SYSTEM UNTUK SEMUA FITUR (30 DETIK PER USER) ---
    // Navigasi menu (btn_ prefix, list reply, angka menu) dikecualikan dari cooldown
    const isMenuNavigation = isButtonReply || isMenuFallback || cmd?.startsWith("btn_") || ["menu", "help"].includes(cmd);
    if (!ownerCheck && !isMenuNavigation) {
      if (!global.cmdCooldown) global.cmdCooldown = {};
      const now = Date.now();
      if (global.cmdCooldown[sender] && now - global.cmdCooldown[sender] < 30000) {
        const sisaWaktu = Math.ceil((30000 - (now - global.cmdCooldown[sender])) / 1000);
        return reply(sock, msg, `⏳ Sabar ngab! Tunggu *${sisaWaktu} detik* lagi buat pake fitur bot.`);
      }
      global.cmdCooldown[sender] = now;
    }

    // Otomatis berikan reaksi 🕒 saat sebuah command tereksekusi
    await sock.sendMessage(groupId, { react: { text: "🕒", key: msg.key } });

    switch (cmd) {

      // ---------- SUPER OWNER ONLY (khusus +62895404147521) ----------
      case "self":
        if (!isSuperOwner) return reply(sock, msg, "❌ Command ini khusus Presiden Utama (+62895404147521) doang!");
        isSelfMode = true;
        saveSettings();
        await reply(sock, msg, "🔇 *Mode SELF Aktif!*\nBot sekarang cuma akan merespon perintah dari Owner. (Tersimpan permanen)");
        break;

      case "on":
      case "public":
        if (!isSuperOwner) return reply(sock, msg, "❌ Command ini khusus Presiden Utama (+62895404147521) doang!");
        isSelfMode = false;
        saveSettings();
        await reply(sock, msg, "🔊 *Mode PUBLIC Aktif!*\nBot sekarang kembali melayani semua member grup. (Tersimpan permanen)");
        break;

      case "lock":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Yeee lu bukan mentri, gabisa ngunci grup bos!");
        const resLock = await lockGroup.lock(sock, groupId);
        await reply(sock, msg, resLock);
        break;

      case "unlock":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Yeee lu bukan mentri, gabisa buka grup bos!");
        const resUnlock = await lockGroup.unlock(sock, groupId, args[0]);
        await reply(sock, msg, resUnlock);
        break;

      case "shutdown":
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma Presiden!");
        await reply(sock, msg, "👋 Bot dimatikan. Sampai jumpa!");
        process.exit(0);

      case "pengumuman":
        if (!ownerCheck) {
          return reply(sock, msg, "❌ Cuma Presiden (owner) yang bisa memakai command ini!");
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
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma Presiden!");
        // Tambah owner baru sementara (runtime only)
        const newOwner = args[0]?.replace(/[^0-9]/g, "");
        if (newOwner) config.owners.push(newOwner);
        await reply(sock, msg, `✅ ${newOwner} ditambah sebagai owner sementara.`);
        break;

      // ---------- ADMIN & OWNER ----------
      case "add":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
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
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await warnSystem.warn(sock, msg, groupId, sender, args);
        break;

      case "kick":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
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
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
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
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        const unmuteTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (unmuteTarget) {
          antiSpam.unmute(unmuteTarget);
          await reply(sock, msg, `🔊 ${unmuteTarget.split("@")[0]} di-unmute.`);
        }
        break;

      case "del":
      case "delete":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
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
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        const resetTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (resetTarget) {

          await warnSystem.resetWarn(resetTarget);
          await reply(sock, msg, `✅ Warn ${resetTarget.split("@")[0]} direset.`);
        }
        break;

      case "warnlist":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await reply(sock, msg, await warnSystem.getWarnList());
        break;

      case "tagall":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        const meta = await sock.groupMetadata(groupId);
        const mentions = meta.participants.map(p => p.id);
        const tagText = args.join(" ") || "📢 Perhatian semua member!";
        const mentionStr = mentions.map(m => `@${m.split("@")[0]}`).join(" ");
        await sock.sendMessage(groupId, { text: `${tagText}\n\n${mentionStr}`, mentions });
        break;

      case "slowmode":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        const delay = parseInt(args[0]) || 30;
        antiSpam.setSlowMode(delay);
        await reply(sock, msg, `⏱️ Slow mode aktif: ${delay} detik antar pesan.`);
        break;

      case "poll":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await games.createPoll(sock, groupId, args);
        break;

      case "endpoll":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await games.endPoll(sock, groupId, msg);
        break;

      // ---------- SEMUA MEMBER ----------
      case "help":
      case "menu": {
        const categoryInput = args[0]?.toLowerCase();
        if (categoryInput) {
          if (["1", "owner", "presiden"].includes(categoryInput)) {
            if (!ownerCheck) return reply(sock, msg, "❌ Cuma Presiden yang bisa liat detail menu ini!");
            const txt = getHelpText(ownerCheck, adminCheck, "owner") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["2", "admin", "mentri"].includes(categoryInput)) {
            if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Cuma Mentri yg bisa liat ini bos!");
            const txt = getHelpText(ownerCheck, adminCheck, "admin") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["3", "member", "rakyat"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "member") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["4", "rpg", "economy"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "rpg") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt });
          }
          if (["5", "game", "hiburan"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "game") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt });
          }
          if (["6", "downloader", "download"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "downloader") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["7", "dev", "developer", "info"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "dev") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["8", "spotify", "music"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "spotify") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["9", "voice", "audio"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "voice") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["10", "osint", "tracking"].includes(categoryInput)) {
            const txt = getHelpText(ownerCheck, adminCheck, "osint") + "\n\n_Ketik *!menu* untuk kembali._";
            return sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
          }
          if (["11", "plugin", "plugins"].includes(categoryInput)) {
            return plugins.listPlugins(sock, msg);
          }
        }

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

        const helpMsg = `*✦ ──『 🤖 JACKBOT V3.0 』── ✦*

👋 Yow kak *${name}*, ${ucapan}!
🔥 Met nongkrong bareng asisten ter-OP se-WA.

┌──❖ *T O D A Y*
│ 📆 Date : ${strHariTanggal}
│ 🕒 Time : ${strJam}
│ 🤖 Mode : ${isSelfMode ? 'Self (!public)' : 'Public (!self)'}
└───────────────┈ ⳹

┌──❖ *C O M M U N I T Y*
│ ➯ github.com/fxcomunity
└───────────────┈ ⳹

👇 *Silakan klik tombol di bawah untuk membuka menu:* 👇`;

        const rows = [];
        if (ownerCheck) {
          rows.push({ header: "", title: "Menu Khusus Presiden", description: "Perintah khusus presiden bot", id: "btn_owner" });
        }
        rows.push(
          { header: "", title: "Menu Mentri Grup", description: "Perintah khusus mentri grup", id: "btn_admin" },
          { header: "", title: "Menu Rakyat Utama", description: "Perintah umum untuk semua rakyat", id: "btn_member" },
          { header: "", title: "Menu Economy RPG", description: "Mancing, Nambang, Combat & Skills", id: "btn_rpg" },
          { header: "", title: "Menu Game & Hiburan", description: "Game interaktif & tebak-tebakan", id: "btn_game" },
          { header: "", title: "Menu Downloader", description: "Download TikTok, IG, YT, dll", id: "btn_downloader" },
          { header: "", title: "Spotify Music", description: "Download lagu dari Spotify", id: "btn_spotify" },
          { header: "", title: "Voice Changer", description: "Ubah suara VN jadi lucu", id: "btn_voice" },
          { header: "", title: "Menu OSINT & Track", description: "Lacak nomor & informasi", id: "btn_osint" },
          { header: "", title: "Daftar Plugin", description: "Fitur plugin tambahan", id: "btn_plugin" }
        );

        const buttons = [
          {
            name: "single_select",
            params: {
              title: "Pilih Kategori",
              sections: [{ title: "Kategori Menu", highlight_label: "Pilihan", rows }]
            }
          }
        ];

        await sendInteractiveMessage(sock, msg.key.remoteJid, helpMsg, "JackBOT v3.0.0", buttons, msg, "./assets/public/menu.jpg");
        break;
      }

      case "1":
      case "btn_owner":
      case "menu_1": {
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma Presiden yang bisa liat detail menu ini!");
        const txt = getHelpText(ownerCheck, adminCheck, "owner") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "2":
      case "btn_admin":
      case "menu_2": {
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Cuma Mentri yg bisa liat ini bos!");
        const txt = getHelpText(ownerCheck, adminCheck, "admin") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "3":
      case "btn_member":
      case "menu_3": {
        const txt = getHelpText(ownerCheck, adminCheck, "member") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "4":
      case "btn_rpg":
      case "menu_4": {
        const txt = getHelpText(ownerCheck, adminCheck, "rpg") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt });
        break;
      }

      case "5":
      case "btn_game":
      case "menu_5": {
        const txt = getHelpText(ownerCheck, adminCheck, "game") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt });
        break;
      }

      case "6":
      case "btn_downloader":
      case "menu_6": {
        const txt = getHelpText(ownerCheck, adminCheck, "downloader") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "7":
      case "btn_dev":
      case "menu_7": {
        const txt = getHelpText(ownerCheck, adminCheck, "dev") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "8":
      case "btn_spotify":
      case "menu_8": {
        const txt = getHelpText(ownerCheck, adminCheck, "spotify") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "9":
      case "btn_voice":
      case "menu_9": {
        const txt = getHelpText(ownerCheck, adminCheck, "voice") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "10":
      case "btn_osint":
      case "menu_10": {
        const txt = getHelpText(ownerCheck, adminCheck, "osint") + "\n\n_Ketik *!menu* untuk kembali._";
        await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: msg });
        break;
      }

      case "11":
      case "btn_plugin":
      case "menu_11": {
        await plugins.listPlugins(sock, msg);
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
           const monster = rpgData.findMonster(query) || rpgData.monsters.find(m => m.name.toLowerCase().includes(query));
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
              const monster = rpgData.findMonster(w.combat.monsterId);
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
        const stWarns = await warnSystem.getWarn(stTarget);
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
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        if (!ownerCheck) return reply(sock, msg, "⚠️ Fitur super berbahaya ini dibatasi cuma untuk Owner bot!"); // Biar aman
        await admin.kickall(sock, msg, groupId, sender);
        break;

      case "setname":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await admin.setName(sock, msg, groupId, args.join(" "));
        break;

      case "setdesc":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await admin.setDesc(sock, msg, groupId, args.join(" "));
        break;

      case "setpp":
        if (!isGroup) return reply(sock, msg, "❌ Fitur ini cuma untuk Grup.");
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
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

      case "sc":
        await osint.searchUsername(sock, msg, args[0]);
        break;

      case "data":
        await osint.checkBreach(sock, msg, args[0]);
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

        const ownerNum = config.owners[0];
        const botNum = sock.user.id.split(':')[0];
        const text = `🚀 *SYSTEM STATUS & BOT INFO* 🚀\n\n` +
                     `🏓 *PONG!*\n` +
                     `⚡ *Kecepatan Respon:* ${pingEnd - pingStart} ms\n` +
                     `⏱️ *Uptime Bot:* ${uptimeStr}\n` +
                     `💾 *RAM:* ${usedRAM} MB / ${totalRAM} MB\n\n` +
                     `🤖 *INFORMASI BOT* 🤖\n` +
                     `┃ 🏷️ *Nama BOT:* JackBOT\n` +
                     `┃ 📦 *Version:* v3.0.0\n` +
                     `┃ 🌐 *Hosting BOT:* https://yurahostingg.my.id\n` +
                     `┃ 👑 *Nomor Owner:* @${ownerNum.split("@")[0]}\n` +
                     `┃ 📱 *Nomor BOT:* @${botNum.split("@")[0]}\n` +
                     `┃ 📡 *DNS:* 8.8.8.8 (Google Primary) | 8.8.4.4 (Google Secondary) | 1.1.1.1 (Cloudflare)`;

        await sock.sendMessage(groupId, { 
          text: text, 
          mentions: [ownerNum + "@s.whatsapp.net", botNum + "@s.whatsapp.net"] 
        }, { quoted: msg });
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
        await utils.generateImage(sock, msg, args.join(" "));
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
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma Presiden yang bisa pake fitur ini!");
        try {
          const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          if (!quotedMsg) {
            return reply(sock, msg, "❌ Balas pesan View Once (Sekali Lihat) dengan command !rvo");
          }
          
          let tempMsg = quotedMsg;
          let isViewOnce = false;
          while (tempMsg) {
            if (tempMsg.viewOnceMessage || tempMsg.viewOnceMessageV2 || tempMsg.viewOnceMessageV2Extension) {
              isViewOnce = true;
            }
            if (tempMsg.ephemeralMessage?.message) {
              tempMsg = tempMsg.ephemeralMessage.message;
            } else if (tempMsg.viewOnceMessage?.message) {
              tempMsg = tempMsg.viewOnceMessage.message;
            } else if (tempMsg.viewOnceMessageV2?.message) {
              tempMsg = tempMsg.viewOnceMessageV2.message;
            } else if (tempMsg.viewOnceMessageV2Extension?.message) {
              tempMsg = tempMsg.viewOnceMessageV2Extension.message;
            } else if (tempMsg.documentWithCaptionMessage?.message) {
              tempMsg = tempMsg.documentWithCaptionMessage.message;
            } else {
              break;
            }
          }
          
          let mediaType = Object.keys(tempMsg || {}).find(k => k === 'imageMessage' || k === 'videoMessage' || k === 'audioMessage');
          if (mediaType && tempMsg[mediaType]?.viewOnce) {
            isViewOnce = true;
          }
          
          if (!isViewOnce || !mediaType) {
            return reply(sock, msg, "❌ Balas pesan View Once (Sekali Lihat) dengan command !rvo");
          }
          
          await reply(sock, msg, "🔓 Membuka pesan rahasia...");
          
          const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant || msg.key.remoteJid;
          const fakeMsg = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: quotedParticipant
            },
            message: tempMsg
          };
          
          const buffer = await downloadMediaMessage(
            fakeMsg,
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          
          const caption = tempMsg[mediaType]?.caption || "";
          
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
        if (!ownerCheck) return reply(sock, msg, "❌ Cuma Presiden yang bisa pake fitur ini!");
        try {
          const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          
          let tempMsg = quotedMsg;
          while (tempMsg) {
            if (tempMsg.ephemeralMessage?.message) {
              tempMsg = tempMsg.ephemeralMessage.message;
            } else if (tempMsg.documentWithCaptionMessage?.message) {
              tempMsg = tempMsg.documentWithCaptionMessage.message;
            } else {
              break;
            }
          }
          
          if (!tempMsg || (!tempMsg.imageMessage && !tempMsg.videoMessage && !tempMsg.extendedTextMessage)) {
            return reply(sock, msg, "❌ Balas status WA (foto/video/teks) dengan command !sw");
          }

          const isImage = tempMsg.imageMessage;
          const isVideo = tempMsg.videoMessage;
          const isText = tempMsg.extendedTextMessage;
          
          const caption = isImage?.caption || isVideo?.caption || isText?.text || "";
          
          if (isImage || isVideo) {
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant || msg.key.remoteJid;
            const fakeMsg = {
              key: {
                remoteJid: msg.key.remoteJid,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: quotedParticipant
              },
              message: tempMsg
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
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        await limitSystem.showAllLimits(sock, msg);
        break;

      case "resetlimit":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
        const rlTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (rlTarget) {
          limitSystem.resetLimit(rlTarget);
          await reply(sock, msg, `✅ Limit @${rlTarget.split("@")[0]} berhasil direset!`);
        }
        break;

      case "setlimit":
        if (!adminCheck && !ownerCheck) return reply(sock, msg, "❌ Lu bukan mentri grup cuy, diem aja!");
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

      case "plugins":
        await plugins.listPlugins(sock, msg);
        break;

      case "fakeff":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await plugins.fakeff(sock, msg, args.join(" "));
        break;

      case "kompres":
      case "kompress":
      case "compress":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await plugins.kompres(sock, msg);
        break;

      case "hd":
      case "remini":
      case "enhancer":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await plugins.enhancer(sock, msg);
        break;

      case "meigen":
        if (!limitSystem.cek(sender, "download")) return reply(sock, msg, "❌ Limit kamu habis hari ini ngab!");
        await plugins.meigen(sock, msg, args.join(" "));
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
    let text = `*✦ ──『 🛡️ MENU MENTRI 』── ✦*

┌──❖ *M O D E R A S I*
│ ⚡ *!add* [nomor]
│    ↳ Tarik nyawa baru ke grup
│ ⚡ *!kick* @user
│    ↳ Tendang beban grup
│ ⚡ *!warn* @user
│    ↳ SP1 buat rakyat bandel
│ ⚡ *!mute* @user [mnt]
│    ↳ Bikin rakyat kicep/bisu
│ ⚡ *!unmute* @user
│    ↳ Buka segel bisu
│ ⚡ *!del*
│    ↳ Hapus chat ampas (reply)
│ ⚡ *!resetwarn* @user
│    ↳ Ampunin 1 dosa rakyat
│ ⚡ *!warnlist*
│    ↳ List orang-orang bandel
│ ⚡ *!lock*
│    ↳ Gembok grup
│ ⚡ *!unlock* [jam]
│    ↳ Buka gembok grup (Contoh: 06.00)
│ ⚡ *!tagall* [pesan]
│    ↳ Bangunin semua orang
│ ⚡ *!slowmode* [detik]
│    ↳ Bikin ngetik jadi lelet
│ ⚡ *!poll* "tanya" op1|op2
│    ↳ Bikin voting
│ ⚡ *!endpoll*
│    ↳ Kelarin voting
└───────────────┈ ⳹

┌──❖ *O V E R P O W E R*
│ ⚡ *!setname* [teks]
│    ↳ Ubah nama grup
│ ⚡ *!setdesc* [teks]
│    ↳ Ubah deskripsi grup
│ ⚡ *!setpp*
│    ↳ Ganti foto profil grup (reply)
└───────────────┈ ⳹`;
    return text;
  }

  if (kategori === "owner") {
    if (!isOwner) return "❌ Dih sapa lu? Cuma Presiden yg bisa pake ini!";
    return `*✦ ──『 👑 MENU PRESIDEN 』── ✦*

┌──❖ *O V E R R I D E*
│ ⚡ *!lock* [durasi]
│    ↳ Gembok grup
│ ⚡ *!unlock*
│    ↳ Buka gembok grup
│ ⚡ *!shutdown*
│    ↳ Matiin bot paksa njir
│ ⚡ *!setowner* @user
│    ↳ Tambah bekingan presiden
│ ⚡ *!limitall*
│    ↳ Cek sisa limit semua user
│ ⚡ *!resetlimit* @user
│    ↳ Reset limit miskiner
│ ⚡ *!setlimit* @user [jenis]
│    ↳ Seting limit sesuka hati
│ ⚡ *!sw*
│    ↳ Nyolong Status WA
│ ⚡ *!rvo*
│    ↳ Buka rahasia View Once
│ ⚡ *!promote* [@tag]
│    ↳ Angkat derajat jadi mentri
│ ⚡ *!demote* [@tag]
│    ↳ Turunin pangkat mentri jadi jongos
│ ⚡ *!kickall*
│    ↳ ⚠️ Kiamat grup (Kick semua)
└───────────────┈ ⳹`;
  }
  
  if (kategori === "member") {
    return `*✦ ──『 👤 MENU RAKYAT 』── ✦*

┌──❖ *U T I L I T Y*
│ ⚡ *!status* [@user]
│    ↳ Cek profil & KTP lu
│ ⚡ *!s / !sticker*
│    ↳ Bikin stiker keren
│ ⚡ *!brat* [teks]
│    ↳ Bikin stiker gaya album BRAT
│ ⚡ *!afk* [alasan]
│    ↳ Pasang status sibuk/molor
│ ⚡ *bot, [tanya]*
│    ↳ Ngobrol random sama AI (gue)
└───────────────┈ ⳹

┌──❖ *E C O N O M Y*
│ ⚡ *!limit*
│    ↳ Cek sisa limit lu (awas abis)
│ ⚡ *!daily*
│    ↳ Klaim jatah preman harian
│ ⚡ *!saldo*
│    ↳ Cek duit & level lu
│ ⚡ *!transfer* @user jml
│    ↳ Sedekah koin ke temen
│ ⚡ *!shop*
│    ↳ Buka pasar malem (toko)
│ ⚡ *!leaderboard*
│    ↳ Liat siapa yg paling kaya
│ ⚡ *!tutor*
│    ↳ Baca panduan, biar ga nanya mulu
└───────────────┈ ⳹

┌──❖ *S T A T S*
│ ⚡ *!stats*
│    ↳ Lihat ringkasan data grup
│ ⚡ *!mystats*
│    ↳ Liat ringkasan dosa lu
│ ⚡ *!topaktif*
│    ↳ Daftar orang paling bacot di grup
└───────────────┈ ⳹

┌──❖ *S T A L K E R*
│ ⚡ *!imagine* [deskripsi]
│    ↳ Bikin gambar pake AI
│ ⚡ *!cuaca* [kota]
│    ↳ Cek pawang hujan daerah lu
│ ⚡ *!kurs* [uang]
│    ↳ Cek konversi duit
│ ⚡ *!qr* [teks]
│    ↳ Bikin barcode QR
│ ⚡ *!remind* [wkt] [pesan]
│    ↳ Alarm biar lu ga lupa
│ ⚡ *!igstalk* [username]
│    ↳ Intip IG orang diem-diem
│ ⚡ *!ttstalk* [username]
│    ↳ Kepoin TikTok orang
│ ⚡ *!ghstalk* [username]
│    ↳ Intip GitHub sepuh
└───────────────┈ ⳹`;
  }
  
  if (kategori === "game") {
    return `*✦ ──『 🎮 GAME & FUN 』── ✦*

┌──❖ *P E R M A I N A N*
│ ⚡ *!kuis*
│    ↳ Main tebak pengetahuan
│ ⚡ *!tebak*
│    ↳ Main tebak angka rahasia
│ ⚡ *!jawab* [angka]
│    ↳ Menjawab tebakan angka
└───────────────┈ ⳹

┌──❖ *H I B U R A N*
│ ⚡ *!cekkhodam* [nama]
│    ↳ Cek khodam pendampingmu
│ ⚡ *!jodoh* @user1 @user2
│    ↳ Cek kecocokan jodoh
│ ⚡ *!ping*
│    ↳ Cek kecepatan respon bot
│ ⚡ *!quotes*
│    ↳ Minta kata mutiara/motivasi
│ ⚡ *!fakta*
│    ↳ Baca fakta unik dunia
│ ⚡ *!apakah* [tanya]
│    ↳ Ramalan jawaban Ya/Tidak
│ ⚡ *!bisakah* [tanya]
│    ↳ Prediksi Bisa/Tidak
│ ⚡ *!kapankah* [tanya]
│    ↳ Prediksi waktu kejadian
│ ⚡ *!rate* [nama]
│    ↳ Cek persentase skor
└───────────────┈ ⳹`;
  }
  if (kategori === "rpg") {
    return `*✦ ──『 ⚔️ ECONOMY & RPG 』── ✦*

┌──❖ *G R I N D I N G*
│ ⚡ *!nambang*
│    ↳ Mulung batu & material 
│ ⚡ *!mancing*
│    ↳ Mancing mania mantap
│ ⚡ *!berburu*
│    ↳ Berburu hewan di utan
└───────────────┈ ⳹

┌──❖ *I N V E N T O R Y*
│ ⚡ *!inv / !inventory*
│    ↳ Ngintip isi tas & status darah
│ ⚡ *!saldo*
│    ↳ Liat harta & level lu
│ ⚡ *!shop*
│    ↳ Buka pasar malem
│ ⚡ *!beli* [id]
│    ↳ Check out barang / potion
│ ⚡ *!sell / !jual* [item] [jml]
│    ↳ Ngejual rongsokan hasil mulung
│ ⚡ *!pakai* [nama_item]
│    ↳ Nenggak potion / pake item
└───────────────┈ ⳹

┌──❖ *M A G I C  S K I L L S*
│ ⚡ *!skills*
│    ↳ Liat daftar skill sihir
│ ⚡ *!belajar* [nama_skill]
│    ↳ Belajar jurus baru (modal dikit)
│ ⚡ *!levelup* [nama_skill]
│    ↳ Upgrade skill biar makin gacor
│ ⚡ *!skill* [nama_skill]
│    ↳ Pamer ngeluarin jurus
└───────────────┈ ⳹

┌──❖ *C O M B A T*
│ ⚡ *!serang*
│    ↳ Gebuk monster pas nambang
│ ⚡ *!potion*
│    ↳ Minum ramuan pas sekarat
│ ⚡ *!lari*
│    ↳ Kabur njir daripada mati
│ ⚡ *!info* rpg
│    ↳ 📖 Baca panduan lengkap buat noob
│ ⚡ *!info* [nama_monster]
│    ↳ Kepoin stat & drop monster
└───────────────┈ ⳹`;
  }
  
  if (kategori === "downloader") {
    return `*✦ ──『 📥 TUKANG SEDOT 』── ✦*

┌──❖ *D O W N L O A D E R*
│ ⚡ *Auto-Downloader*
│    ↳ Kirim link TikTok/IG, otomatis sedot!
│ ⚡ *!yt* [link] [resolusi]
│    ↳ Colong video/audio YouTube
│ ⚡ *!tt* [link]
│    ↳ Sedot TikTok (Tanpa Watermark)
│ ⚡ *!ig* [link]
│    ↳ Sedot konten IG
│ ⚡ *!fb* [link]
│    ↳ Sedot video FB
│ ⚡ *!tw / !x* [link]
│    ↳ Sedot video Twitter/X
│ ⚡ *!pin* [kata kunci]
│    ↳ Nyari asupan Pinterest (dikirim ke DM)
└───────────────┈ ⳹`;
  }
  if (kategori === "spotify") {
    return `*✦ ──『 🎵 ANAK INDIE (SPOTIFY) 』── ✦*

┌──❖ *M U S I C*
│ ⚡ *!spotifyplay* [judul]
│    ↳ Langsung sedot MP3 lagu kesukaan lu
│      (Contoh: !spplay Payung Teduh)
│ ⚡ *!spotifysearch* [judul]
│    ↳ Nyari list lagu di Spotify
│      (Contoh: !spotifys Hindia)
└───────────────┈ ⳹`;
  }

  if (kategori === "voice") {
    return `*✦ ──『 🎙️ EDIT SUARA VN 』── ✦*

┌──❖ *E F E K  A U D I O*
│ ⚡ *!bass* (Suara bass jebol)
│ ⚡ *!chipmunk / !tupai* (Suara tupai)
│ ⚡ *!robot* (Suara kaleng rombeng)
│ ⚡ *!slow* (Efek lelet banget)
│ ⚡ *!fast* (Efek ngebut)
│ ⚡ *!echo* (Suara mantul-mantul)
│ ⚡ *!reverb* (Suara konser di kamar mandi)
│ ⚡ *!nightcore* (Suara wibu cepet)
│ ⚡ *!reverse* (Suara mundur)
│ ⚡ *!vibrato* (Suara getar kedinginan)
│ ⚡ *!dalek* (Suara monster aneh)
└───────────────┈ ⳹

📌 *Cara pakenya bambang:*
Reply/balas sebuah Voice Note (VN) pake 
salah satu command di atas.`;
  }
  
  if (kategori === "osint") {
    return `*✦ ──『 🕵️ OSINT TOOLS 』── ✦*

┌──❖ *T R A C K I N G*
│ ⚡ *!sc* [username]
│    ↳ Cek username di berbagai platform
│ ⚡ *!data* [email]
│    ↳ Cek kebocoran data (data breach)
└───────────────┈ ⳹`;
  }

  if (kategori === "dev") {
  const devLinks = config.devContact.map(n => `┃ ➯ https://wa.me/${n}`).join('\n');
  return `╭━━• [ 💻 *INFO DEVELOPER* ] •━━╮
┃ 
┣━━ [ 🌐 WEBSITE ]
┃ ➯ https://jack-scanner.biz.id (Nunggu Confirmasi dari PANDI)
┃ ➯ https://fxcomunity.vercel.app/
┃ 
┣━━ [ 📞 NOMOR DEVELOPER ]
${devLinks}
╰━━━━━━━━━━━━━━━━━━━╯`;
}

  return `🤖 *JackBOT*\n\nKetik !menu buat liat daftar isi bossku.`;
}

// Jalankan bot
startBot().catch(console.error);

// PATCH: inject limitSystem after economy line

// config.example.js – contoh konfigurasi tanpa data sensitif
// Salin file ini menjadi config.js dan isi dengan data Anda sendiri.

require('dotenv').config();

const PLACEHOLDER_KEY_PATTERNS = [
  /^API_KEY_/i,
  /^your_/i,
  /_LU$/i,
  /^REPLACE/i,
  /^xxx+$/i,
  /^dummy/i,
  /^paste_/i,
];

function isValidApiKey(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (trimmed.length < 10) return false;
  return !PLACEHOLDER_KEY_PATTERNS.some(p => p.test(trimmed));
}

function sanitizeApiKeys(raw) {
  const result = {};
  for (const [name, key] of Object.entries(raw)) {
    result[name] = isValidApiKey(key) ? key.trim() : null;
  }
  return result;
}

const apiKeys = sanitizeApiKeys({
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  mistral: process.env.MISTRAL_API_KEY,
});

function hasValidApiKeys() {
  return Object.values(apiKeys).some(Boolean);
}

module.exports = {
  owners: process.env.OWNER_NUMBERS
    ? process.env.OWNER_NUMBERS.split(',').map(n => n.trim())
    : [
        // Tambahkan nomor WA atau LID Anda di sini, misalnya "6281234567890"
      ],
  // Contact numbers for developer info
  devContact: process.env.DEV_CONTACTS
    ? process.env.DEV_CONTACTS.split(',').map(n => n.trim())
    : [
        // Tambahkan nomor WA developer
      ],

  // === PENGATURAN BOT ===
  prefix: "!",
  botName: "JackBOT",
  botVersion: "3.0.0",
  useInteractiveMenu: false, // Set to true if you want to use interactive buttons/dropdowns, but note it might not display on many WA clients.

  // === MODERASI ===
  maxWarn: 3,
  antiLinkMaxStrike: 3,
  floodLimit: 5,
  muteDuration: 10,
  slowModeDelay: 30,
  autoDeleteOldMsg: false,

  // === FITUR ON/OFF ===
  features: {
    antiSpam: true,
    antiLink: true,
    antiForward: true,
    antiInviteLink: true,
    antiFakeNumber: false,
    antiNSFW: false,
    antiKataKasar: false,
    antiMedia: false,
    welcome: true,
    goodbye: true,
    leaderboard: true,
    economy: true,
    games: true,
    scheduler: true,
    aiChatbot: true,
    downloader: true,
    statistics: true,
  },

  // === EKONOMI ===
  dailyCoins: 50,
  quizReward: 10,
  activeReward: 1,

  // === AI CHATBOT ===
  aiTrigger: ["bot,", "bot:", "!tanya"],
  aiModel: "claude-sonnet-4-20250514",

  apiKeys,
  isValidApiKey,
  hasValidApiKeys,

  // === KATA KASAR ===
  badWords: ["anjing", "bangsat", "brengsek", "bajingan"],

  // === GRUP WHITELIST ===
  allowedGroups: [
    // Tambahkan JID Grup di sini, misalnya "120363000000000000@g.us"
  ],

  // === LINK WHITELIST ===
  allowedLinks: [
    "chat.whatsapp.com/KnkESJgEUKT5PEki4SpDD0",
    "mega.nz/file/DLIzVA5I",
    "AoO4cdFq_GD07MOFBPGEOwu90SCCfoPU7vQpZtDmAYQ",
    "fxcomunity.vercel.app",
    "jack-scanner.vercel.app",
    "vallbot.vercel.app",
    "t.me/+Ng64dWNMACg1ODQ1",
    "Ng64dWNMACg1ODQ1",
    "fbs.partners",
    "ibl=957159",
    "ibp=37183404",
    "id.tradingview.com",
    "metatrader5.com",
    "drive.google.com/drive/folders/11HxV2K-ehYiyHFeI4LNjMqmuV7ETG7A3",
    "11HxV2K-ehYiyHFeI4LNjMqmuV7ETG7A3",
  ],
};

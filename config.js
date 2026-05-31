// ============================================
// config.js — Konfigurasi JackBOT
// ============================================
// PENTING: Isi nomor owner di bawah ini
// Format: kode negara + nomor TANPA +, spasi, atau strip
// Contoh: +62 812-3738-XXXX => "628123738XXXX"

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
  owners: [
    "62895404147521", // Owner tunggal
    "129003956510974", // LID Owner
    "6289531526042" // Nomor user saat ini
  ],

  // === PENGATURAN BOT ===
  prefix: "!",
  botName: "JackBOT",
  botVersion: "3.0.0",

  // === MODERASI ===
  maxWarn: 3,           // warn ke-berapa langsung kick (!warn manual)
  antiLinkMaxStrike: 3, // pelanggaran link terpisah dari warn manual
  floodLimit: 5,        // maks pesan per 10 detik
  muteDuration: 10,     // menit mute otomatis saat kena anti-spam
  slowModeDelay: 30,    // detik antar pesan saat slow mode aktif
  autoDeleteOldMsg: false, // hapus pesan > 7 hari

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
  activeReward: 1,      // koin per pesan

  // === AI CHATBOT ===
  aiTrigger: ["bot,", "bot:", "!tanya"],
  aiModel: "claude-sonnet-4-20250514", // ganti jika perlu

  apiKeys,

  isValidApiKey,
  hasValidApiKeys,

  // === KATA KASAR (tambah sesuai kebutuhan) ===
  badWords: ["anjing", "bangsat", "brengsek", "bajingan"],

  allowedLinks: ["chat.whatsapp.com/KnkESJgEUKT5PEki4SpDD0"],
};

# 🤖 JackBOT v3.0.0 (Baileys Edition)
WhatsApp Group Bot dengan fitur Mega RPG, Gacha, AI Chatbot, Downloader, dan bahasa full Gen-Z!

---

## 📦 Cara Install

```bash
# 1. Masuk folder bot
cd wa-bot

# 2. Install dependencies
npm install

# 3. Buat file config.js (Copy dari Dummy Config di bawah)
nano config.js   # atau buka pakai VS Code

# 4. Jalankan bot
npm start
```

Scan QR Code yang muncul di terminal pakai aplikasi WhatsApp kamu.

---

## ⚙️ Dummy Config (config.js)
Buat file `config.js` di folder utama dan copy kode di bawah ini. Ganti nomor owner dengan nomor kamu yang asli.

```javascript
// ============================================
// config.js — Konfigurasi Dummy JackBOT
// ============================================
// PENTING: Isi nomor owner di bawah ini
// Format: kode negara + nomor TANPA +, spasi, atau strip
// Contoh: +62 812-3738-XXXX => "628123738XXXX"

require('dotenv').config();

module.exports = {
  owners: [
    "628123456789", // Ganti pake nomor WA lu bos
  ],

  // === PENGATURAN BOT ===
  prefix: "!",
  botName: "JackBOT",
  botVersion: "3.0.0",

  // === MODERASI ===
  maxWarn: 3,           // warn ke-berapa langsung kick
  floodLimit: 5,        // maks pesan per 10 detik
  muteDuration: 10,     // menit mute otomatis saat kena anti-spam
  slowModeDelay: 30,    // detik antar pesan saat slow mode aktif
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

  apiKeys: {
    gemini: "API_KEY_GEMINI_LU",
    openai: "API_KEY_OPENAI_LU",
    deepseek: "API_KEY_DEEPSEEK_LU",
    mistral: "API_KEY_MISTRAL_LU"
  },

  // === KATA KASAR ===
  badWords: ["anjing", "bangsat", "brengsek"],
  allowedLinks: ["chat.whatsapp.com/GrupLu"],
};
```

---

## 🌟 Daftar Fitur Super Lengkap

### 🎭 Full Gen-Z Language / Gaya Tongkrongan
Semua bahasa error, info, dan respon bot udah dikonversi 100% jadi bahasa Gen-Z yang *friendly* dan asik. Nggak ada lagi bahasa kaku kaya robot!

### ⚔️ Mega RPG System & Economy
- **`!mancing`, `!nambang`, `!berburu`**: Kegiatan RPG dengan tier monster & rarity item (Common sampe Mythic). Punya sistem Durabilitas Alat!
- **`!gacha`**: Ngocok dadu ala mesin slot buat dapet hadiah random (Zonk, Uang Kaget, Item, sampe Buku Enchant Legend).
- **`!shop` / `!beli`**: Beli Role VIP, Alat Nambang (Besi, Emas, Berlian, Mythic), Pancingan, Stamina, Potion, dll.
- **Enchanting System**: Beli/Dapat drop buku Enchant (`!info enchant`). Tersedia Mending, Unbreaking, Efficiency, Fortune, Lure, dan Haste! Pasang pake `!pakai enchant [nama_buku] [alat]`.
- **`!inv` / `!inventory`**: Liat sisa durabilitas alat, level, dan barang di dalem tas lu.
- **`!sell` / `!use` / `!pakai`**: Jual barang atau konsumsi item buff/stamina.
- **`!daily`, `!saldo`, `!transfer`, `!lb`**: Manajemen koin grup.

### 📚 Skill System
- **`!skills`, `!belajar`, `!levelup`**: Sistem *skill tree* (Mining, Fishing, Combat) yang ngasih lu pasif buff. 

### 🛡️ Group Security & Moderation
- **Anti-Link & Anti-Spam**: Tendang tukang spam dan tukang share link otomatis.
- **Anti-Delete**: Ketahuan kalo ada yang narik chat. Bakal dikirim ulang sama bot.
- **Anti-ViewOnce**: Bongkar foto/video yang dikirim mode "Sekali Lihat".
- **Moderation Tools**: `!promote`, `!demote`, `!kick`, `!kickall`, `!warn`, `!mute`, `!unmute`, `!lock`, `!unlock`.

### 📥 Sosial Media Downloader
- Download kilat pake: `!yt` (YouTube), `!tt` (TikTok), `!ig` (Instagram), `!fb` (Facebook), `!tw` / `!x` (Twitter), `!pin` (Pinterest).

### 🤖 AI Chatbot & Tools Pintar
- **`!brat`**: Bikin stiker ala Brat aesthetic.
- **`!ai`, `!tanya`**: Integrasi AI untuk jawabin pertanyaan.
- **`!imagine`**: Bikin gambar AI.
- **`!translate`, `!tts`, `!cuaca`, `!kurs`, `!jadwalsholat`**: Tools serbaguna.
- **`!spotifyplay`, `!spotifysearch`**: Cari lagu Spotify langsung di WA.

### 🎮 Mini Games Asik
- `!kuis`, `!tebak`, `!jawab`, `!rate`, `!jodoh`, `!cekkhodam`.
- `!poll`, `!endpoll` buat voting.
- `!menfess` buat kirim pesan rahasia lewat bot.

### 🎶 Audio & Sticker Creator
- **`!sticker` / `!s`**: Bikin stiker foto/video.
- **Audio Effects**: Reply VN dengan efek `!bass`, `!blown`, `!deep`, `!earrape`, `!fast`, `!nightcore`, `!reverse`, `!robot`, `!squirrel`.

---

## 🤝 Kontribusi & Penghargaan

Proyek ini tidak akan terwujud tanpa dedikasi spiritual kepada **Allah SWT**, visi kreatif dari **Muhammad Rizki Sumantri**, serta bantuan pengembangan dari asisten AI (**Antigravity** & **Claude**).

Detail lengkap kontribusi dan tim pengembang dapat Anda lihat di file **[CONTRIBUTING.md](file:///c:/Users/annas/Videos/wa-bot/CONTRIBUTING.md)**.


# 🤖 GrupBot OP v3.0.0
WhatsApp Group Bot — Baileys Edition

---

## 📦 Cara Install

```bash
# 1. Masuk folder bot
cd wa-bot

# 2. Install dependencies
npm install

# 3. Isi nomor owner di config.js
nano config.js   # atau buka pakai VS Code

# 4. Jalankan bot
npm start
```

Scan QR Code yang muncul di terminal pakai WhatsApp kamu.

---

## ⚙️ Konfigurasi (config.js)

```js
owners: [
  "628123XXXXXXX",   // ganti dengan nomor asli
  "628589XXXXXXX",
  ...
]
```

Format nomor: **kode negara + nomor, tanpa + spasi atau strip**
- `+62 812-XXXX` → `"6281XXXXXXX"`
- `+60 11-XXXX`  → `"6011XXXXXXX"`

---

## 📊 Fitur Limit

| Command | Fungsi |
|---|---|
| `!limit` | Cek nama WA, status DNA, dan sisa limit kamu |
| `!limitall` | (Admin) Lihat semua user + status DNA |
| `!resetlimit @user` | (Admin) Reset limit user |
| `!setlimit @user download 10` | (Admin) Set limit custom |

### Status DNA:
- 🟢 **Aktif** — limit masih banyak
- 🟡 **Hampir Habis** — limit >60% terpakai
- 🔴 **Habis** — limit 0, tunggu reset 24 jam

---

## 🔒 Fitur Lock Grup (Owner Only)

| Command | Fungsi |
|---|---|
| `!lock` | Kunci grup (hanya admin bisa kirim) |
| `!lock 30m` | Kunci selama 30 menit, lalu buka otomatis |
| `!lock 2h` | Kunci selama 2 jam |
| `!unlock` | Buka kunci grup |

---

## 🌟 Fitur Utama

Bot ini dilengkapi dengan ratusan fitur menarik dan interaktif, termasuk dukungan tombol **Quick Reply** (Balasan Cepat Interaktif) untuk mempermudah pengguna.

### ⚔️ Mega RPG System
- **`!mancing` & `!nambang`**: Sistem gacha item (Ikan & Ore) dengan sistem rarity Tier (Common, Uncommon, Rare, Epic, Mythic, Legendary, Mythos).
- **`!shop` / `!beli`**: Beli perlengkapan (Pancingan, Pickaxe), enchant (Fortune/Lure), dan Stamina (Kecil/Sedang/Besar).
- **`!inv` / `!inventory`**: Lihat status item, level, dan rarity item di dalam tas kamu.
- **`!sell` / `!sell all`**: Jual hasil tangkapan dengan harga dinamis berdasarkan rarity.
- **`!use` / `!pakai`**: Gunakan item stamina untuk mengurangi cooldown gacha RPG.

### 🛡️ Group Security & Moderation
- **Anti-Link**: Otomatis hapus pesan dan kick member yang mengirim link grup/terlarang (kecuali admin).
- **Anti-Delete**: Jika ada pesan yang dihapus/ditarik, bot akan otomatis "menyelamatkan" pesan tersebut dan mengirimkannya (Forward) ke nomor Developer, lengkap dengan detail *Siapa yang menarik pesan* dan *Dari Grup Mana*.
- **Anti-Spam**: Mencegah member melakukan spam pesan beruntun.
- **Warn System**: `!warn`, `!resetwarn`, `!kick`, `!mute`, `!unmute` untuk manajemen grup.
- **Welcome/Goodbye Message**: Otomatis menyapa member baru / yang keluar grup.

### ⚡ Mode Khusus
- **Self Mode / Public Mode**: `!self` (bot hanya merespon perintah Owner) dan `!public` (bot merespon semua member).

### 📥 Downloader & Media
- Fitur download lengkap dari YouTube (`!yt`), TikTok (`!tt`), Instagram (`!ig`).
- Pembuatan dan pencarian Spotify (`!spotifyplay`, `!spotifysearch`).
- Sticker Maker (`!sticker` / `!s`) dengan meta data.
- Pinterest, Google Image, TTS (Text-to-Speech), dan Translate.

### 🤖 AI Chatbot
- Chat otomatis menggunakan AI yang pintar untuk merespon dan berbincang dengan member grup (`!brat`, `!jawab`, dll).

---

## 📁 Struktur File

```
wa-bot/
├── index.js              ← Bot utama
├── config.js             ← Konfigurasi & nomor owner
├── package.json
└── features/
    ├── limitSystem.js    ← Sistem limit per user
    ├── lockGroup.js      ← Lock/unlock grup
    ├── antiSpam.js       ← Anti spam & flood
    ├── antiLink.js       ← Anti link
    ├── warnSystem.js     ← Sistem warn & kick
    ├── welcome.js        ← Welcome/goodbye
    ├── economy.js        ← Sistem koin & level
    ├── games.js          ← Kuis, tebak angka, dll
    ├── downloader.js     ← YT, TikTok, IG downloader
    ├── scheduler.js      ← Pesan terjadwal
    ├── statistics.js     ← Statistik grup
    ├── aiChatbot.js      ← AI chatbot
    └── utils.js          ← Cuaca, kurs, QR, dll
```

---

## ⚠️ Penting

- Jangan upload `config.js` ke GitHub (ada nomor owner)
- Tambahkan `config.js` dan `auth_info/` ke `.gitignore`
- Bot pakai akun WA tersendiri, bukan self-bot

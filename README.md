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

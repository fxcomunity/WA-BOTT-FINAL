# SQL Editor for Neon

## 🎯 Tujuan
Menyediakan **editor SQL berbasis web premium** yang terhubung ke database **Neon Serverless PostgreSQL**. UI menggunakan tema gelap, glass‑morphism, animasi halus, dan responsif untuk desktop & mobile.

## 📦 Struktur folder
```
sql-editor/
├─ server.js          # Express server + pg pool
├─ .env               # Koneksi Neon (isi NEON_URL)
├─ .env.example       # Template .env
├─ package.json       # Dependensi
├─ public/
│   ├─ index.html    # UI utama
│   └─ styles.css    # Styling premium
└─ README.md          # <--- ini
```

## 🚀 Langkah Memulai
1. **Siapkan kredensial Neon**
   - Buka file `.env` dan ganti nilai `NEON_URL` dengan connection string Neon Anda.
   - Contoh format:
     ```
     NEON_URL=postgresql://user:password@host.neon.tech/database?sslmode=require&channel_binding=require
     ```
2. **Instal dependensi**
   ```bash
   cd C:\Users\annas\Videos\wa-bot\sql-editor
   npm install
   ```
3. **Jalankan server**
   ```bash
   npm start   # atau node server.js
   ```
   Server akan mendengarkan pada **http://localhost:3000**.
4. **Buka editor**
   - Buka browser dan navigasi ke `http://localhost:3000`.
   - Tulis query SQL di textarea, klik **Run**. Hasil akan tampil dalam tabel.

## 🔄 Migrasi data (opsional)
Jika ingin memindahkan data dari SQLite ke Neon, jalankan skrip migrasi:
```bash
node ..\migrate_sqlite_to_neon.js
```
Edit skrip `migrate_sqlite_to_neon.js` untuk menambahkan nama tabel yang ingin dimigrasi.

## 🛠️ Fitur editor
- Tema gelap dengan gradient & efek blur (glass‑morphism).
- Mikro‑animasi pada tombol & hasil.
- Responsif untuk layar kecil.
- Penanganan error yang stylish.

## 📚 Catatan tambahan
- Pastikan **Node.js ≥ 18** terinstal.
- Jika ada pertanyaan atau ingin menambahkan fitur (export CSV, history, dsb.), cukup beri tahu.

---
*Dibuat oleh Antigravity AI – © 2026*

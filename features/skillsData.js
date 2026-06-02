// features/skillsData.js

const skills = [
  // ==========================================
  // BASIC SKILLS (9 Skills)
  // ==========================================
  
  // 1. Deteksi Harta
  { 
    id: "deteksi_harta", 
    name: "Deteksi Harta", 
    type: "active", 
    source: "Otomatis level 5",
    levels: [
      { level: 1, mpCost: 10, cooldownMs: 3 * 60000, reqLevel: 5, reqGold: 0, desc: "Tahu ada item rare/epic/legend/mythos di radius 50m (Instant artifact)." },
      { level: 2, mpCost: 9, cooldownMs: 2.7 * 60000, reqLevel: 8, reqGold: 5000, reqItem: { id: "iron", amount: 3 }, desc: "+ tahu perkiraan jarak." },
      { level: 3, mpCost: 8, cooldownMs: 2.4 * 60000, reqLevel: 10, reqGold: 10000, reqItem: { id: "kristal_biru", amount: 1 }, desc: "+ tahu arah mata angin." },
      { level: 4, mpCost: 7, cooldownMs: 2.1 * 60000, reqLevel: 12, reqGold: 20000, reqItem: { id: "inti_golem_kecil", amount: 1 }, desc: "+ tahu tingkat kelangkaan." },
      { level: 5, mpCost: 5, cooldownMs: 1.5 * 60000, reqLevel: 15, reqGold: 40000, reqItem: { id: "permata_epik", amount: 1 }, desc: "+ buff 5% chance artifact selama 10m." }
    ]
  },

  // 2. Ledakan Terkendali
  { 
    id: "ledakan_terkendali", 
    name: "Ledakan Terkendali", 
    type: "active", 
    source: "Beli dari NPC Kurcaci (5000 Gold + 1 Mithril)",
    levels: [
      { level: 1, mpCost: 25, cooldownMs: 10 * 60000, reqLevel: 0, reqGold: 5000, reqItem: { id: "mithril", amount: 1 }, desc: "Radius 5m, 20% chance rusak alat. Dapat 15-30 bijih." },
      { level: 2, mpCost: 23, cooldownMs: 9 * 60000, reqLevel: 10, reqGold: 7500, reqItem: { id: "bubuk_mesiu", amount: 3 }, desc: "Radius 7m, 15% chance rusak alat." },
      { level: 3, mpCost: 20, cooldownMs: 8 * 60000, reqLevel: 12, reqGold: 15000, reqItem: { id: "gold", amount: 1 }, desc: "Radius 10m, 10% chance rusak alat." },
      { level: 4, mpCost: 18, cooldownMs: 7 * 60000, reqLevel: 15, reqGold: 25000, reqItem: { id: "coal", amount: 1 }, desc: "Radius 15m, 5% chance rusak alat." }, // Diubah ke coal sementara
      { level: 5, mpCost: 15, cooldownMs: 5 * 60000, reqLevel: 18, reqGold: 50000, reqItem: { id: "kristal_ledak", amount: 1 }, desc: "Radius 20m, 0% rusak alat, 10% chance bijih langka." }
    ]
  },

  // 3. Penyelarasan Kristal
  { 
    id: "penyelarasan_kristal", 
    name: "Penyelarasan Kristal", 
    type: "active", 
    source: "Quest Kristal Hilang",
    levels: [
      { level: 1, mpCost: 30, cooldownMs: 15 * 60000, reqLevel: 0, reqGold: 0, desc: "Ubah 10 bijih biasa (Coal/Iron) -> 1 bijih langka (Gold/Mithril)." },
      { level: 2, mpCost: 28, cooldownMs: 13 * 60000, reqLevel: 12, reqGold: 8000, reqItem: { id: "kristal_biasa", amount: 5 }, desc: "Bisa pilih jenis bijih langka (tetap 10:1)." },
      { level: 3, mpCost: 25, cooldownMs: 11 * 60000, reqLevel: 14, reqGold: 15000, reqItem: { id: "kristal_biru", amount: 2 }, desc: "Rasio 8:1." },
      { level: 4, mpCost: 22, cooldownMs: 9 * 60000, reqLevel: 16, reqGold: 30000, reqItem: { id: "kristal_ungu", amount: 1 }, desc: "Rasio 5:1." },
      { level: 5, mpCost: 18, cooldownMs: 6 * 60000, reqLevel: 20, reqGold: 60000, reqItem: { id: "kristal_abadi", amount: 1 }, desc: "Rasio 3:1, plus 5% chance dapet 2x lipat." }
    ]
  },

  // 4. Sentuhan Transmutasi
  { 
    id: "sentuhan_transmutasi", 
    name: "Sentuhan Transmutasi", 
    type: "active", 
    source: "Beli Buku Skill (2000 Gold)",
    levels: [
      { level: 1, mpCost: 15, cooldownMs: 2 * 60000, reqLevel: 0, reqGold: 2000, desc: "Ubah batu/MP -> 5 Copper/Iron acak." },
      { level: 2, mpCost: 13, cooldownMs: 1.75 * 60000, reqLevel: 5, reqGold: 3000, reqItem: { id: "batu_biasa", amount: 5 }, desc: "Bisa pilih Copper atau Iron." },
      { level: 3, mpCost: 11, cooldownMs: 1.5 * 60000, reqLevel: 7, reqGold: 6000, reqItem: { id: "tin", amount: 2 }, desc: "Bisa hasilkan Perak (Silver) (15% chance)." },
      { level: 4, mpCost: 9, cooldownMs: 1.25 * 60000, reqLevel: 10, reqGold: 12000, reqItem: { id: "silver", amount: 1 }, desc: "Bisa hasilkan Emas (Gold) (10% chance)." },
      { level: 5, mpCost: 7, cooldownMs: 1 * 60000, reqLevel: 12, reqGold: 25000, reqItem: { id: "kristal_transmutasi", amount: 1 }, desc: "Selalu menghasilkan Emas (100%)." }
    ]
  },

  // 5. Panggilan Golem Kecil
  { 
    id: "panggilan_golem", 
    name: "Panggilan Golem Kecil", 
    type: "buff", 
    source: "Drop Golem Batu Runtuh",
    levels: [
      { level: 1, mpCost: 40, cooldownMs: 10 * 60000, reqLevel: 0, reqGold: 0, desc: "Memanggil golem mini. Buff hasil nambang +50% selama 30 detik." },
      { level: 2, mpCost: 36, cooldownMs: 9 * 60000, reqLevel: 13, reqGold: 10000, reqItem: { id: "inti_golem_pecah", amount: 2 }, desc: "Durasi 40 detik, hasil +60%." },
      { level: 3, mpCost: 32, cooldownMs: 8 * 60000, reqLevel: 15, reqGold: 20000, reqItem: { id: "inti_golem_utuh", amount: 1 }, desc: "Durasi 50 detik, hasil +75%." },
      { level: 4, mpCost: 28, cooldownMs: 7 * 60000, reqLevel: 18, reqGold: 35000, reqItem: { id: "inti_golem_besar", amount: 1 }, desc: "Durasi 60 detik, hasil +100%." },
      { level: 5, mpCost: 24, cooldownMs: 5 * 60000, reqLevel: 20, reqGold: 70000, reqItem: { id: "inti_golem_raksasa", amount: 1 }, desc: "Durasi 90 detik, hasil +150%, golem bertarung." }
    ]
  },

  // 6. Lampu Kristal Abadi
  { 
    id: "lampu_kristal_abadi", 
    name: "Lampu Kristal Abadi", 
    type: "buff", 
    source: "Craft sendiri level 10",
    levels: [
      { level: 1, mpCost: 25, cooldownMs: 0, reqLevel: 10, reqGold: 0, desc: "+10% chance dapat batu mulia saat menyala. (Buff durasi 5 menit, 25 MP total)" },
      { level: 2, mpCost: 20, cooldownMs: 0, reqLevel: 12, reqGold: 5000, reqItem: { id: "kristal_biasa", amount: 5 }, desc: "+15% chance batu mulia. (Buff durasi 5 menit, 20 MP total)" },
      { level: 3, mpCost: 15, cooldownMs: 0, reqLevel: 14, reqGold: 10000, reqItem: { id: "kristal_biru", amount: 3 }, desc: "+20% chance, +5% chance artefak. (15 MP)" },
      { level: 4, mpCost: 10, cooldownMs: 0, reqLevel: 16, reqGold: 20000, reqItem: { id: "kristal_ungu", amount: 1 }, desc: "+25% chance, +10% chance artefak. (10 MP)" },
      { level: 5, mpCost: 5, cooldownMs: 0, reqLevel: 20, reqGold: 40000, reqItem: { id: "kristal_abadi", amount: 1 }, desc: "+30% chance batu mulia, +15% chance artefak, menerangi area. (5 MP)" }
    ]
  },

  // 7. Pertahanan Karang
  { 
    id: "pertahanan_karang", 
    name: "Pertahanan Karang", 
    type: "buff", 
    source: "Sumbang ke Kuil (1000 Gold)",
    levels: [
      { level: 1, mpCost: 20, cooldownMs: 5 * 60000, reqLevel: 0, reqGold: 1000, desc: "-80% damage dari monster selama 5 giliran (Buff 15 menit)." },
      { level: 2, mpCost: 18, cooldownMs: 4.5 * 60000, reqLevel: 9, reqGold: 6000, reqItem: { id: "batu_karang", amount: 5 }, desc: "-85% damage, durasi 6 giliran." },
      { level: 3, mpCost: 16, cooldownMs: 4 * 60000, reqLevel: 11, reqGold: 12000, reqItem: { id: "diamond", amount: 2 }, desc: "-90% damage, durasi 7 giliran." }, // diamond as batu mulia
      { level: 4, mpCost: 14, cooldownMs: 3.5 * 60000, reqLevel: 13, reqGold: 25000, reqItem: { id: "kristal_biasa", amount: 1 }, desc: "-95% damage, durasi 8 giliran." },
      { level: 5, mpCost: 10, cooldownMs: 2 * 60000, reqLevel: 15, reqGold: 50000, reqItem: { id: "perisai_karang_purba", amount: 1 }, desc: "100% damage reduction (5 giliran), lalu 90% (3 giliran)." }
    ]
  },

  // 8. Penggalian Mistis
  { 
    id: "penggalian_mistis", 
    name: "Penggalian Mistis", 
    type: "active", 
    source: "Beli dengan Token (10000 Gold)",
    levels: [
      { level: 1, mpCost: 12, cooldownMs: 30 * 60000, reqLevel: 0, reqGold: 10000, desc: "Reset cooldown !nambang sekali." },
      { level: 2, mpCost: 11, cooldownMs: 27 * 60000, reqLevel: 16, reqGold: 15000, reqItem: { id: "token_biasa", amount: 3 }, desc: "Reset CD, next nambang hasil +1." },
      { level: 3, mpCost: 10, cooldownMs: 24 * 60000, reqLevel: 18, reqGold: 30000, reqItem: { id: "token_langka", amount: 2 }, desc: "Reset CD, hasil +2." },
      { level: 4, mpCost: 9, cooldownMs: 21 * 60000, reqLevel: 20, reqGold: 60000, reqItem: { id: "token_epic", amount: 1 }, desc: "Reset CD, hasil +3, tidak bisa gagal." },
      { level: 5, mpCost: 7, cooldownMs: 15 * 60000, reqLevel: 25, reqGold: 100000, reqItem: { id: "token_legend", amount: 1 }, desc: "Reset CD, hasil +5, 10% chance dapet item langka." }
    ]
  },

  // 9. Levitas Batu
  { 
    id: "levitas_batu", 
    name: "Levitas Batu", 
    type: "buff", 
    source: "Otomatis saat Level 8",
    levels: [
      { level: 1, mpCost: 18, cooldownMs: 4 * 60000, reqLevel: 8, reqGold: 0, desc: "Hasil +2, hindari longsor. (Buff 5 menit)" },
      { level: 2, mpCost: 16, cooldownMs: 3.6 * 60000, reqLevel: 10, reqGold: 8000, reqItem: { id: "batu_ringan", amount: 3 }, desc: "Hasil +3, hindari longsor & goblin curi." },
      { level: 3, mpCost: 14, cooldownMs: 3.3 * 60000, reqLevel: 12, reqGold: 16000, reqItem: { id: "kristal_angin", amount: 1 }, desc: "Hasil +4, hindari semua gangguan." },
      { level: 4, mpCost: 12, cooldownMs: 3 * 60000, reqLevel: 15, reqGold: 35000, reqItem: { id: "bulu_pegasus", amount: 1 }, desc: "Hasil +5, +10% chance batu mulia." },
      { level: 5, mpCost: 10, cooldownMs: 2 * 60000, reqLevel: 18, reqGold: 70000, reqItem: { id: "jimat_levitasi", amount: 1 }, desc: "Hasil +8, 20% chance double hasil." }
    ]
  },

  // ==========================================
  // ULTIMATE SKILLS (4 Skills)
  // ==========================================
  
  // 10. Gempa Magma
  { 
    id: "gempa_magma", 
    name: "Gempa Magma", 
    type: "active", 
    source: "Otomatis Level 50",
    levels: [
      { level: 1, mpCost: 80, cooldownMs: 60 * 60000, reqLevel: 50, reqGold: 0, desc: "Mencairkan batuan, dapat 50 item rare/epic acak." },
      { level: 2, mpCost: 75, cooldownMs: 55 * 60000, reqLevel: 52, reqGold: 20000, reqItem: { id: "coal", amount: 5 }, desc: "Nilai item lebih tinggi (+40%), sedikit magma essence." }, // ReqLevel slightly incremented for balance since user wrote "Lv 22" but it's an ultimate Lv 50 skill
      { level: 3, mpCost: 70, cooldownMs: 50 * 60000, reqLevel: 54, reqGold: 40000, reqItem: { id: "inti_magma", amount: 2 }, desc: "Nilai +50%, 20% chance 2x lipat." },
      { level: 4, mpCost: 65, cooldownMs: 45 * 60000, reqLevel: 57, reqGold: 80000, reqItem: { id: "kristal_api_abadi", amount: 1 }, desc: "Nilai +75%, 30% chance 2x, 5% chance epic artifact." },
      { level: 5, mpCost: 60, cooldownMs: 30 * 60000, reqLevel: 60, reqGold: 150000, reqItem: { id: "jantung_gunung", amount: 1 }, desc: "Nilai +100%, 50% chance 2x, 10% chance legend artifact." }
    ]
  },

  // 11. Void Mining
  { 
    id: "void_mining", 
    name: "Void Mining", 
    type: "active", 
    source: "Quest Level 60",
    levels: [
      { level: 1, mpCost: 100, cooldownMs: 120 * 60000, reqLevel: 60, reqGold: 0, desc: "Mendapat 5-10 item Legend/Mythos, 10% chance hilang 1 item." },
      { level: 2, mpCost: 95, cooldownMs: 110 * 60000, reqLevel: 62, reqGold: 30000, reqItem: { id: "void_shard", amount: 3 }, desc: "8% chance hilang, hasil lebih banyak (2-3 item)." },
      { level: 3, mpCost: 90, cooldownMs: 100 * 60000, reqLevel: 64, reqGold: 60000, reqItem: { id: "void_core", amount: 1 }, desc: "5% chance hilang, 1% chance dapet Mythos asli." },
      { level: 4, mpCost: 85, cooldownMs: 90 * 60000, reqLevel: 66, reqGold: 120000, reqItem: { id: "eye_of_void", amount: 1 }, desc: "3% chance hilang, 3% chance Mythos." },
      { level: 5, mpCost: 80, cooldownMs: 60 * 60000, reqLevel: 70, reqGold: 250000, reqItem: { id: "void_heart", amount: 1 }, desc: "0% chance hilang, 5% chance Mythos, hasil minimal Legend." }
    ]
  },

  // 12. Sentuhan Dewa Penambang
  { 
    id: "sentuhan_dewa", 
    name: "Sentuhan Dewa Penambang", 
    type: "active", 
    source: "Drop The Bedrock King",
    levels: [
      { level: 1, mpCost: 150, cooldownMs: 1440 * 60000, reqLevel: 0, reqGold: 500000, desc: "Ubah 1 batu biasa -> 1 Mythical Ore (1x / hari)." },
      { level: 2, mpCost: 140, cooldownMs: 720 * 60000, reqLevel: 72, reqGold: 50000, reqItem: { id: "mythical_ore", amount: 2 }, desc: "2x per hari (CD 12 Jam)." },
      { level: 3, mpCost: 130, cooldownMs: 480 * 60000, reqLevel: 75, reqGold: 100000, reqItem: { id: "mythical_ore", amount: 5 }, desc: "3x per hari (CD 8 Jam), 25% chance dapat 2x." },
      { level: 4, mpCost: 120, cooldownMs: 360 * 60000, reqLevel: 78, reqGold: 200000, reqItem: { id: "divine_stone", amount: 1 }, desc: "4x per hari (CD 6 Jam), 50% chance 2x." },
      { level: 5, mpCost: 100, cooldownMs: 240 * 60000, reqLevel: 80, reqGold: 500000, reqItem: { id: "hand_of_god", amount: 1 }, desc: "6x per hari (CD 4 Jam), selalu double, 10% chance Legendary Ore ekstra." }
    ]
  },

  // 13. Animasi Tambang
  { 
    id: "animasi_tambang", 
    name: "Animasi Tambang", 
    type: "buff", 
    source: "Beli dari NPC Master Golem (50k Gold + 1 Epic Core)",
    levels: [
      { level: 1, mpCost: 60, cooldownMs: 45 * 60000, reqLevel: 0, reqGold: 50000, reqItem: { id: "inti_golem", amount: 1 }, desc: "3 Golem, 1 menit buff, hasil 3x lipat." },
      { level: 2, mpCost: 55, cooldownMs: 40 * 60000, reqLevel: 20, reqGold: 30000, reqItem: { id: "inti_golem_besar", amount: 2 }, desc: "4 Golem, 1.5 menit buff, hasil 4x lipat." },
      { level: 3, mpCost: 50, cooldownMs: 35 * 60000, reqLevel: 22, reqGold: 60000, reqItem: { id: "inti_golem_raksasa", amount: 1 }, desc: "5 Golem, 2 menit buff, hasil 5x lipat." },
      { level: 4, mpCost: 45, cooldownMs: 30 * 60000, reqLevel: 25, reqGold: 120000, reqItem: { id: "inti_golem_titan", amount: 1 }, desc: "6 Golem, 2.5 menit buff, hasil 6x lipat." },
      { level: 5, mpCost: 40, cooldownMs: 20 * 60000, reqLevel: 28, reqGold: 250000, reqItem: { id: "heart_of_golem", amount: 1 }, desc: "8 Golem, 3 menit buff, hasil 8x lipat, golem cari rare mat." }
    ]
  },

  // ==========================================
  // GOD SKILLS & CREATOR (Owner Cheat)
  // ==========================================
  
  // God Skills
  { id: "petir_olimpus", name: "Petir Olimpus", type: "active", source: "Kalahkan Zeus", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Petir legendaris penyapu bersih." }] },
  { id: "penghakiman_maat", name: "Penghakiman Maat", type: "active", source: "Kalahkan Anubis", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Menghukum musuh dengan damage mematikan." }] },
  { id: "supernova_surya", name: "Supernova Surya", type: "active", source: "Kalahkan Ra", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Bakaran matahari tanpa akhir." }] },
  { id: "pusaran_samudra", name: "Pusaran Samudra", type: "active", source: "Kalahkan Poseidon", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Badai lautan yang menenggelamkan monster." }] },
  { id: "kehancuran_kosmis", name: "Kehancuran Kosmis", type: "active", source: "Kalahkan Sang Hyang Widhi", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Ledakan alam semesta." }] },
  { id: "trisula_blast", name: "Trisula Blast", type: "active", source: "Kalahkan Bathara Guru", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Tembakan energi dari trisula khayangan." }] },
  { id: "mantra_pembersih", name: "Mantra Pembersih", type: "active", source: "Kalahkan Barong", levels: [{ level: 5, mpCost: 500, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "God Skill: Menghapus aura kejahatan musuh." }] },

  // Creator Skill
  { 
    id: "pembuatan_skill", 
    name: "God Of Creator", 
    type: "active", 
    source: "Khusus Owner",
    levels: [
      { level: 5, mpCost: 0, cooldownMs: 0, reqLevel: 999, reqGold: 0, desc: "Instant Kill! Hapus musuh dari eksistensi." }
    ]
  }
];

module.exports = {
  skills
};

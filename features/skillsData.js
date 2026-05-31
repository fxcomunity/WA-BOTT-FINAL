// features/skillsData.js

const skills = [
  // MP-based Mining Skills
  { 
    id: "deteksi_harta", 
    name: "Deteksi Harta", 
    mpCost: 10, 
    cooldownMs: 3 * 60000, // 3 menit
    reqLevel: 5, 
    source: "Otomatis level 5",
    type: "active", 
    desc: "Mengungkap item langka (epic/legend/mythos) di radius 50 meter. Peluang 100% dapat Artefak acak." 
  },
  { 
    id: "ledakan_terkendali", 
    name: "Ledakan Terkendali", 
    mpCost: 25, 
    cooldownMs: 10 * 60000, 
    reqGold: 5000,
    reqItem: { id: "mithril", amount: 1 },
    source: "Beli dari NPC Kurcaci",
    type: "active", 
    desc: "Meledakkan dinding tambang. Langsung mendapat 15-30 bijih biasa/rare secara acak." 
  },
  { 
    id: "penyelarasan_kristal", 
    name: "Penyelarasan Kristal", 
    mpCost: 30, 
    cooldownMs: 15 * 60000, 
    source: "Quest (Langsung tersedia)",
    type: "active", 
    desc: "Mengubah 10 bijih coal/iron jadi 1 bijih gold/mithril secara acak." 
  },
  { 
    id: "sentuhan_transmutasi", 
    name: "Sentuhan Transmutasi", 
    mpCost: 15, 
    cooldownMs: 2 * 60000, 
    reqGold: 2000,
    source: "Beli Buku Skill di toko",
    type: "active", 
    desc: "Mengubah 1 batu (atau tanpa batu, modal MP) jadi 5 copper/iron." 
  },
  { 
    id: "panggilan_golem", 
    name: "Panggilan Golem Kecil", 
    mpCost: 40, 
    cooldownMs: 10 * 60000, 
    source: "Drop Golem Batu Runtuh",
    type: "buff", 
    desc: "Memanggil golem mini penggali. Mendapatkan status [golem_bantu] selama 10 menit (Double drop ore)." 
  },
  { 
    id: "lampu_kristal_abadi", 
    name: "Lampu Kristal Abadi", 
    mpCost: 5, 
    cooldownMs: 0, 
    reqLevel: 10,
    source: "Otomatis level 10",
    type: "buff", 
    desc: "Menerangi area. Memberikan status [lampu_kristal] selama 5 menit (+20% chance rare ore)." 
  },
  { 
    id: "pertahanan_karang", 
    name: "Pertahanan Karang", 
    mpCost: 20, 
    cooldownMs: 5 * 60000, 
    reqGold: 1000, // as a donation
    source: "Donasi kuil",
    type: "buff", 
    desc: "Perisai batu magis. Mendapatkan status [perisai_karang] selama 15 menit (Damage monster -80%)." 
  },
  { 
    id: "penggalian_mistis", 
    name: "Penggalian Mistis", 
    mpCost: 12, 
    cooldownMs: 30 * 60000, 
    reqGold: 10000,
    source: "Beli dengan token/gold",
    type: "active", 
    desc: "Langsung reset cooldown menambang (bisa pakai lagi meski baru saja)." 
  },
  { 
    id: "levitas_batu", 
    name: "Levitas Batu", 
    mpCost: 18, 
    cooldownMs: 4 * 60000, 
    reqLevel: 8,
    source: "Otomatis level 8",
    type: "buff", 
    desc: "Mengangkat batu besar secara telekinetik. Mendapatkan status [levitas] selama 5 menit (Anti-Monster)." 
  },

  // Ultimate Skills
  { 
    id: "gempa_magma", 
    name: "Gempa Magma", 
    mpCost: 80, 
    cooldownMs: 60 * 60000, 
    reqLevel: 50,
    source: "Otomatis level 50",
    type: "active", 
    desc: "Mencairkan seluruh batuan. Mendapatkan 50 item rare/epic acak sekaligus." 
  },
  { 
    id: "void_mining", 
    name: "Void Mining", 
    mpCost: 100, 
    cooldownMs: 120 * 60000, 
    reqLevel: 60,
    source: "Quest (Otomatis level 60)",
    type: "active", 
    desc: "Membuka portal ke dimensi hampa. Mendapatkan 5-10 item Legend/Mythos." 
  },
  { 
    id: "sentuhan_dewa", 
    name: "Sentuhan Dewa Penambang", 
    mpCost: 150, 
    cooldownMs: 1440 * 60000, // 24 jam
    reqGold: 500000,
    source: "Drop Bedrock King",
    type: "active", 
    desc: "Mendapatkan 1 Mythical Ore langka." 
  },
  { 
    id: "animasi_tambang", 
    name: "Animasi Tambang", 
    mpCost: 60, 
    cooldownMs: 45 * 60000, 
    reqGold: 50000,
    reqItem: { id: "inti_golem", amount: 1 }, // This item exists in rpgData.js artifacts/drops
    source: "Beli dari NPC",
    type: "buff", 
    desc: "Menghidupkan 3 golem. Mendapatkan status [animasi_tambang] selama 15 menit (3x lipat hasil nambang)." 
  }
];

module.exports = {
  skills
};

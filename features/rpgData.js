// features/rpgData.js
// Berisi data untuk Monster dan Artefak di Sistem RPG Tambang

const monsterTiers = {
  1: { id: 1, name: "Common", encounterRate: 60 },
  2: { id: 2, name: "Uncommon", encounterRate: 25 },
  3: { id: 3, name: "Rare", encounterRate: 10 },
  4: { id: 4, name: "Epic", encounterRate: 4 },
  5: { id: 5, name: "Legend", encounterRate: 0.9 },
  6: { id: 6, name: "Mythos", encounterRate: 0.1 }
};

const artifactTiers = {
  1: { id: 1, name: "Common", dropRate: 70 },
  2: { id: 2, name: "Uncommon", dropRate: 15 },
  3: { id: 3, name: "Rare", dropRate: 8 },
  4: { id: 4, name: "Epic", dropRate: 4 },
  5: { id: 5, name: "Legend", dropRate: 2.5 },
  6: { id: 6, name: "Mythos", dropRate: 0.5 }
};

const monsters = [
  // COMMON
  { id: "rayap_batu", name: "Rayap Batu Kecil", tier: 1, hp: 20, maxHp: 20, damage: [2, 5], 
    ability: "reduce_durability", dropGold: [10, 20], dropItem: "pecahan_batu" },
  { id: "kelelawar_buta", name: "Kelelawar Gua Buta", tier: 1, hp: 25, maxHp: 25, damage: [3, 6], 
    ability: "miss_chance", dropGold: [15, 15], dropItem: "sayap_kelelawar" },
  { id: "laba_batu", name: "Laba-Laba Batu Berdebu", tier: 1, hp: 30, maxHp: 30, damage: [4, 8], 
    ability: "skip_turn", dropGold: [20, 20], dropItem: "jaring_lengket" },
  { id: "cacing_tanah", name: "Cacing Tanah Raksasa", tier: 1, hp: 40, maxHp: 40, damage: [5, 10], 
    ability: "evade", dropGold: [30, 30], dropItem: "lendir_cacing" },
  { id: "tikus_tambang", name: "Tikus Tambang Berkarat", tier: 1, hp: 15, maxHp: 15, damage: [1, 3], 
    ability: "steal_ore", dropGold: [5, 5], dropItem: "gigi_tikus" },

  // UNCOMMON
  { id: "goblin_penggali", name: "Goblin Penggali", tier: 2, hp: 60, maxHp: 60, damage: [8, 15], 
    ability: "direct_damage_5", dropGold: [40, 60], dropItem: "beliung_rusak" },
  { id: "slime_abu", name: "Slime Batu Abu-abu", tier: 2, hp: 50, maxHp: 50, damage: [5, 12], 
    ability: "split", dropGold: [50, 50], dropItem: "jeli_batu" },
  { id: "ular_dua_kepala", name: "Ular Dua Kepala Karst", tier: 2, hp: 70, maxHp: 70, damage: [10, 18], 
    ability: "poison_blind", dropGold: [70, 70], dropItem: "taring_ular" },
  { id: "kumbang_besi", name: "Kumbang Kulit Besi", tier: 2, hp: 100, maxHp: 100, damage: [5, 10], 
    ability: "high_defense", dropGold: [60, 60], dropItem: "cangkang_kumbang" },
  { id: "scorpion_kristal", name: "Scorpion Kristal Kecil", tier: 2, hp: 65, maxHp: 65, damage: [12, 20], 
    ability: "paralyze", dropGold: [85, 85], dropItem: "ekor_kalajengking" },

  // RARE
  { id: "golem_runtuh", name: "Golem Batu Runtuh", tier: 3, hp: 150, maxHp: 150, damage: [15, 25], 
    ability: "reflect_aoe", dropGold: [150, 150], dropItem: "inti_golem" },
  { id: "vampir_gua", name: "Vampir Gua", tier: 3, hp: 120, maxHp: 120, damage: [20, 30], 
    ability: "lifesteal", dropGold: [200, 200], dropItem: "gigi_vampir" },
  { id: "naga_kecil", name: "Naga Kecil Bawah Tanah", tier: 3, hp: 180, maxHp: 180, damage: [30, 50], 
    ability: "fire_breath", dropGold: [250, 250], dropItem: "sisik_naga_muda" },
  { id: "ratu_laba", name: "Ratu Laba-Laba Batu", tier: 3, hp: 160, maxHp: 160, damage: [25, 35], 
    ability: "summon_spiders", dropGold: [180, 180], dropItem: "sutera_ratu" },
  { id: "fosil_hidup", name: "Fosil Hidup", tier: 3, hp: 200, maxHp: 200, damage: [10, 20], 
    ability: "explode_on_death", dropGold: [300, 300], dropItem: "tulang_purba" },

  // EPIC
  { id: "beholder_batu", name: "Beholder Batu", tier: 4, hp: 350, maxHp: 350, damage: [40, 60], 
    ability: "petrify", dropGold: [500, 500], dropItem: "mata_beholder" },
  { id: "raja_goblin", name: "Raja Goblin Bawah Tanah", tier: 4, hp: 400, maxHp: 400, damage: [60, 80], 
    ability: "summon_goblins", dropGold: [700, 700], dropItem: "mahkota_goblin" },
  { id: "wyrm_pasir", name: "Wyrm Pasir Bergerak", tier: 4, hp: 450, maxHp: 450, damage: [50, 70], 
    ability: "burrow_strike", dropGold: [600, 600], dropItem: "cakar_wyrm" },
  { id: "golem_berlian", name: "Golem Berlian Cacat", tier: 4, hp: 500, maxHp: 500, damage: [40, 50], 
    ability: "magic_reflect", dropGold: [800, 800], dropItem: "pecahan_berlian" },
  { id: "lich_penambang", name: "Lich Penambang Terkutuk", tier: 4, hp: 380, maxHp: 380, damage: [45, 65], 
    ability: "curse_mining", dropGold: [750, 750], dropItem: "jimat_pengangkat_kutuk" },

  // LEGEND
  { id: "naga_emas", name: "Naga Emas Purba", tier: 5, hp: 1000, maxHp: 1000, damage: [100, 150], 
    ability: "gold_fire_breath", dropGold: [2000, 2000], dropItem: "hati_naga_emas" },
  { id: "colossus_gunung", name: "Colossus Gunung Berjalan", tier: 5, hp: 1200, maxHp: 1200, damage: [80, 120], 
    ability: "earthquake_drop", dropGold: [2500, 2500], dropItem: "batu_jantung_colossus" },
  { id: "void_crawler", name: "Void Crawler", tier: 5, hp: 900, maxHp: 900, damage: [90, 140], 
    ability: "black_hole", dropGold: [3000, 3000], dropItem: "void_shard" },
  { id: "phoenix_bawah_tanah", name: "Phoenix Bawah Tanah", tier: 5, hp: 850, maxHp: 850, damage: [110, 160], 
    ability: "revive_burn", dropGold: [2800, 2800], dropItem: "bulu_api_abadi" },
  { id: "titan_palu", name: "Titan Palu Gemuruh", tier: 5, hp: 1500, maxHp: 1500, damage: [120, 180], 
    ability: "hammer_quake", dropGold: [3500, 3500], dropItem: "palu_titan" },

  // MYTHOS
  { id: "eater_of_worlds", name: "Eater of Worlds", tier: 6, hp: 5000, maxHp: 5000, damage: [200, 300], 
    ability: "devour_world", dropGold: [10000, 10000], dropItem: "inti_pemakan_dunia" },
  { id: "primordial_golem", name: "Primordial Golem", tier: 6, hp: 8000, maxHp: 8000, damage: [150, 250], 
    ability: "absolute_defense", dropGold: [8000, 8000], dropItem: "batu_pencipta" },
  { id: "silent_one", name: "The Silent One", tier: 6, hp: 4000, maxHp: 4000, damage: [100, 200], 
    ability: "silence_doom", dropGold: [15000, 15000], dropItem: "requiem_of_silence" },
  { id: "anomali_waktu", name: "Anomali Waktu Tambang", tier: 6, hp: 6000, maxHp: 6000, damage: [180, 280], 
    ability: "time_warp", dropGold: [12000, 12000], dropItem: "hourglass_anomaly" },
  { id: "bedrock_king", name: "The Bedrock King", tier: 6, hp: 10000, maxHp: 10000, damage: [250, 400], 
    ability: "elemental_immunity", dropGold: [20000, 20000], dropItem: "crown_of_bedrock" }
];

const artifacts = [
  // COMMON
  { id: "batu_kirap", name: "Batu Kirap Berkedip", tier: 1, type: "consumable", price: 5, action: "heal", amount: 10 },
  { id: "paku_berkarat", name: "Paku Berkarat Tua", tier: 1, type: "material", price: 5 },
  { id: "koin_usang", name: "Koin Usang Tak Berlubang", tier: 1, type: "consumable", price: 10, action: "buff", buff: "drop_rate_5", duration: 10 }, // 10 menit
  { id: "kerikil_aura", name: "Kerikil Beraura Samar", tier: 1, type: "passive", price: 5 },
  { id: "pecahan_gerabah", name: "Pecahan Gerabah Kuna", tier: 1, type: "material", price: 5 },

  // UNCOMMON
  { id: "lonceng_batu", name: "Lonceng Batu Berdenging Hening", tier: 2, type: "consumable", price: 50, action: "buff", buff: "monster_repel", duration: 5 },
  { id: "mata_kucing", name: "Mata Kucing Beku", tier: 2, type: "consumable", price: 60, action: "buff", buff: "mine_speed", duration: 10 },
  { id: "pahat_glu", name: "Pahat Bermata Glu", tier: 2, type: "consumable", price: 70, action: "buff", buff: "yield_plus_1", duration: 30 },
  { id: "tulang_naga_kerdil", name: "Tulang Naga Kerdil", tier: 2, type: "consumable", price: 80, action: "buff", buff: "damage_plus_5", duration: 5 },
  { id: "lampu_kristal", name: "Lampu Isi Ulang Kristal", tier: 2, type: "consumable", price: 90, action: "buff", buff: "rare_chance_15", duration: 10 },

  // RARE
  { id: "kapak_perunggu", name: "Kapak Perunggu Purba", tier: 3, type: "weapon", price: 200, damage: [20, 30] },
  { id: "jimat_api", name: "Jimat Lidah Api", tier: 3, type: "consumable", price: 250, action: "buff", buff: "fire_immune", duration: 30 },
  { id: "peta_urang_awi", name: "Peta Tambang Urang Awi", tier: 3, type: "consumable", price: 300, action: "buff", buff: "double_yield", duration: 10 },
  { id: "botol_hampa", name: "Botol Hampa Awan", tier: 3, type: "consumable", price: 500, action: "heal_status", status: "poison" },
  { id: "mahkota_penambang_gila", name: "Mahkota Penambang Gila", tier: 3, type: "passive", price: 400 },

  // EPIC
  { id: "jantung_gunung", name: "Jantung Gunung Berdetak", tier: 4, type: "consumable", price: 1000, action: "buff", buff: "triple_yield", duration: 10 },
  { id: "gesper_titan", name: "Gesper Sabuk Titan", tier: 4, type: "passive", price: 1200 },
  { id: "cermin_bisik", name: "Cermin Berbisik Prasejarah", tier: 4, type: "consumable", price: 1500, action: "buff", buff: "reflect_damage", duration: 15 },
  { id: "palu_gemuruh", name: "Palu Gemuruh Abadi", tier: 4, type: "weapon", price: 2000, damage: [50, 70] },
  { id: "permata_awan", name: "Permata Awan Panas", tier: 4, type: "material", price: 1800 },

  // LEGEND
  { id: "mata_air_leluhur", name: "Mata Air Keabadian Leluhur", tier: 5, type: "passive", price: 5000 },
  { id: "batu_pencipta_alam", name: "Batu Bertuah Pencipta Alam", tier: 5, type: "consumable", price: 6000, action: "instant_ore", amount: 50 },
  { id: "mahkota_goblin_raja", name: "Mahkota Raja Goblin Bawah Tanah", tier: 5, type: "passive", price: 7000 },
  { id: "lonceng_kiamat", name: "Lonceng Kiamat Tambang Tua", tier: 5, type: "consumable", price: 8000, action: "instant_epic", amount: 10 },
  { id: "kronikel_debu", name: "Kronikel Debu Bintang", tier: 5, type: "material", price: 10000 },

  // MYTHOS
  { id: "telur_naga", name: "Telur Naga Dasar Bumi", tier: 6, type: "passive", price: 50000 },
  { id: "jam_pasir", name: "Jam Pasir Pencipta Lembah", tier: 6, type: "consumable", price: 60000, action: "reset_cd" },
  { id: "kulit_bumi", name: "Kulit Bumi Yang Luruh", tier: 6, type: "consumable", price: 70000, action: "buff", buff: "god_mode", duration: 10 },
  { id: "kitab_sunyi", name: "Kitab Sunyi Sang Penggali", tier: 6, type: "consumable", price: 80000, action: "instant_massive", amount: 500 },
  { id: "mahkota_pencipta", name: "Mahkota Sang Pencipta Tambang", tier: 6, type: "passive", price: 100000 }
];

const monsterTagMap = {
  rayap_batu: ["slime", "beast"], kelelawar_buta: ["beast", "flying"], laba_batu: ["beast"],
  cacing_tanah: ["beast"], tikus_tambang: ["beast"], goblin_penggali: ["humanoid"],
  slime_abu: ["slime"], ular_dua_kepala: ["beast"], kumbang_besi: ["golem", "armor"],
  scorpion_kristal: ["beast", "desert"], golem_runtuh: ["golem", "armor"],
  vampir_gua: ["undead"], naga_kecil: ["beast", "flying", "magic"], ratu_laba: ["beast"],
  fosil_hidup: ["undead"], beholder_batu: ["magic", "flying"], raja_goblin: ["humanoid", "boss"],
  wyrm_pasir: ["beast", "desert"], golem_berlian: ["golem", "armor"], lich_penambang: ["undead", "magic", "boss"],
  naga_emas: ["boss", "magic", "undead"], colossus_gunung: ["golem", "slow", "giant"],
  void_crawler: ["magic", "boss"], phoenix_bawah_tanah: ["magic", "flying"],
  titan_palu: ["slow", "giant", "boss"], eater_of_worlds: ["boss", "magic"],
  primordial_golem: ["golem", "boss"], silent_one: ["magic", "boss"],
  anomali_waktu: ["magic", "boss"], bedrock_king: ["boss", "golem"],
};

const huntMonsters = [
  { id: "babi_hutan", name: "Babi Hutan", tier: 1, hp: 30, maxHp: 30, damage: [4, 10], tags: ["beast"],
    ability: "charge", dropGold: [15, 30], dropItem: "daging_babi" },
  { id: "rusa_liar", name: "Rusa Liar", tier: 1, hp: 22, maxHp: 22, damage: [2, 6], tags: ["beast"],
    ability: "evade", dropGold: [10, 25], dropItem: "daging_rusa" },
  { id: "serigala_kelaparan", name: "Serigala Kelaparan", tier: 1, hp: 35, maxHp: 35, damage: [5, 12], tags: ["beast"],
    ability: "pack_bite", dropGold: [20, 35], dropItem: "bulu_serigala" },
  { id: "beruang_coklat", name: "Beruang Coklat", tier: 2, hp: 80, maxHp: 80, damage: [12, 22], tags: ["beast", "slow"],
    ability: "maul", dropGold: [50, 80], dropItem: "kulit_beruang" },
  { id: "macan_tutul", name: "Macan Tutul", tier: 2, hp: 70, maxHp: 70, damage: [15, 25], tags: ["beast"],
    ability: "pounce", dropGold: [60, 90], dropItem: "daging_macan" },
  { id: "king_boar", name: "King Boar", tier: 3, hp: 150, maxHp: 150, damage: [20, 35], tags: ["beast", "boss"],
    ability: "charge", dropGold: [120, 200], dropItem: "taring_babi_raja" },
  { id: "harimau_putih", name: "Harimau Putih", tier: 3, hp: 130, maxHp: 130, damage: [25, 40], tags: ["beast"],
    ability: "stealth_strike", dropGold: [150, 220], dropItem: "daging_harimau" },
  { id: "alpha_wolf", name: "Alpha Wolf", tier: 3, hp: 140, maxHp: 140, damage: [22, 38], tags: ["beast", "boss"],
    ability: "howl", dropGold: [140, 210], dropItem: "bulu_alpha" },
  { id: "forest_wyrm", name: "Forest Wyrm", tier: 4, hp: 300, maxHp: 300, damage: [40, 65], tags: ["beast", "flying", "boss"],
    ability: "fire_breath", dropGold: [400, 600], dropItem: "sisik_wyrm" },
  { id: "ancient_bear", name: "Ancient Bear", tier: 4, hp: 380, maxHp: 380, damage: [35, 55], tags: ["beast", "slow", "giant"],
    ability: "earthquake", dropGold: [450, 700], dropItem: "jantung_beruang" },
  { id: "spirit_stag", name: "Spirit Stag", tier: 5, hp: 600, maxHp: 600, damage: [60, 90], tags: ["magic", "beast", "boss"],
    ability: "nature_blast", dropGold: [800, 1200], dropItem: "tanduk_roh" },
  { id: "primal_tiger", name: "Primal Tiger", tier: 5, hp: 550, maxHp: 550, damage: [70, 100], tags: ["beast", "boss"],
    ability: "claw_fury", dropGold: [900, 1400], dropItem: "cakar_primal" },
  { id: "beast_king", name: "Beast King of the Wild", tier: 6, hp: 2000, maxHp: 2000, damage: [120, 200], tags: ["beast", "boss", "giant"],
    ability: "roar", dropGold: [3000, 5000], dropItem: "mahkota_binatang" },
];

function enrichMonster(m) {
  return { ...m, tags: m.tags || monsterTagMap[m.id] || ["beast"] };
}

function findMonster(id) {
  const m = monsters.find(x => x.id === id) || huntMonsters.find(x => x.id === id);
  return m ? enrichMonster(m) : null;
}

function rollFromPool(pool, tiers) {
  let random = Math.random() * 100;
  let selectedTier = 1;
  let cumulative = 0;
  for (let t = 1; t <= 6; t++) {
    cumulative += tiers[t].encounterRate;
    if (random <= cumulative) { selectedTier = t; break; }
  }
  const tierPool = pool.filter(m => m.tier === selectedTier);
  return enrichMonster(tierPool[Math.floor(Math.random() * tierPool.length)]);
}

function rollMonster() {
  return rollFromPool(monsters, monsterTiers);
}

function rollHuntMonster() {
  return rollFromPool(huntMonsters, monsterTiers);
}

function rollArtifact() {
  let random = Math.random() * 100;
  let selectedTier = 1;
  let cumulative = 0;

  for (let t = 1; t <= 6; t++) {
    cumulative += artifactTiers[t].dropRate;
    if (random <= cumulative) {
      selectedTier = t;
      break;
    }
  }

  const tierArtifacts = artifacts.filter(a => a.tier === selectedTier);
  return tierArtifacts[Math.floor(Math.random() * tierArtifacts.length)];
}

module.exports = {
  monsterTiers,
  artifactTiers,
  monsters,
  huntMonsters,
  artifacts,
  rollMonster,
  rollHuntMonster,
  rollArtifact,
  findMonster,
  enrichMonster,
};

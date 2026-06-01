// features/enchantsData.js

const enchants = [
  // Original / Base Enchants
  {
    id: "fortune",
    name: "Fortune",
    tier: "Epic",
    chance: "5%",
    ability: "Peluang dapetin bijih/ikan lebih banyak pas mulung/mancing.",
    price: 20000,
    target: "pickaxe"
  },
  {
    id: "lure",
    name: "Lure",
    tier: "Epic",
    chance: "5%",
    ability: "Peluang dapet ikan tier tinggi / barang bagus makin gede.",
    price: 25000,
    target: "pancingan"
  },
  {
    id: "unbreaking",
    name: "Unbreaking",
    tier: "Legend",
    chance: "2.5%",
    ability: "50% kemungkinan durabilitas alat kaga ngurang pas dipake.",
    price: 50000,
    target: "all"
  },
  {
    id: "efficiency",
    name: "Efficiency",
    tier: "Legend",
    chance: "2.5%",
    ability: "Motong cooldown nambang atau mancing sebanyak 20%.",
    price: 60000,
    target: "all"
  },
  {
    id: "haste",
    name: "Haste",
    tier: "Rare",
    chance: "10%",
    ability: "Dapet bonus XP tambahan 50% setiap nambang/mancing.",
    price: 30000,
    target: "all"
  },
  {
    id: "sledgehammer",
    name: "Sledgehammer",
    tier: "Rare",
    chance: "10%",
    ability: "Peluang mendapatkan koin tambahan (Double koin) pas nambang.",
    price: 35000,
    target: "pickaxe"
  },
  {
    id: "magnet",
    name: "Magnet",
    tier: "Rare",
    chance: "10%",
    ability: "Peluang dapet barang/harta karun besi meningkat pas mancing.",
    price: 32000,
    target: "pancingan"
  },
  {
    id: "telekinesis",
    name: "Telekinesis",
    tier: "Legend",
    chance: "2.5%",
    ability: "Bijih hasil mulung otomatis dijual ke pengepul (dapet instan koin).",
    price: 75000,
    target: "pickaxe"
  },
  {
    id: "jackpot",
    name: "Jackpot",
    tier: "Legend",
    chance: "2.5%",
    ability: "Peluang mendapatkan ikan tier tinggi & legendaris meningkat drastis.",
    price: 80000,
    target: "pancingan"
  },
  {
    id: "mending",
    name: "Mending",
    tier: "Void",
    chance: "0.000000000000000000001%",
    ability: "Nambahin/nge-reset durabilitas secara bertahap (+1) setiap kali alat dipake. Jika di weapon, memulihkan +5 HP saat mengalahkan monster.",
    price: 999999999,
    target: "all"
  },

  // Tool / Pickaxe Enchants
  {
    id: "silk_touch",
    name: "Silk Touch",
    tier: "Epic",
    chance: "5%",
    ability: "Mendapatkan block utuh/bijih murni dengan harga jual 1.5x lipat!",
    price: 28000,
    target: "pickaxe"
  },
  {
    id: "curse_of_vanishing",
    name: "Curse of Vanishing",
    tier: "Rare",
    chance: "10%",
    ability: "KUTUKAN: Jika pingsan saat bertarung/kegiatan, alat/gear yang memiliki kutukan ini akan hancur lebur!",
    price: 5000,
    target: "all"
  },

  // Fishing Rod Enchants
  {
    id: "luck_of_the_sea",
    name: "Luck of the Sea",
    tier: "Epic",
    chance: "5%",
    ability: "Meningkatkan peluang dapet buku sihir & harta karun pas mancing (+50% chance).",
    price: 28000,
    target: "pancingan"
  },

  // Weapon Enchants
  {
    id: "sharpness",
    name: "Sharpness",
    tier: "Epic",
    chance: "5%",
    ability: "Meningkatkan damage tebasan senjata sebesar +15%!",
    price: 30000,
    target: "weapon"
  },
  {
    id: "smite",
    name: "Smite",
    tier: "Rare",
    chance: "10%",
    ability: "Meningkatkan damage terhadap monster tipe undead sebesar +30%!",
    price: 20000,
    target: "weapon"
  },
  {
    id: "bane_of_arthropods",
    name: "Bane of Arthropods",
    tier: "Rare",
    chance: "10%",
    ability: "Meningkatkan damage terhadap laba-laba & scorpion sebesar +30%!",
    price: 18000,
    target: "weapon"
  },
  {
    id: "fire_aspect",
    name: "Fire Aspect",
    tier: "Epic",
    chance: "5%",
    ability: "Membakar target, memberikan damage tambahan tiap turn (+10% damage)!",
    price: 35000,
    target: "weapon"
  },
  {
    id: "knockback",
    name: "Knockback",
    tier: "Rare",
    chance: "10%",
    ability: "Peluang 15% mementalkan monster, menggagalkan serangan counter monster turn ini!",
    price: 15000,
    target: "weapon"
  },
  {
    id: "looting",
    name: "Looting",
    tier: "Epic",
    chance: "5%",
    ability: "Meningkatkan jumlah koin yang diperoleh dari drop monster sebesar +25%!",
    price: 40000,
    target: "weapon"
  },
  {
    id: "flame",
    name: "Flame",
    tier: "Epic",
    chance: "5%",
    ability: "Membakar monster saat bertarung, meningkatkan damage sebesar +12%!",
    price: 28000,
    target: "weapon"
  },
  {
    id: "infinity",
    name: "Infinity",
    tier: "Legend",
    chance: "2.5%",
    ability: "Menghilangkan biaya Mana (MP) saat menggunakan skill magic pertarungan!",
    price: 60000,
    target: "weapon"
  },
  {
    id: "power",
    name: "Power",
    tier: "Epic",
    chance: "5%",
    ability: "Meningkatkan damage total senjata sebesar +20%!",
    price: 32000,
    target: "weapon"
  },
  {
    id: "punch",
    name: "Punch",
    tier: "Rare",
    chance: "10%",
    ability: "Peluang 20% membuat monster terkena stun dan melewatkan serangannya!",
    price: 18000,
    target: "weapon"
  },
  {
    id: "multishot",
    name: "Multishot",
    tier: "Legend",
    chance: "2.5%",
    ability: "Peluang 25% menyerang monster 2 kali sekaligus dalam satu turn pertarungan!",
    price: 65000,
    target: "weapon"
  },
  {
    id: "piercing",
    name: "Piercing",
    tier: "Epic",
    chance: "5%",
    ability: "Menembus pertahanan monster, menambahkan +15 flat damage mengabaikan defense!",
    price: 30000,
    target: "weapon"
  },
  {
    id: "quick_charge",
    name: "Quick Charge",
    tier: "Rare",
    chance: "10%",
    ability: "Meningkatkan kelincahan bertarung, memberikan bonus serangan +10% damage!",
    price: 22000,
    target: "weapon"
  },
  {
    id: "channeling",
    name: "Channeling",
    tier: "Epic",
    chance: "5%",
    ability: "Memanggil petir saat bertarung, memberikan +25% magic damage tambahan!",
    price: 35000,
    target: "weapon"
  },
  {
    id: "impaling",
    name: "Impaling",
    tier: "Rare",
    chance: "10%",
    ability: "Meningkatkan damage terhadap cacing tanah & monster bertipe air/marine sebesar +35%!",
    price: 20000,
    target: "weapon"
  },
  {
    id: "loyalty",
    name: "Loyalty",
    tier: "Epic",
    chance: "5%",
    ability: "Jika mencoba kabur (!lari), peluang 50% Anda tidak menerima damage kabur!",
    price: 30000,
    target: "weapon"
  },
  {
    id: "riptide",
    name: "Riptide",
    tier: "Legend",
    chance: "2.5%",
    ability: "Meningkatkan kesuksesan kabur (!lari) dari monster menjadi 80%!",
    price: 70000,
    target: "weapon"
  },

  // Armor Enchants
  {
    id: "protection",
    name: "Protection",
    tier: "Epic",
    chance: "5%",
    ability: "Mengurangi semua damage serangan monster yang diterima sebesar 15%!",
    price: 40000,
    target: "armor"
  },
  {
    id: "blast_protection",
    name: "Blast Protection",
    tier: "Rare",
    chance: "10%",
    ability: "Mengurangi damage serangan monster tipe golem/armor sebesar 30%!",
    price: 22000,
    target: "armor"
  },
  {
    id: "fire_protection",
    name: "Fire Protection",
    tier: "Rare",
    chance: "10%",
    ability: "Mengurangi damage serangan monster tipe api/demon sebesar 30%!",
    price: 20000,
    target: "armor"
  },
  {
    id: "projectile_protection",
    name: "Projectile Protection",
    tier: "Rare",
    chance: "10%",
    ability: "Mengurangi damage serangan monster tipe terbang sebesar 30%!",
    price: 18000,
    target: "armor"
  },
  {
    id: "thorns",
    name: "Thorns",
    tier: "Epic",
    chance: "5%",
    ability: "Memantulkan 20% damage serangan monster kembali ke monster tersebut!",
    price: 35000,
    target: "armor"
  },
  {
    id: "curse_of_binding",
    name: "Curse of Binding",
    tier: "Rare",
    chance: "10%",
    ability: "KUTUKAN: Armor tidak bisa dilepas atau diganti sampai Anda pingsan!",
    price: 5000,
    target: "armor"
  },
  {
    id: "aqua_affinity",
    name: "Aqua Affinity",
    tier: "Rare",
    chance: "10%",
    ability: "Meningkatkan pertahanan saat bertarung melawan monster air (+10 DEF)!",
    price: 20000,
    target: "armor"
  },
  {
    id: "respiration",
    name: "Respiration",
    tier: "Rare",
    chance: "10%",
    ability: "Meningkatkan kapasitas maksimal MP sebesar +15!",
    price: 15000,
    target: "armor"
  },
  {
    id: "depth_strider",
    name: "Depth Strider",
    tier: "Epic",
    chance: "5%",
    ability: "Meningkatkan kelincahan bertarung, memberikan +10% peluang kabur (!lari)!",
    price: 25000,
    target: "armor"
  },
  {
    id: "feather_falling",
    name: "Feather Falling",
    tier: "Epic",
    chance: "5%",
    ability: "Mengurangi denda koin yang hilang saat pingsan sebesar 50%!",
    price: 30000,
    target: "armor"
  },
  {
    id: "frost_walker",
    name: "Frost Walker",
    tier: "Epic",
    chance: "5%",
    ability: "Membekukan pijakan lava, kebal terhadap serangan monster bertipe magma (-25% damage)!",
    price: 28000,
    target: "armor"
  },
  {
    id: "soul_speed",
    name: "Soul Speed",
    tier: "Epic",
    chance: "5%",
    ability: "Meningkatkan kelincahan tempur, menambahkan bonus damage serangan sebesar +10%!",
    price: 32000,
    target: "armor"
  }
];

function rollEnchant(rateMultiplier = 1) {
  const gacha = (Math.random() * 100) / rateMultiplier;
  
  // Mending chance
  if (gacha <= 0.000000000000000000001) return enchants.find(e => e.id === "mending");
  
  // Legend chance (2.5% chance)
  if (gacha <= 2.5) {
    const list = enchants.filter(e => e.tier === "Legend");
    return list[Math.floor(Math.random() * list.length)];
  }
  
  // Epic chance (5% chance: 2.5 to 7.5)
  if (gacha <= 7.5) {
    const list = enchants.filter(e => e.tier === "Epic");
    return list[Math.floor(Math.random() * list.length)];
  }
  
  // Rare chance (10% chance: 7.5 to 17.5)
  if (gacha <= 17.5) {
    const list = enchants.filter(e => e.tier === "Rare");
    return list[Math.floor(Math.random() * list.length)];
  }
  
  return null;
}

module.exports = {
  enchants,
  rollEnchant
};

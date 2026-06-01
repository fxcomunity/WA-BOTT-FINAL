// features/itemsData.js
// Berisi data lengkap untuk sistem RNG Mancing & Nambang

const tiers = {
  1: { id: 1, name: "Common", icon: "⚪", dropRate: 50, reqLevel: 1 },
  2: { id: 2, name: "Uncommon", icon: "🟢", dropRate: 25, reqLevel: 1 },
  3: { id: 3, name: "Rare", icon: "🔵", dropRate: 15, reqLevel: 2 },
  4: { id: 4, name: "Epic", icon: "🟣", dropRate: 7, reqLevel: 3 },
  5: { id: 5, name: "Legendary", icon: "🟡", dropRate: 2.5, reqLevel: 4 },
  6: { id: 6, name: "Mystic", icon: "🔴", dropRate: 0.4, reqLevel: 5 },
  7: { id: 7, name: "Mythos", icon: "🌌", dropRate: 0.1, reqLevel: 5 }
};

const fishingItems = [
  // Tier 1 (Common)
  { id: "ikan_mas", name: "Ikan Mas", tier: 1, price: 15 },
  { id: "ikan_nila", name: "Ikan Mujair/Nila", tier: 1, price: 15 },
  { id: "ikan_lele", name: "Ikan Lele", tier: 1, price: 10 },
  { id: "ikan_teri", name: "Ikan Teri", tier: 1, price: 5 },
  { id: "ikan_kembung", name: "Ikan Kembung", tier: 1, price: 12 },
  
  // Tier 2 (Uncommon)
  { id: "ikan_gurame", name: "Ikan Gurame", tier: 2, price: 60 },
  { id: "ikan_salmon", name: "Ikan Salmon", tier: 2, price: 80 },
  { id: "ikan_tuna", name: "Ikan Tuna", tier: 2, price: 75 },
  { id: "ikan_badut", name: "Ikan Badut (Nemo)", tier: 2, price: 50 },
  { id: "ikan_buntal", name: "Ikan Buntal", tier: 2, price: 70 },
  
  // Tier 3 (Rare)
  { id: "arwana_silver", name: "Arwana Silver", tier: 3, price: 250 },
  { id: "marlin", name: "Ikan Marlin", tier: 3, price: 300 },
  { id: "sturgeon", name: "Ikan Sturgeon", tier: 3, price: 350 },
  { id: "hiu_martil", name: "Hiu Martil", tier: 3, price: 400 },
  { id: "koi_juara", name: "Koi Juara", tier: 3, price: 500 },
  { id: "belut_listrik", name: "Belut Listrik", tier: 3, price: 450 },
  { id: "ikan_pterois", name: "Ikan Pterois (Lionfish)", tier: 3, price: 480 },
  
  // Tier 4 (Epic)
  { id: "arwana_super_red", name: "Arwana Super Red", tier: 4, price: 2000 },
  { id: "hiu_putih", name: "Hiu Putih Besar", tier: 4, price: 2500 },
  { id: "arapaima", name: "Arapaima Gigas", tier: 4, price: 2200 },
  { id: "ikan_dayung", name: "Ikan Dayung", tier: 4, price: 1500 },
  { id: "mola_mola", name: "Mola Mola (Sunfish)", tier: 4, price: 1800 },
  { id: "kraken_tentacle", name: "Tentakel Kraken", tier: 4, price: 2800 },
  { id: "kepiting_raksasa", name: "Kepiting Raja Alaska", tier: 4, price: 2400 },
  { id: "gurita_penyamar", name: "Mimic Octopus", tier: 4, price: 2600 },
  
  // Tier 5 (Legendary)
  { id: "coelacanth", name: "Coelacanth (Ikan Purba)", tier: 5, price: 15000 },
  { id: "alligator_gar", name: "Alligator Gar", tier: 5, price: 12000 },
  { id: "oarfish", name: "Oarfish Raksasa", tier: 5, price: 18000 },
  { id: "hiu_megalodon", name: "Hiu Megalodon", tier: 5, price: 25000 },
  { id: "beluga_sturgeon", name: "Beluga Sturgeon", tier: 5, price: 20000 },
  { id: "ikan_purba_emas", name: "Golden Coelacanth", tier: 5, price: 17500 },
  { id: "hiu_hantu", name: "Ghost Shark", tier: 5, price: 16000 },
  { id: "kraken_baby", name: "Bayi Kraken", tier: 5, price: 19000 },
  
  // Tier 6 (Mystic)
  { id: "ikan_naga", name: "Ikan Naga (Dragonfish)", tier: 6, price: 120000 },
  { id: "ikan_transparan", name: "Glass-Head Barreleye", tier: 6, price: 100000 },
  { id: "magma_carp", name: "Magma Carp", tier: 6, price: 150000 },
  { id: "ikan_hantu", name: "Ghost Knifelike Fish", tier: 6, price: 130000 },
  { id: "crystal_fish", name: "Crystal Abyssal Fish", tier: 6, price: 140000 },
  { id: "abyssal_angler", name: "Anglerfish Purba", tier: 6, price: 110000 },
  { id: "neon_jellyfish", name: "Ubur-ubur Cahaya", tier: 6, price: 135000 },
  
  // Tier 7 (Mythos)
  { id: "leviathan", name: "Leviathan", tier: 7, price: 1500000 },
  { id: "kraken", name: "Kraken", tier: 7, price: 1200000 },
  { id: "abaia", name: "Abaia", tier: 7, price: 1000000 },
  { id: "namazu", name: "Namazu", tier: 7, price: 1800000 },
  { id: "makara", name: "Makara", tier: 7, price: 2000000 },
  { id: "poseidon_trident_fragment", name: "Patahan Trisula Poseidon", tier: 7, price: 2500000 },
  { id: "tiamat", name: "Naga Laut Tiamat", tier: 7, price: 2200000 },
  { id: "neptune_crown", name: "Mahkota Raja Neptunus", tier: 7, price: 3000000 }
];

const miningItems = [
  // Tier 1 (Common)
  { id: "coal", name: "Batu Bara (Coal)", tier: 1, price: 10 },
  { id: "iron", name: "Besi (Iron)", tier: 1, price: 15 },
  { id: "copper", name: "Tembaga (Copper)", tier: 1, price: 12 },
  { id: "sulfur", name: "Belerang (Sulfur)", tier: 1, price: 18 },
  
  // Tier 2 (Uncommon)
  { id: "tin", name: "Timah (Tin)", tier: 2, price: 50 },
  { id: "lead", name: "Timbal (Lead)", tier: 2, price: 55 },
  { id: "silver", name: "Perak (Silver)", tier: 2, price: 80 },
  { id: "aluminum", name: "Bauksit (Aluminum)", tier: 2, price: 60 },
  
  // Tier 3 (Rare)
  { id: "gold", name: "Emas (Gold)", tier: 3, price: 250 },
  { id: "platinum", name: "Platina (Platinum)", tier: 3, price: 300 },
  { id: "titanium", name: "Titanium", tier: 3, price: 400 },
  { id: "uranium", name: "Uranium", tier: 3, price: 500 },
  { id: "batu_akik", name: "Batu Akik Nusantara", tier: 3, price: 450 },
  { id: "amethyst", name: "Kecubung (Amethyst)", tier: 3, price: 480 },
  
  // Tier 4 (Epic)
  { id: "diamond", name: "Intan (Diamond)", tier: 4, price: 2000 },
  { id: "mithril", name: "Mithril", tier: 4, price: 2500 },
  { id: "adamantite", name: "Adamantite", tier: 4, price: 3000 },
  { id: "cobalt", name: "Cobalt", tier: 4, price: 2200 },
  { id: "ruby", name: "Batu Ruby (Merah Delima)", tier: 4, price: 2800 },
  { id: "emerald", name: "Zamrud (Emerald)", tier: 4, price: 2600 },
  { id: "sapphire", name: "Nilam (Sapphire)", tier: 4, price: 2700 },
  
  // Tier 5 (Legendary)
  { id: "orichalcum", name: "Orichalcum", tier: 5, price: 15000 },
  { id: "netherite", name: "Netherite (Ancient Debris)", tier: 5, price: 20000 },
  { id: "obsidian", name: "Obsidian", tier: 5, price: 12000 },
  { id: "meteorite", name: "Meteorite", tier: 5, price: 18000 },
  { id: "star_shard", name: "Pecahan Bintang (Star Shard)", tier: 5, price: 17500 },
  { id: "rainbow_stone", name: "Batu Pelangi", tier: 5, price: 16500 },
  { id: "dark_matter", name: "Dark Matter Ore", tier: 5, price: 19500 },
  
  // Tier 6 (Mystic)
  { id: "eternium", name: "Eternium", tier: 6, price: 150000 },
  { id: "elementium", name: "Elementium", tier: 6, price: 120000 },
  { id: "aether", name: "Aether Crystal", tier: 6, price: 180000 },
  { id: "bloodstone", name: "Bloodstone", tier: 6, price: 130000 },
  { id: "void_ore", name: "Void Ore", tier: 6, price: 140000 },
  { id: "cosmic_debris", name: "Pecahan Komet Cosmic", tier: 6, price: 115000 },
  { id: "neutron_star", name: "Inti Bintang Neutron", tier: 6, price: 145000 },
  
  // Tier 7 (Mythos)
  { id: "uru", name: "Uru Ore", tier: 7, price: 1500000 },
  { id: "hihiirokane", name: "Hihi'irokane", tier: 7, price: 1800000 },
  { id: "celestial", name: "Celestial Ore", tier: 7, price: 2000000 },
  { id: "philosophers", name: "Philosopher's Stone", tier: 7, price: 5000000 },
  { id: "infinity_stone", name: "Infinity Stone Fragment", tier: 7, price: 2500000 },
  { id: "chronos_shard", name: "Pecahan Waktu Chronos", tier: 7, price: 2200000 },
  { id: "star_creator_core", name: "Inti Pembuat Bintang", tier: 7, price: 3200000 }
];

// Combine all for selling and inventory lookup
const allItemsMap = {};
fishingItems.forEach(i => allItemsMap[i.id] = { ...i, category: 'fishing' });
miningItems.forEach(i => allItemsMap[i.id] = { ...i, category: 'mining' });

// Add pure versions of mining items dynamically for Silk Touch
miningItems.forEach(item => {
  const pureId = `pure_${item.id}`;
  allItemsMap[pureId] = {
    id: pureId,
    name: `Bijih Murni ${item.name}`,
    tier: item.tier,
    price: Math.floor(item.price * 1.5),
    category: 'mining'
  };
});

// Juga tambahkan sisa item lama agar player lama tidak hilang uangnya jika jual sisa inventory lama
const legacyItems = {
  "batu": 10, "besi": 50, "emas": 200, "lele": 20, "nila": 50, "mas": 250, "hiu": 1000, "daging_rusa": 100, "daging_macan": 300
};
for (const [id, price] of Object.entries(legacyItems)) {
  if (!allItemsMap[id]) {
    allItemsMap[id] = { id, name: id.toUpperCase(), tier: 1, price, category: 'legacy' };
  }
}

// Roll Function
function rollItem(category, userLevel, hasEnchant) {
  let pool = category === 'fishing' ? fishingItems : miningItems;
  
  // Base chances modifier based on level & enchant
  let chances = {
    1: tiers[1].dropRate,
    2: tiers[2].dropRate,
    3: tiers[3].dropRate,
    4: tiers[4].dropRate,
    5: tiers[5].dropRate,
    6: tiers[6].dropRate,
    7: tiers[7].dropRate
  };

  // Kunci tier berdasarkan level alat
  if (userLevel < 2) { chances[3] = 0; chances[4] = 0; }
  if (userLevel < 3) { chances[4] = 0; chances[5] = 0; }
  if (userLevel < 4) { chances[5] = 0; chances[6] = 0; }
  if (userLevel < 5) { chances[6] = 0; chances[7] = 0; }
  
  // Buff peluang dari alat
  if (userLevel >= 2) { chances[2] += 5; chances[1] -= 5; }
  if (userLevel >= 3) { chances[3] += 5; chances[1] -= 5; }
  if (userLevel >= 4) { chances[4] += 5; chances[1] -= 5; }
  if (userLevel >= 5) { chances[5] += 2; chances[6] += 0.5; chances[7] += 0.1; }

  // Enchantment Buff (Lure / Fortune)
  if (hasEnchant) {
    chances[3] += 5;
    chances[4] += 5;
    if (userLevel >= 4) chances[5] += 2;
    if (userLevel >= 5) { chances[6] += 0.5; chances[7] += 0.2; }
  }
  
  // Calculate total weight and roll
  let totalWeight = 0;
  for (let t = 1; t <= 7; t++) {
    totalWeight += chances[t];
  }
  
  let random = Math.random() * totalWeight;
  let selectedTier = 1;
  let cumulative = 0;
  
  for (let t = 1; t <= 7; t++) {
    cumulative += chances[t];
    if (random <= cumulative) {
      selectedTier = t;
      break;
    }
  }
  
  // Pilih item acak dari tier yang terpilih
  const tierItems = pool.filter(i => i.tier === selectedTier);
  if (tierItems.length === 0) return pool[0]; // fallback
  
  const selectedItem = tierItems[Math.floor(Math.random() * tierItems.length)];
  
  // Hitung persentase murni untuk ditampilkan
  const trueChance = ((chances[selectedTier] / totalWeight) * 100) / tierItems.length;
  
  return {
    item: selectedItem,
    tierData: tiers[selectedTier],
    chanceString: trueChance < 0.1 ? "<0.1%" : trueChance.toFixed(1) + "%"
  };
}

module.exports = {
  tiers,
  fishingItems,
  miningItems,
  allItemsMap,
  rollItem
};

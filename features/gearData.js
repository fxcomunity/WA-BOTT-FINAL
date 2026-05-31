// features/gearData.js — Senjata, Armor, Aksesoris RPG

const weapons = [
  // Common
  { id: "rusty_iron_gladius", name: "Rusty Iron Gladius", tier: 1, baseAtk: 15, bonusAtk: 5, bonusTags: ["slime", "beast"], price: 150 },
  { id: "vanguard_broadsword", name: "Vanguard Broadsword", tier: 1, baseAtk: 35, bonusAtk: 15, bonusTags: ["golem", "armor"], price: 400 },
  // Uncommon
  { id: "steel_falchion", name: "Steel Falchion", tier: 2, baseAtk: 25, bonusAtk: 10, bonusTags: ["beast"], price: 850 },
  { id: "mercenary_cleaver", name: "Mercenary Cleaver", tier: 2, baseAtk: 45, bonusAtk: 15, bonusTags: ["humanoid"], price: 1500 },
  // Rare
  { id: "flame_tongue_sabre", name: "Flame-Tongue Sabre", tier: 3, baseAtk: 120, bonusAtk: 80, bonusTags: ["ice", "plant"], price: 7500 },
  { id: "storm_bringer_rapier", name: "Storm-Bringer Rapier", tier: 3, baseAtk: 140, bonusAtk: 70, bonusTags: ["flying"], price: 9800 },
  // Epic
  { id: "glacial_claymore", name: "Glacial Claymore", tier: 4, baseAtk: 240, bonusAtk: 110, bonusTags: ["fire", "desert"], price: 25000 },
  { id: "vipers_tooth_katana", name: "Viper's Tooth Katana", tier: 4, baseAtk: 180, bonusAtk: 90, bonusTags: ["humanoid", "orc"], price: 32000 },
  // Legendary
  { id: "sun_core_greatsword", name: "Sun-Core Greatsword", tier: 5, baseAtk: 650, bonusAtk: 350, bonusTags: ["undead", "demon"], price: 120000 },
  { id: "zephyr_wingblade", name: "Zephyr Wingblade", tier: 5, baseAtk: 480, bonusAtk: 220, bonusTags: ["slow", "giant"], price: 150000 },
  // Mystic
  { id: "abaddonn_edge", name: "Abaddonn's Edge", tier: 6, baseAtk: 550, bonusAtk: 250, bonusTags: ["boss"], price: 450000 },
  { id: "aetherial_spellblade", name: "Aetherial Spellblade", tier: 6, baseAtk: 500, bonusAtk: 300, bonusTags: ["magic"], price: 500000 },
  // Mythos
  { id: "ragnarok_executioner", name: "Ragnarok Executioner", tier: 7, baseAtk: 2500, bonusAtk: 1500, bonusTags: ["boss", "magic"], price: 9999999 },
  { id: "leviathans_spine", name: "Leviathan's Spine", tier: 7, baseAtk: 2200, bonusAtk: 1300, bonusTags: ["fire", "giant"], price: 7500000 },
  { id: "void_star", name: "Void Star", tier: 7, baseAtk: 3000, bonusAtk: 2000, bonusTags: ["magic", "boss"], price: 8800000 },
];

const armors = [
  { id: "pelt_vest", name: "Pelt Vest", tier: 1, def: 8, maxHpBonus: 15, price: 100 },
  { id: "iron_buckler", name: "Iron Buckler", tier: 1, def: 12, maxHpBonus: 20, price: 250 },
  { id: "hunters_hide", name: "Hunter's Hide", tier: 2, def: 18, maxHpBonus: 35, price: 600 },
  { id: "chainmail_shirt", name: "Chainmail Shirt", tier: 2, def: 25, maxHpBonus: 50, price: 1200 },
  { id: "frostguard_plate", name: "Frostguard Plate", tier: 3, def: 45, maxHpBonus: 80, price: 5500 },
  { id: "windwalker_cloak", name: "Windwalker Cloak", tier: 3, def: 35, maxHpBonus: 60, price: 7000 },
  { id: "molten_aegis", name: "Molten Aegis", tier: 4, def: 70, maxHpBonus: 120, price: 18000 },
  { id: "serpent_scale_mail", name: "Serpent Scale Mail", tier: 4, def: 55, maxHpBonus: 100, price: 22000 },
  { id: "solar_plate", name: "Solar Plate", tier: 5, def: 120, maxHpBonus: 200, price: 85000 },
  { id: "storm_mantle", name: "Storm Mantle", tier: 5, def: 90, maxHpBonus: 150, price: 100000 },
  { id: "abyssal_carapace", name: "Abyssal Carapace", tier: 6, def: 150, maxHpBonus: 250, price: 320000 },
  { id: "arcane_robes", name: "Arcane Robes", tier: 6, def: 80, maxHpBonus: 180, maxMpBonus: 50, price: 350000 },
  { id: "worldbreaker_plate", name: "Worldbreaker Plate", tier: 7, def: 400, maxHpBonus: 500, price: 3500000 },
  { id: "leviathan_hide", name: "Leviathan Hide", tier: 7, def: 350, maxHpBonus: 450, price: 2800000 },
  { id: "void_mantle", name: "Void Mantle", tier: 7, def: 300, maxHpBonus: 400, maxMpBonus: 100, price: 4000000 },
];

const accessories = [
  { id: "lucky_charm", name: "Lucky Charm", tier: 1, goldBonus: 0.05, maxMpBonus: 0, price: 80 },
  { id: "copper_band", name: "Copper Band", tier: 1, goldBonus: 0, maxMpBonus: 5, price: 120 },
  { id: "wolf_fang_pendant", name: "Wolf Fang Pendant", tier: 2, goldBonus: 0, maxMpBonus: 10, beastBonus: 8, price: 700 },
  { id: "silver_ring", name: "Silver Ring", tier: 2, goldBonus: 0, maxMpBonus: 15, price: 1000 },
  { id: "crystal_pendant", name: "Crystal Pendant", tier: 3, goldBonus: 0, maxMpBonus: 20, magicBonus: 15, price: 6000 },
  { id: "dragon_eye", name: "Dragon Eye", tier: 4, goldBonus: 0.08, maxMpBonus: 25, price: 20000 },
  { id: "phoenix_feather", name: "Phoenix Feather", tier: 5, goldBonus: 0.1, maxMpBonus: 40, magicBonus: 30, price: 90000 },
  { id: "boss_hunter_sigil", name: "Boss Hunter Sigil", tier: 6, goldBonus: 0, maxMpBonus: 30, bossBonus: 100, price: 300000 },
  { id: "ragnarok_sigil", name: "Ragnarok Sigil", tier: 7, goldBonus: 0.15, maxMpBonus: 80, bossBonus: 200, price: 5000000 },
];

const tierNames = {
  1: "Common", 2: "Uncommon", 3: "Rare", 4: "Epic",
  5: "Legendary", 6: "Mystic", 7: "Mythos"
};

function sellPrice(buyPrice) {
  return Math.floor(buyPrice * 0.25);
}

function buildShopItems(startId = 24) {
  const items = [];
  let id = startId;

  for (const w of weapons) {
    items.push({
      id: id++,
      name: w.name,
      price: w.price,
      desc: `ATK ${w.baseAtk} (+${w.bonusAtk} vs ${w.bonusTags.join("/")})`,
      type: "weapon",
      itemKey: w.id,
    });
  }
  for (const a of armors) {
    items.push({
      id: id++,
      name: a.name,
      price: a.price,
      desc: `DEF ${a.def} | +${a.maxHpBonus} HP${a.maxMpBonus ? ` | +${a.maxMpBonus} MP` : ""}`,
      type: "armor",
      itemKey: a.id,
    });
  }
  for (const acc of accessories) {
    items.push({
      id: id++,
      name: acc.name,
      price: acc.price,
      desc: `Aksesoris tier ${tierNames[acc.tier]}`,
      type: "accessory",
      itemKey: acc.id,
    });
  }

  return items;
}

function getWeapon(id) { return weapons.find(w => w.id === id); }
function getArmor(id) { return armors.find(a => a.id === id); }
function getAccessory(id) { return accessories.find(a => a.id === id); }
function getGear(id) { return getWeapon(id) || getArmor(id) || getAccessory(id); }

module.exports = {
  weapons, armors, accessories, tierNames,
  buildShopItems, sellPrice,
  getWeapon, getArmor, getAccessory, getGear,
};

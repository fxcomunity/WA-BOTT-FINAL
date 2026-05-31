// features/enchantsData.js

const enchants = [
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
    id: "mending",
    name: "Mending",
    tier: "Void",
    chance: "0.000000000000000000001%",
    ability: "Nambahin / nge-reset durabilitas secara bertahap (+1) setiap kali alat dipake.",
    price: 999999999,
    target: "all"
  }
];

function rollEnchant() {
  const gacha = Math.random() * 100;
  
  // Mending chance
  if (gacha <= 0.000000000000000000001) return enchants.find(e => e.id === "mending");
  // Legend chance
  if (gacha <= 2.5) return enchants.find(e => e.id === (Math.random() > 0.5 ? "unbreaking" : "efficiency"));
  // Epic chance
  if (gacha <= 7.5) return enchants.find(e => e.id === (Math.random() > 0.5 ? "fortune" : "lure"));
  // Rare chance
  if (gacha <= 17.5) return enchants.find(e => e.id === "haste");
  
  return null;
}

module.exports = {
  enchants,
  rollEnchant
};

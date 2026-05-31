// features/economy.js — Sistem Ekonomi Grup (Koin, Level, Daily, Shop)

const config = require("../config");
const db = require('../database/db');
const gearData = require('./gearData');

const baseShop = [
  { id: 1, name: "Badge VIP",             price: 500,   desc: "Status VIP di grup", type: "role" },
  { id: 2, name: "Anti Warn 1x",          price: 300,   desc: "Hapus 1 warn kamu", type: "item" },
  { id: 3, name: "Bypass Slowmode",       price: 200,   desc: "Bypass slow mode 1 jam", type: "item" },
  { id: 4, name: "Stamina Kecil (5 Mnt)", price: 500,   desc: "Reset CD Mancing/Nambang 5 Menit", type: "item", itemKey: "stamina_kecil" },
  { id: 5, name: "Stamina Sedang (10 Mnt)",price: 900,  desc: "Reset CD Mancing/Nambang 10 Menit", type: "item", itemKey: "stamina_sedang" },
  { id: 6, name: "Stamina Besar (20 Mnt)",price: 1500,  desc: "Reset CD Mancing/Nambang 20 Menit", type: "item", itemKey: "stamina_besar" },
  { id: 7, name: "Potion Kecil",          price: 200,   desc: "Memulihkan 30 HP saat Combat", type: "item", itemKey: "potion_kecil" },
  { id: 8, name: "Potion Besar",          price: 500,   desc: "Memulihkan 100 HP saat Combat", type: "item", itemKey: "potion_besar" },
  { id: 9, name: "Mana Potion Kecil",     price: 200,   desc: "Memulihkan 30 MP", type: "item", itemKey: "mana_potion_kecil" },
  { id: 10, name: "Mana Potion Besar",    price: 500,   desc: "Memulihkan 100 MP", type: "item", itemKey: "mana_potion_besar" },
  { id: 11, name: "Pickaxe Besi (Lv.2)",  price: 500,   desc: "Hasil nambang 10-100 koin", type: "pickaxe", level: 2 },
  { id: 12, name: "Pickaxe Emas (Lv.3)",  price: 2500,  desc: "Hasil nambang 100-500 koin", type: "pickaxe", level: 3 },
  { id: 13, name: "Pickaxe Berlian (Lv.4)",price: 10000, desc: "Hasil nambang 500-2000 koin", type: "pickaxe", level: 4 },
  { id: 14, name: "Pickaxe Mythic (Lv.5)",price: 50000, desc: "Hasil nambang 2000-10000 koin", type: "pickaxe", level: 5 },
  { id: 15, name: "Pancingan Fiberglass", price: 800,   desc: "Hasil mancing 25-150 koin", type: "pancingan", level: 2 },
  { id: 16, name: "Pancingan Karbon",     price: 4000,  desc: "Hasil mancing 150-800 koin", type: "pancingan", level: 3 },
  { id: 17, name: "Pancingan Pro Caster", price: 15000, desc: "Hasil mancing 800-3000 koin", type: "pancingan", level: 4 },
  { id: 18, name: "Buku Fortune",         price: 20000, desc: "Peluang dapetin bijih/ikan lebih banyak", type: "enchant", itemKey: "buku_fortune" },
  { id: 19, name: "Buku Lure",            price: 25000, desc: "Peluang dapet ikan tier tinggi / barang bagus", type: "enchant", itemKey: "buku_lure" },
  { id: 20, name: "Buku Unbreaking",      price: 50000, desc: "50% kemungkinan durabilitas alat tidak berkurang", type: "enchant", itemKey: "buku_unbreaking" },
  { id: 21, name: "Buku Efficiency",      price: 60000, desc: "Cooldown mancing/nambang dikurangi 20%", type: "enchant", itemKey: "buku_efficiency" },
  { id: 22, name: "Buku Haste",           price: 30000, desc: "Bonus XP +50% tiap kegiatan", type: "enchant", itemKey: "buku_haste" },
  { id: 23, name: "Buku Mending",         price: 999999999, desc: "Durabilitas pulih perlahan tiap dipake", type: "enchant", itemKey: "buku_mending" }
];

const shop = [...baseShop, ...gearData.buildShopItems(24)];

const itemsData = require('./itemsData');
const BASE_MAX_HP = 100;
const BASE_MAX_MP = 50;

function parseJsonField(val, fallback) {
  try { return typeof val === 'string' ? JSON.parse(val) : (val || fallback); } catch (e) { return fallback; }
}

function applyEquipmentStats(w) {
  let bonusHp = 0;
  let bonusMp = 0;
  if (w.equipment?.armor) {
    const armor = gearData.getArmor(w.equipment.armor);
    if (armor) { bonusHp += armor.maxHpBonus || 0; bonusMp += armor.maxMpBonus || 0; }
  }
  if (w.equipment?.accessory) {
    const acc = gearData.getAccessory(w.equipment.accessory);
    if (acc) bonusMp += acc.maxMpBonus || 0;
  }
  w.maxHp = BASE_MAX_HP + bonusHp;
  w.maxMp = BASE_MAX_MP + bonusMp;
  w.hp = Math.min(w.hp ?? w.maxHp, w.maxHp);
  w.mp = Math.min(w.mp ?? w.maxMp, w.maxMp);
}

function equipGear(w, slot, itemId) {
  if ((w.inventory[itemId] || 0) <= 0) return { ok: false, msg: "❌ Item tidak ada di tas!" };
  const gear = gearData.getGear(itemId);
  if (!gear) return { ok: false, msg: "❌ Item bukan gear yang bisa dipakai!" };

  const expectedSlot = gearData.getWeapon(itemId) ? "weapon" : gearData.getArmor(itemId) ? "armor" : "accessory";
  if (slot !== expectedSlot) {
    return { ok: false, msg: `❌ Item ini dipakai di slot *${expectedSlot}*, bukan ${slot}!` };
  }

  if (!w.equipment) w.equipment = { weapon: null, armor: null, accessory: null };
  const old = w.equipment[slot];
  if (old) w.inventory[old] = (w.inventory[old] || 0) + 1;

  w.inventory[itemId] -= 1;
  w.equipment[slot] = itemId;
  applyEquipmentStats(w);
  return { ok: true, gear };
}

function getDurabilityForLevel(lv) {
  if (lv === 1) return 50;
  if (lv === 2) return 100;
  if (lv === 3) return 200;
  if (lv === 4) return 400;
  if (lv === 5) return 800;
  return 1500;
}

function normalizeDurability(w) {
  if (!w.enchants) w.enchants = {};

  if (w.enchants.pickaxeDurability !== undefined) {
    w.pickaxeDurability = w.enchants.pickaxeDurability;
    w.maxPickaxeDurability = w.enchants.maxPickaxeDurability;
    delete w.enchants.pickaxeDurability;
    delete w.enchants.maxPickaxeDurability;
  }
  if (w.enchants.pancinganDurability !== undefined) {
    w.pancinganDurability = w.enchants.pancinganDurability;
    w.maxPancinganDurability = w.enchants.maxPancinganDurability;
    delete w.enchants.pancinganDurability;
    delete w.enchants.maxPancinganDurability;
  }

  const pickLv = w.pickaxeLevel || 1;
  const pancingLv = w.pancinganLevel || 1;

  if (w.pickaxeDurability == null) w.pickaxeDurability = getDurabilityForLevel(pickLv);
  if (w.maxPickaxeDurability == null) w.maxPickaxeDurability = getDurabilityForLevel(pickLv);
  if (w.pancinganDurability == null) w.pancinganDurability = getDurabilityForLevel(pancingLv);
  if (w.maxPancinganDurability == null) w.maxPancinganDurability = getDurabilityForLevel(pancingLv);

  w.pickaxeDurability = Math.max(0, Math.min(Number(w.pickaxeDurability) || 0, Number(w.maxPickaxeDurability) || 0));
  w.pancinganDurability = Math.max(0, Math.min(Number(w.pancinganDurability) || 0, Number(w.maxPancinganDurability) || 0));
}

function getWallet(sender) {
  let w = db.prepare('SELECT * FROM users WHERE id = ?').get(sender);
  if (!w) {
    w = {
      id: sender,
      coins: 0, level: 1, xp: 0, streak: 0, lastDaily: 0,
      lastMancing: 0, lastBerburu: 0, lastNambang: 0, pickaxeLevel: 1, pancinganLevel: 1,
      inventory: '{}', enchants: '{}',
      hp: 100, maxHp: 100, buffs: '{}', combat: '{}',
      mp: 50, maxMp: 50, skills: '{}',
      pickaxeDurability: 50, maxPickaxeDurability: 50,
      pancinganDurability: 50, maxPancinganDurability: 50,
      equipment: '{}'
    };
    db.prepare(`
      INSERT INTO users (id, coins, level, xp, streak, lastDaily, lastMancing, lastBerburu, lastNambang, pickaxeLevel, pancinganLevel, inventory, enchants, hp, maxHp, buffs, combat, mp, maxMp, skills, pickaxeDurability, maxPickaxeDurability, pancinganDurability, maxPancinganDurability, equipment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(w.id, w.coins, w.level, w.xp, w.streak, w.lastDaily, w.lastMancing, w.lastBerburu, w.lastNambang, w.pickaxeLevel, w.pancinganLevel, w.inventory, w.enchants, w.hp, w.maxHp, w.buffs, w.combat, w.mp, w.maxMp, w.skills, w.pickaxeDurability, w.maxPickaxeDurability, w.pancinganDurability, w.maxPancinganDurability, w.equipment);
  }
  
  try { w.inventory = typeof w.inventory === 'string' ? JSON.parse(w.inventory) : w.inventory; } catch(e) { w.inventory = {}; }
  try { w.enchants = typeof w.enchants === 'string' ? JSON.parse(w.enchants) : w.enchants; } catch(e) { w.enchants = {}; }
  try { w.buffs = typeof w.buffs === 'string' ? JSON.parse(w.buffs) : w.buffs; } catch(e) { w.buffs = {}; }
  try { w.combat = typeof w.combat === 'string' ? JSON.parse(w.combat) : w.combat; } catch(e) { w.combat = {}; }
  try { w.skills = parseJsonField(w.skills, {}); } catch(e) { w.skills = {}; }
  w.equipment = parseJsonField(w.equipment, { weapon: null, armor: null, accessory: null });
  if (!w.equipment || typeof w.equipment !== "object") {
    w.equipment = { weapon: null, armor: null, accessory: null };
  }
  
  if (!w.inventory) w.inventory = {};
  if (!w.enchants) w.enchants = {};
  if (!w.buffs) w.buffs = {};
  if (!w.combat) w.combat = {};
  if (!w.skills) w.skills = {};
  if (w.hp === undefined) w.hp = 100;
  if (w.maxHp === undefined) w.maxHp = 100;
  if (w.mp === undefined) w.mp = 50;
  if (w.maxMp === undefined) w.maxMp = 50;

  normalizeDurability(w);
  applyEquipmentStats(w);

  // Set owner ke unlimited
  const no = sender.split("@")[0];
  if (config.owners.includes(no)) {
    w.coins = 999999999;
    w.level = 999;
    w.xp = 999999999;
    w.pickaxeLevel = 999;
    w.pancinganLevel = 999;
    w.hp = 999999;
    w.maxHp = 999999;
    w.mp = 999999;
    w.maxMp = 999999;
  }
  
  return w;
}

function saveWallet(sender, w) {
  normalizeDurability(w);
  const invStr = JSON.stringify(w.inventory || {});
  const enchStr = JSON.stringify(w.enchants || {});
  const buffsStr = JSON.stringify(w.buffs || {});
  const combatStr = JSON.stringify(w.combat || {});
  const skillsStr = JSON.stringify(w.skills || {});
  const equipStr = JSON.stringify(w.equipment || { weapon: null, armor: null, accessory: null });
  db.prepare(`
    UPDATE users 
    SET coins = ?, level = ?, xp = ?, streak = ?, lastDaily = ?, lastMancing = ?, lastBerburu = ?, lastNambang = ?, pickaxeLevel = ?, pancinganLevel = ?, inventory = ?, enchants = ?, hp = ?, maxHp = ?, buffs = ?, combat = ?, mp = ?, maxMp = ?, skills = ?, pickaxeDurability = ?, maxPickaxeDurability = ?, pancinganDurability = ?, maxPancinganDurability = ?, equipment = ?
    WHERE id = ?
  `).run(w.coins, w.level, w.xp, w.streak, w.lastDaily, w.lastMancing, w.lastBerburu, w.lastNambang, w.pickaxeLevel, w.pancinganLevel || 1, invStr, enchStr, w.hp || 100, w.maxHp || 100, buffsStr, combatStr, w.mp || 50, w.maxMp || 50, skillsStr, w.pickaxeDurability, w.maxPickaxeDurability, w.pancinganDurability, w.maxPancinganDurability, equipStr, sender);
}

function levelUp(wallet) {
  let leveledUp = false;
  while (wallet.xp >= wallet.level * 100) {
    wallet.xp -= wallet.level * 100;
    wallet.level++;
    leveledUp = true;
  }
  return leveledUp;
}

module.exports = {
  getWallet,
  saveWallet,
  getRawWallet(sender) {
    return getWallet(sender);
  },

  addCoins(sender, amount) {
    const w = getWallet(sender);
    w.coins += amount;
    w.xp += amount;
    levelUp(w);
    saveWallet(sender, w);
  },

  async daily(sock, msg, sender) {
    const w = getWallet(sender);
    const now = Date.now();
    const oneDay = 86400000;
    if (now - w.lastDaily < oneDay) {
      const sisa = Math.ceil((oneDay - (now - w.lastDaily)) / 3600000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Sabar napa ngab! Jatah daily lu belom riset. Balik lagi dalam ${sisa} jam.` }, { quoted: msg });
    }
    const isStreak = now - w.lastDaily < oneDay * 2;
    w.streak = isStreak ? w.streak + 1 : 1;
    w.lastDaily = now;
    const bonus = Math.min(w.streak * 10, 100);
    const total = config.dailyCoins + bonus;
    w.coins += total;
    w.xp += total;
    levelUp(w);
    saveWallet(sender, w);
    return sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Gacor kang! Lu dapet jatah preman +${total} koin.\n🔥 Streak: ${w.streak} hari (+${bonus} bonus)\n💰 Total duit lu: ${w.coins} koin`,
    }, { quoted: msg });
  },

  async cekSaldo(sock, msg, sender) {
    const config = require("../config");
    const no = sender.split("@")[0];
    const isOwner = config.owners.includes(no);
    const w = getWallet(sender);
    
    if (isOwner) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `💰 *Isi Kantong Bos Besar (Cheat Mode):*\nDuit: ∞ (Tak Terbatas bos)\nLevel: Max (Dewa)\nXP: ∞\nStreak: ${w.streak} hari\n⛏️ Pickaxe: Max Lv`,
      }, { quoted: msg });
    }

    return sock.sendMessage(msg.key.remoteJid, {
      text: `💰 *Isi Kantong Lu:*\nDuit: ${w.coins} koin\nLevel: ${w.level}\nXP: ${w.xp}/${w.level * 100}\nStreak: ${w.streak} hari\n⛏️ Pickaxe: Lv.${w.pickaxeLevel}`,
    }, { quoted: msg });
  },

  async transfer(sock, msg, sender, args) {
    const config = require("../config");
    const no = sender.split("@")[0];
    const isOwner = config.owners.includes(no);

    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const jumlah = parseInt(args[1]);
    if (!target || !jumlah || jumlah <= 0)
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format lu salah ngab! Ketik: !transfer @user jumlah" }, { quoted: msg });
    
    const sw = getWallet(sender);
    if (!isOwner && sw.coins < jumlah)
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Duit lu miskin, ngapain gaya-gayaan transfer njir!" }, { quoted: msg });
    
    if (!isOwner) sw.coins -= jumlah;
    const targetW = getWallet(target);
    targetW.coins += jumlah;
    saveWallet(sender, sw);
    saveWallet(target, targetW);
    return sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Sedekah berhasil! Lu ngasih ${jumlah} koin ke @${target.split("@")[0]}`,
      mentions: [target],
    }, { quoted: msg });
  },

  async shop(sock, msg) {
    const categories = {
      "role": "👑 ROLE & STATUS",
      "item": "🎒 ITEM UMUM",
      "pickaxe": "⛏️ PERALATAN MULUNG",
      "pancingan": "🎣 PERALATAN MANCING",
      "enchant": "📚 BUKU SIHIR BEKAS",
      "weapon": "⚔️ SENJATA",
      "armor": "🛡️ ARMOR",
      "accessory": "💍 AKSESORIS"
    };
    
    let text = "🛒 *PASAR MALEM BOT*\n\n";
    
    for (const [key, title] of Object.entries(categories)) {
      const items = shop.filter(i => i.type === key);
      if (items.length > 0) {
        text += `\n${title}\n`;
        items.forEach(i => {
          const num = i.id.toString().padStart(2, '0');
          text += `╭─ 🛍️ *[ ${num} ] ${i.name}*\n│  💵 *Harga:* ${i.price.toLocaleString("id-ID")} Gold\n╰─ 💬 _${i.desc}_\n`;
        });
      }
    }
    
    text += "Ketik *!beli [nomor]* buat check out barang (misal: !beli 1).";
    return sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async beli(sock, msg, sender, args) {
    const w = getWallet(sender);
    const itemId = parseInt(args[0]);
    if (!itemId) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format lu salah. Ketik: !beli [nomor_item]" }, { quoted: msg });
    
    const item = shop.find(i => i.id === itemId);
    if (!item) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Barang apaan tuh? Kaga dijual dimari!" }, { quoted: msg });
    
    const config = require("../config");
    const no = sender.split("@")[0];
    const isOwner = config.owners.includes(no);

    if (!isOwner && w.coins < item.price) {
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Duit lu miskin ngab! Harga item ini ${item.price} koin, duit lu cuma ${w.coins} perak.` }, { quoted: msg });
    }

    if (item.type === "pickaxe") {
      if (w.pickaxeLevel >= item.level) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Pickaxe lu udah level segini ato lebih dewa njir!" }, { quoted: msg });
      w.pickaxeLevel = item.level;
      w.pickaxeDurability = (item.level === 1) ? 50 : (item.level === 2 ? 100 : (item.level === 3 ? 200 : (item.level === 4 ? 400 : (item.level === 5 ? 800 : 1500))));
      w.maxPickaxeDurability = w.pickaxeDurability;
      // Clear pickaxe enchants when upgrading
      delete w.enchants["pickaxe_fortune"];
      delete w.enchants["pickaxe_unbreaking"];
      delete w.enchants["pickaxe_efficiency"];
      delete w.enchants["pickaxe_haste"];
      delete w.enchants["pickaxe_mending"];
      
      if (!isOwner) w.coins -= item.price;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Yuhuuu! Lu berhasil beli ${item.name}! Alat dan durabilitas udah direset/diupgrade.` }, { quoted: msg });
    }
    
    if (item.type === "pancingan") {
      if (w.pancinganLevel >= item.level) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Pancingan lu udah level segini ato lebih dewa njir!" }, { quoted: msg });
      w.pancinganLevel = item.level;
      w.pancinganDurability = (item.level === 1) ? 50 : (item.level === 2 ? 100 : (item.level === 3 ? 200 : (item.level === 4 ? 400 : (item.level === 5 ? 800 : 1500))));
      w.maxPancinganDurability = w.pancinganDurability;
      // Clear pancingan enchants when upgrading
      delete w.enchants["pancingan_lure"];
      delete w.enchants["pancingan_unbreaking"];
      delete w.enchants["pancingan_efficiency"];
      delete w.enchants["pancingan_haste"];
      delete w.enchants["pancingan_mending"];
      
      if (!isOwner) w.coins -= item.price;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Yuhuuu! Lu berhasil beli ${item.name}! Alat dan durabilitas udah direset/diupgrade.` }, { quoted: msg });
    }

    if (item.type === "enchant" || item.type === "item") {
      w.inventory[item.itemKey] = (w.inventory[item.itemKey] || 0) + 1;
      if (!isOwner) w.coins -= item.price;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Yuhuuu! Lu berhasil beli ${item.name}!\nCek isi tas lu pake !inv` }, { quoted: msg });
    }

    if (item.type === "weapon" || item.type === "armor" || item.type === "accessory") {
      w.inventory[item.itemKey] = (w.inventory[item.itemKey] || 0) + 1;
      if (!isOwner) w.coins -= item.price;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, {
        text: `✅ *${item.name}* masuk tas!\nEquip pake: *!pakai ${item.itemKey}*\nCek gear di !inv`
      }, { quoted: msg });
    }

    // Role
    if (item.type === "role") {
      if (!isOwner) w.coins -= item.price;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Lu berhasil beli ${item.name}!` }, { quoted: msg });
    }
    
    saveWallet(sender, w);
    return sock.sendMessage(msg.key.remoteJid, { text: `✅ Cakeppp! Lu berhasil bungkus *${item.name}* seharga ${isOwner ? 0 : item.price} koin!` }, { quoted: msg });
  },

  leaderboard(sock, msg, groupId) {
    const limitSystem = require("./limitSystem");
    const sorted = db.prepare('SELECT * FROM users ORDER BY coins DESC LIMIT 10').all();
    if (sorted.length === 0) return sock.sendMessage(msg.key.remoteJid, { text: "Belom ada data ekonomi." }, { quoted: msg });
    const medals = ["🥇", "🥈", "🥉"];
    const text = sorted.map((v, i) => {
      const k = v.id;
      const userLimit = limitSystem.getLimit(k);
      const name = userLimit.name && userLimit.name !== "Unknown" ? userLimit.name : k.split("@")[0];
      return `${medals[i] || `${i + 1}.`} ${name} — ${v.coins} koin (Lv.${v.level})`;
    }).join("\n");
    return sock.sendMessage(msg.key.remoteJid, { text: `🏆 *Leaderboard Koin*\n\n${text}` }, { quoted: msg });
  },
  
  // =====================================
  // MINI RPG SYSTEM
  // =====================================
  async mancing(sock, msg, sender) {
    const w = getWallet(sender);
    if (w.combat && w.combat.active) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Lu lagi digebuk monster njir! Gelut dulu ketik !serang ato kabur pake !lari" }, { quoted: msg });
    
    // Durability check
    if (w.pancinganDurability <= 0) {
      w.pancinganLevel = 1;
      w.pancinganDurability = 50;
      w.maxPancinganDurability = 50;
      delete w.enchants["pancingan_lure"];
      delete w.enchants["pancingan_unbreaking"];
      delete w.enchants["pancingan_efficiency"];
      delete w.enchants["pancingan_haste"];
      delete w.enchants["pancingan_mending"];
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💔 *KRAKK!* Pancingan lu patah njir! Balik lagi jadi pancingan bambu (Lv.1). Beli lagi di !shop kalo mau yang bagusan.` }, { quoted: msg });
    }

    const now = Date.now();
    let cdMultiplier = w.enchants["pancingan_efficiency"] ? 0.8 : 1;
    const cooldown = (5 * 60000) * cdMultiplier; // 5 menit dikurang efisiensi
    
    if (now - w.lastMancing < cooldown) {
      const sisa = Math.ceil((cooldown - (now - w.lastMancing)) / 60000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Kolamnya lagi kering ngab! Ikan abis, tunggu ${sisa} menit lagi yak.` }, { quoted: msg });
    }
    
    w.lastMancing = now;
    
    // Durability logic
    if (w.enchants["pancingan_mending"]) {
      w.pancinganDurability = Math.min(w.maxPancinganDurability, w.pancinganDurability + 1);
    } else {
      let consume = true;
      if (w.enchants["pancingan_unbreaking"] && Math.random() < 0.5) consume = false;
      if (consume) w.pancinganDurability--;
    }

    const gacha = Math.random();
    if (gacha < 0.15) { // 15% fail rate
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: "🎣 Anjay kail lu putus ditarik hiu megalodon! Zonk bos kaga dapet ikan." }, { quoted: msg });
    }

    const isLure = w.enchants["pancingan_lure"];
    const result = itemsData.rollItem('fishing', w.pancinganLevel, isLure);
    const item = result.item;
    const tier = result.tierData;
    
    let namaPancingan = "Bambu (Lv.1)";
    if (w.pancinganLevel == 2) namaPancingan = "Fiberglass (Lv.2)";
    if (w.pancinganLevel == 3) namaPancingan = "Karbon (Lv.3)";
    if (w.pancinganLevel >= 4) namaPancingan = "Pro Caster (Lv.4+)";

    w.inventory[item.id] = (w.inventory[item.id] || 0) + 1;
    
    // Roll Enchant Book (Mancing chance)
    const enchantsData = require('./enchantsData');
    const droppedEnchant = enchantsData.rollEnchant();
    let enchantText = "";
    if (droppedEnchant) {
      w.inventory[`buku_${droppedEnchant.id}`] = (w.inventory[`buku_${droppedEnchant.id}`] || 0) + 1;
      enchantText = `\n\n📘 *GILA LUCK LU DEWA!* Lu nemuin buku sihir: *Buku ${droppedEnchant.name}* (${droppedEnchant.tier})!`;
    }

    // XP
    const xpBonus = w.enchants["pancingan_haste"] ? 1.5 : 1;
    w.xp += Math.floor(item.price * xpBonus);
    levelUp(w);
    saveWallet(sender, w);
    
    const text = `🎣 Mancing mania mantap! Pake *${namaPancingan}*\n\n🐟 *${item.name}*\n📊 Tipe: ${tier.icon} ${tier.name}\n💰 Harga: ${item.price} koin\n🎲 Peluang: ${result.chanceString}${enchantText}\n\n_(Durabilitas: ${w.pancinganDurability}/${w.maxPancinganDurability})_`;
    
    // Notif jika Epic ke atas
    if (item.tier >= 4) {
      await sock.sendMessage(msg.key.remoteJid, { text: `🎉 *GACOR KANG!* @${sender.split('@')[0]} dapet ikan mutan super langka: *${item.name}*!`, mentions: [sender] });
    }
    if (droppedEnchant && droppedEnchant.tier === "Void") {
      await sock.sendMessage(msg.key.remoteJid, { text: `🚨 *WOY DUNIA KIAMAT!* @${sender.split('@')[0]} DAPET BUKU VOID: *${droppedEnchant.name}*! RNG SEJUTA UMAT!`, mentions: [sender] });
    }
    
    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async berburu(sock, msg, sender) {
    const w = getWallet(sender);
    if (w.combat && w.combat.active) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Lu lagi digebuk monster njir! Gelut dulu ketik !serang ato kabur pake !lari" }, { quoted: msg });
    
    const now = Date.now();
    const cooldown = 10 * 60000;
    if (now - w.lastBerburu < cooldown) {
      const sisa = Math.ceil((cooldown - (now - w.lastBerburu)) / 60000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Utan lagi ngeri bos! Binatang pada ngumpet, balik lagi ${sisa} menit.` }, { quoted: msg });
    }
    
    w.lastBerburu = now;

    // 25% encounter monster berburu
    if (Math.random() < 0.25) {
      saveWallet(sender, w);
      const combat = require('./combat');
      return combat.triggerHuntEncounter(sock, msg, sender, w);
    }

    const gacha = Math.random();
    if (gacha < 0.3) {
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `🏹 Bego bet lu malah diseruduk babi ngepet! Lari tunggang langgang, dapet zonk.` }, { quoted: msg });
    }

    let rusa = 0, macan = 0;
    if (gacha < 0.8) rusa = 1;
    else macan = 1;

    if (rusa) w.inventory["daging_rusa"] = (w.inventory["daging_rusa"] || 0) + rusa;
    if (macan) w.inventory["daging_macan"] = (w.inventory["daging_macan"] || 0) + macan;
    
    w.xp += (rusa * 20) + (macan * 100);
    levelUp(w);
    saveWallet(sender, w);

    const hasil = rusa ? "Daging Rusa" : "Daging Macan";
    const text = `🏹 Headshot anjay! Lu berhasil dapet *${hasil}*!\n_(Cek tas dengan !inv)_`;
    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async nambang(sock, msg, sender) {
    const w = getWallet(sender);
    if (w.combat && w.combat.active) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Nambang pala lu peyang, lagi digebuk monster njir! Gelut pake !serang ato kabur !lari" }, { quoted: msg });
    
    // Durability check
    if (w.pickaxeDurability <= 0) {
      w.pickaxeLevel = 1;
      w.pickaxeDurability = 50;
      w.maxPickaxeDurability = 50;
      delete w.enchants["pickaxe_fortune"];
      delete w.enchants["pickaxe_unbreaking"];
      delete w.enchants["pickaxe_efficiency"];
      delete w.enchants["pickaxe_haste"];
      delete w.enchants["pickaxe_mending"];
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💔 *PRANGGG!* Pickaxe lu hancur lebur njir! Balik lagi jadi alat batu (Lv.1). Beli lagi di !shop kalo mau yang bagusan.` }, { quoted: msg });
    }

    const now = Date.now();
    let cdMultiplier = w.enchants["pickaxe_efficiency"] ? 0.8 : 1;
    const cooldown = (5 * 60000) * cdMultiplier; // 5 menit
    
    if (now - w.lastNambang < cooldown) {
      const sisa = Math.ceil((cooldown - (now - w.lastNambang)) / 60000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Tangan lu kapalan nambang mulu! Ngopi dulu sana ${sisa} menit.` }, { quoted: msg });
    }
    
    w.lastNambang = now;
    
    // Durability logic
    if (w.enchants["pickaxe_mending"]) {
      w.pickaxeDurability = Math.min(w.maxPickaxeDurability, w.pickaxeDurability + 1);
    } else {
      let consume = true;
      if (w.enchants["pickaxe_unbreaking"] && Math.random() < 0.5) consume = false;
      if (consume) w.pickaxeDurability--;
    }
    
    // Regenerasi MP & HP (Mata Air Buff)
    w.mp = Math.min(w.maxMp, w.mp + 5); // Regenerasi 5 MP tiap kali nambang
    if (w.buffs["mata_air_leluhur"]) {
      w.hp = Math.min(w.maxHp, w.hp + 10);
    }
    
    // Encounter Check (30% except if repel active)
    let encounterRate = 0.30;
    if (w.buffs["monster_repel"] && w.buffs["monster_repel"].expiresAt > now) {
      encounterRate = 0; // Monster Repel is active
    }
    
    if (Math.random() < encounterRate) {
      saveWallet(sender, w); // Save CD
      const combat = require('./combat');
      return combat.triggerEncounter(sock, msg, sender, w);
    }

    const gacha = Math.random();
    if (gacha < 0.15) {
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: "⛏️ Apes bet, pickaxe lu nyangkut di batu keras! Zonk kaga dapet apa-apa." }, { quoted: msg });
    }

    const isFortune = w.enchants["pickaxe_fortune"];
    const rpgData = require('./rpgData');
    const result = itemsData.rollItem('mining', w.pickaxeLevel, isFortune);
    const item = result.item;
    const tier = result.tierData;
    
    // Check Artifact Drop (Only if they actually got ore)
    let artifactText = "";
    if (Math.random() < 0.20) { // 20% chance to drop artifact instead of/with ore
      const artifact = rpgData.rollArtifact();
      w.inventory[artifact.id] = (w.inventory[artifact.id] || 0) + 1;
      artifactText = `\n🎁 *HOKI SEUMUR IDUP!*\nLu nemu rongsokan dewa: *${artifact.name}* (${rpgData.artifactTiers[artifact.tier].name})`;
    }
    
    // Roll Enchant Book (Nambang chance)
    const enchantsData = require('./enchantsData');
    const droppedEnchant = enchantsData.rollEnchant();
    let enchantText = "";
    if (droppedEnchant) {
      w.inventory[`buku_${droppedEnchant.id}`] = (w.inventory[`buku_${droppedEnchant.id}`] || 0) + 1;
      enchantText = `\n\n📘 *GILA LUCK LU DEWA!* Lu nemuin buku sihir kuno: *Buku ${droppedEnchant.name}* (${droppedEnchant.tier})!`;
    }

    let namaPickaxe = "Batu (Lv.1)";
    if (w.pickaxeLevel == 2) namaPickaxe = "Besi (Lv.2)";
    if (w.pickaxeLevel == 3) namaPickaxe = "Emas (Lv.3)";
    if (w.pickaxeLevel == 4) namaPickaxe = "Berlian (Lv.4)";
    if (w.pickaxeLevel >= 5) namaPickaxe = "Mythic (Lv.5+)";

    w.inventory[item.id] = (w.inventory[item.id] || 0) + 1;
    
    const xpBonus = w.enchants["pickaxe_haste"] ? 1.5 : 1;
    w.xp += Math.floor(item.price * xpBonus);
    levelUp(w);
    saveWallet(sender, w);

    const text = `⛏️ Mulung kelar bos pake *${namaPickaxe}*!\n\n💎 *${item.name}*\n📊 Tipe: ${tier.icon} ${tier.name}\n💰 Harga: ${item.price} koin\n🎲 Peluang: ${result.chanceString}${artifactText}${enchantText}\n\n_(Durabilitas: ${w.pickaxeDurability}/${w.maxPickaxeDurability})_`;
    
    // Notif jika Epic ke atas
    if (item.tier >= 4) {
      await sock.sendMessage(msg.key.remoteJid, { text: `🎉 *NGERIII!* Tangan dewa @${sender.split('@')[0]} dapet dropan langka *${item.name}*!`, mentions: [sender] });
    }
    if (droppedEnchant && droppedEnchant.tier === "Void") {
      await sock.sendMessage(msg.key.remoteJid, { text: `🚨 *WOY DUNIA KIAMAT!* @${sender.split('@')[0]} DAPET BUKU VOID: *${droppedEnchant.name}*! RNG SEJUTA UMAT!`, mentions: [sender] });
    }

    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async inventory(sock, msg, sender) {
    const w = getWallet(sender);
    
    // Status HP & Darah
    let text = `❤️ *NYAWA LU*\n`;
    text += `▪️ Darah (HP): ${w.hp} / ${w.maxHp}\n`;
    text += `▪️ Mana (MP): ${w.mp} / ${w.maxMp}\n`;
    if (w.combat && w.combat.active) {
      text += `⚠️ *LAGI GELUT LAWAN: ${w.combat.monsterName || w.combat.monster}*\n`;
    }
    text += `\n🎒 *ISI TAS LU*\n\n`;
    
    let cats = { fishing: [], mining: [], hunting: [], artifact: [], potion: [], other: [] };
    const rpgData = require('./rpgData');
    let isEmpty = true;
    for (const [itemId, amount] of Object.entries(w.inventory)) {
      if (amount > 0) {
        isEmpty = false;
        const itemData = itemsData.allItemsMap[itemId];
        const artifactData = rpgData.artifacts.find(a => a.id === itemId);
        
        let str = "";
        if (itemData) {
          const tierStr = itemData.tier ? `(${itemsData.tiers[itemData.tier]?.name || 'Legacy'})` : '';
          str = `▪️ ${itemData.name} ${tierStr}: ${amount}\n`;
          if (itemData.category === 'fishing') cats.fishing.push(str);
          else if (itemData.category === 'mining') cats.mining.push(str);
          else if (itemData.category === 'hunting') cats.hunting.push(str);
          else cats.other.push(str);
        } else if (artifactData) {
          str = `▪️ ${artifactData.name} (${rpgData.artifactTiers[artifactData.tier]?.name}): ${amount}\n`;
          cats.artifact.push(str);
        } else if (itemId.includes("potion")) {
          str = `▪️ ${itemId.replace(/_/g, " ").toUpperCase()}: ${amount}\n`;
          cats.potion.push(str);
        } else if (gearData.getGear(itemId)) {
          const g = gearData.getGear(itemId);
          str = `▪️ ${g.name}: ${amount}\n`;
          cats.other.push(str);
        } else {
          str = `▪️ ${itemId.toUpperCase()}: ${amount}\n`;
          cats.other.push(str);
        }
      }
    }
    
    if (isEmpty) {
      text += `_Tas lu kosong isinya angin doang njir._\n`;
    } else {
      if (cats.fishing.length > 0) { text += `🐟 *IKAN BUNTAL (FISHING)*\n${cats.fishing.join('')}\n`; }
      if (cats.mining.length > 0) { text += `⛏️ *HASIL MULUNG BUMI (MINING)*\n${cats.mining.join('')}\n`; }
      if (cats.hunting.length > 0) { text += `🔪 *DAGANGAN HUNTING (HUNTING)*\n${cats.hunting.join('')}\n`; }
      if (cats.artifact.length > 0) { text += `🔮 *ARTEFAK SAKTI (ARTIFACT)*\n${cats.artifact.join('')}\n`; }
      if (cats.potion.length > 0) { text += `🧪 *RAMUAN (POTION)*\n${cats.potion.join('')}\n`; }
      if (cats.other.length > 0) { text += `📦 *LAIN-LAIN*\n${cats.other.join('')}\n`; }
    }

    text += `✨ *SKILL YANG LU PUNYA*\n`;
    const skillsData = require('./skillsData');
    let hasSkill = false;
    for (const [skillId, skillState] of Object.entries(w.skills)) {
      const s = skillsData.skills.find(x => x.id === skillId);
      if (s) {
        text += `▪️ ${s.name} (Lv.${skillState.level || 1})\n`;
        hasSkill = true;
      }
    }
    if (!hasSkill) text += `_Lu belom belajar skill apa-apa. Ketik !skills buat ngecek._\n`;
    
    text += `\n🛠️ *PERALATAN LU*\n`;
    text += `▪️ Pickaxe (Lv.${w.pickaxeLevel}) - Durabilitas: ${w.pickaxeDurability}/${w.maxPickaxeDurability}\n`;
    let pickaxeEnchants = [];
    if (w.enchants["pickaxe_fortune"]) pickaxeEnchants.push("Fortune");
    if (w.enchants["pickaxe_unbreaking"]) pickaxeEnchants.push("Unbreaking");
    if (w.enchants["pickaxe_efficiency"]) pickaxeEnchants.push("Efficiency");
    if (w.enchants["pickaxe_haste"]) pickaxeEnchants.push("Haste");
    if (w.enchants["pickaxe_mending"]) pickaxeEnchants.push("Mending");
    if (pickaxeEnchants.length > 0) text += `   ↳ Enchant: ${pickaxeEnchants.join(', ')}\n`;
    else text += `   ↳ Enchant: Kosong\n`;

    text += `▪️ Pancingan (Lv.${w.pancinganLevel}) - Durabilitas: ${w.pancinganDurability}/${w.maxPancinganDurability}\n`;
    let pancinganEnchants = [];
    if (w.enchants["pancingan_lure"]) pancinganEnchants.push("Lure");
    if (w.enchants["pancingan_unbreaking"]) pancinganEnchants.push("Unbreaking");
    if (w.enchants["pancingan_efficiency"]) pancinganEnchants.push("Efficiency");
    if (w.enchants["pancingan_haste"]) pancinganEnchants.push("Haste");
    if (w.enchants["pancingan_mending"]) pancinganEnchants.push("Mending");
    if (pancinganEnchants.length > 0) text += `   ↳ Enchant: ${pancinganEnchants.join(', ')}\n`;
    else text += `   ↳ Enchant: Kosong\n`;

    text += `\n⚔️ *GEAR COMBAT*\n`;
    const eq = w.equipment || {};
    const wpn = eq.weapon ? gearData.getWeapon(eq.weapon) : null;
    const arm = eq.armor ? gearData.getArmor(eq.armor) : null;
    const acc = eq.accessory ? gearData.getAccessory(eq.accessory) : null;
    text += `▪️ Senjata: ${wpn ? wpn.name : "— (tinju/pickaxe)"}\n`;
    text += `▪️ Armor: ${arm ? `${arm.name} (DEF ${arm.def})` : "—"}\n`;
    text += `▪️ Aksesoris: ${acc ? acc.name : "—"}\n`;
    text += `_Equip: !pakai [id_senjata/armor/aksesoris]_\n`;

    text += `\n✨ *BUFFS AKTIF*\n`;
    let hasEnchant = false;
    
    // Tampilkan Buff jika ada
    const now = Date.now();
    for (const [buffId, buffData] of Object.entries(w.buffs)) {
      if (buffData.expiresAt > now) {
        const sisaMenit = Math.ceil((buffData.expiresAt - now) / 60000);
        text += `▪️ [BUFF] ${buffData.name} (${sisaMenit} menit)\n`;
        hasEnchant = true;
      }
    }

    if (!hasEnchant) text += `_Belom ada buku enchant atau buff aktif._\n`;

    text += `\n💡 _Gunakan !sell [nama_item] [jumlah] untuk menjual barang_\n_Contoh: !sell ikan_mas 5 atau !sell all_`;
    return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },

  async sell(sock, msg, sender, args) {
    if (args.length < 1) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Format lu salah bos!\nContoh: !sell ikan_mas 5\nAtau: !sell all` }, { quoted: msg });
    
    const itemName = args[0].toLowerCase();
    const w = getWallet(sender);
    
    if (itemName === "all") {
      let totalJual = 0;
      let textJual = "";
      for (const [item, amount] of Object.entries(w.inventory)) {
        if (amount > 0 && itemsData.allItemsMap[item]) {
          const harga = itemsData.allItemsMap[item].price * amount;
          totalJual += harga;
          textJual += `▪️ ${amount} ${itemsData.allItemsMap[item].name}: ${harga} koin\n`;
          w.inventory[item] = 0;
        }
      }
      
      if (totalJual === 0) return sock.sendMessage(msg.key.remoteJid, { text: "Tas lu isinya angin doang, mau jualan apaan njir?" }, { quoted: msg });
      
      w.coins += totalJual;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💰 *BORONGAN KELAR BOS*\n\n${textJual}\n*Total Pendapatan:* ${totalJual} koin\n*Saldo Sekarang:* ${w.coins} koin` }, { quoted: msg });
    } else {
      // Find the item
      const foundItem = Object.values(itemsData.allItemsMap).find(i => i.id === itemName || i.name.toLowerCase().includes(itemName));
      const gearItem = gearData.getGear(itemName);
      if (!foundItem && !gearItem) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Barang '${itemName}' fiktif njir! Liat tas lu dulu pake !inv.` }, { quoted: msg });
      
      if (gearItem) {
        const realItemName = gearItem.id;
        const amountToSell = parseInt(args[1]) || 1;
        const currentStock = w.inventory[realItemName] || 0;
        if (currentStock < amountToSell) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Stok ${gearItem.name} cuma ${currentStock}.` }, { quoted: msg });
        const totalHarga = gearData.sellPrice(gearItem.price) * amountToSell;
        w.inventory[realItemName] -= amountToSell;
        w.coins += totalHarga;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `✅ Jual ${amountToSell}x *${gearItem.name}*\n💰 +${totalHarga} koin` }, { quoted: msg });
      }

      const realItemName = foundItem.id;
      const amountToSell = parseInt(args[1]) || 1;
      const currentStock = w.inventory[realItemName] || 0;
      
      if (currentStock < amountToSell) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Halu lu! Stok ${foundItem.name} lu cuma ${currentStock}.` }, { quoted: msg });
      
      const totalHarga = foundItem.price * amountToSell;
      w.inventory[realItemName] -= amountToSell;
      w.coins += totalHarga;
      saveWallet(sender, w);
      
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Laris manis! Lu berhasil jual ${amountToSell} *${foundItem.name}*\n💰 Cuan: ${totalHarga} koin\n*Saldo Sekarang:* ${w.coins} koin` }, { quoted: msg });
    }
  },

  async pakai(sock, msg, sender, args) {
    if (args.length < 1) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Mo pake apaan lu?\n• !pakai [nama_item]\n• !pakai senjata [id]\n• !pakai armor [id]\n• !pakai aksesoris [id]\n• !pakai enchant buku_mending pickaxe` }, { quoted: msg });

    const w = getWallet(sender);
    const sub = args[0].toLowerCase();

    if (sub === "senjata" || sub === "weapon") {
      const itemId = args[1]?.toLowerCase();
      if (!itemId) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Contoh: !pakai senjata rusty_iron_gladius" }, { quoted: msg });
      const result = equipGear(w, "weapon", itemId);
      if (!result.ok) return sock.sendMessage(msg.key.remoteJid, { text: result.msg }, { quoted: msg });
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `⚔️ *${result.gear.name}* terpasang!\nATK ${result.gear.baseAtk} (+${result.gear.bonusAtk} vs monster tertentu)` }, { quoted: msg });
    }

    if (sub === "armor") {
      const itemId = args[1]?.toLowerCase();
      if (!itemId) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Contoh: !pakai armor pelt_vest" }, { quoted: msg });
      const result = equipGear(w, "armor", itemId);
      if (!result.ok) return sock.sendMessage(msg.key.remoteJid, { text: result.msg }, { quoted: msg });
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `🛡️ *${result.gear.name}* terpasang!\nDEF ${result.gear.def} | Max HP ${w.maxHp}` }, { quoted: msg });
    }

    if (sub === "aksesoris" || sub === "accessory") {
      const itemId = args[1]?.toLowerCase();
      if (!itemId) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Contoh: !pakai aksesoris lucky_charm" }, { quoted: msg });
      const result = equipGear(w, "accessory", itemId);
      if (!result.ok) return sock.sendMessage(msg.key.remoteJid, { text: result.msg }, { quoted: msg });
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💍 *${result.gear.name}* terpasang!` }, { quoted: msg });
    }

    // Auto-equip gear by id (weapon > armor > accessory)
    const tryId = args[0].toLowerCase();
    if (gearData.getWeapon(tryId)) {
      const result = equipGear(w, "weapon", tryId);
      if (result.ok) { saveWallet(sender, w); return sock.sendMessage(msg.key.remoteJid, { text: `⚔️ *${result.gear.name}* terpasang!` }, { quoted: msg }); }
    }
    if (gearData.getArmor(tryId)) {
      const result = equipGear(w, "armor", tryId);
      if (result.ok) { saveWallet(sender, w); return sock.sendMessage(msg.key.remoteJid, { text: `🛡️ *${result.gear.name}* terpasang!` }, { quoted: msg }); }
    }
    if (gearData.getAccessory(tryId)) {
      const result = equipGear(w, "accessory", tryId);
      if (result.ok) { saveWallet(sender, w); return sock.sendMessage(msg.key.remoteJid, { text: `💍 *${result.gear.name}* terpasang!` }, { quoted: msg }); }
    }
    
    if (args[0].toLowerCase() === "enchant") {
      if (args.length < 3) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Format salah! Contoh: !pakai enchant buku_mending pickaxe\nAlat bisa: pickaxe atau pancingan` }, { quoted: msg });
      
      const bookName = args[1].toLowerCase();
      const toolName = args[2].toLowerCase();
      
      if (toolName !== "pickaxe" && toolName !== "pancingan") {
        return sock.sendMessage(msg.key.remoteJid, { text: `❌ Alat apaan tuh njir? Cuma bisa dipasang di 'pickaxe' atau 'pancingan'.` }, { quoted: msg });
      }
      
      const qty = w.inventory[bookName] || 0;
      if (qty <= 0) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Mana ada bukunya! Tas lu kosong njir.` }, { quoted: msg });
      
      let enchantKey = bookName.replace("buku_", "");
      w.inventory[bookName]--;
      w.enchants[`${toolName}_${enchantKey}`] = true;
      saveWallet(sender, w);
      
      return sock.sendMessage(msg.key.remoteJid, { text: `✨ BOOM! Enchant *${enchantKey.toUpperCase()}* berhasil ditempa ke *${toolName.toUpperCase()}* lu!\nMakin sakti aja nih alat.` }, { quoted: msg });
    }

    const itemName = args[0].toLowerCase();
    
    const qty = w.inventory[itemName] || 0;
    if (qty <= 0) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Ngigo lu njir? Lu kaga punya ${itemName} di tas!` }, { quoted: msg });
    
    if (itemName === "stamina_kecil") {
      w.inventory[itemName] -= 1;
      w.lastMancing = Math.max(0, w.lastMancing - (5 * 60000));
      w.lastNambang = Math.max(0, w.lastNambang - (5 * 60000));
      w.lastBerburu = Math.max(0, w.lastBerburu - (5 * 60000));
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Berhasil pakai *Stamina Kecil*!\nSemua cooldown kegiatan dipotong 5 Menit.` }, { quoted: msg });
    } else if (itemName === "stamina_sedang") {
      w.inventory[itemName] -= 1;
      w.lastMancing = Math.max(0, w.lastMancing - (10 * 60000));
      w.lastNambang = Math.max(0, w.lastNambang - (10 * 60000));
      w.lastBerburu = Math.max(0, w.lastBerburu - (10 * 60000));
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `⚡ Glekkk! *Stamina Sedang* diteguk...\nCooldown Mancing, Nambang, dan Berburu dikurangin 10 menit.\n(Sisa stamina_sedang lu: ${w.inventory[itemName]})` }, { quoted: msg });
    } else if (itemName === "potion_besar") {
      if (w.hp >= w.maxHp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Darah lu masih pull ngab, ngapain minum ginian!` }, { quoted: msg });
      w.inventory[itemName] -= 1;
      w.hp = Math.min(w.maxHp, w.hp + 100);
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `🧪 Gluk gluk gluk... *Potion Besar* diteguk!\nDarah nambah 100 HP.\n❤️ Darah Sekarang: ${w.hp}/${w.maxHp}` }, { quoted: msg });
    } else if (itemName === "mana_potion_kecil") {
      if (w.mp >= w.maxMp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ MP lu masih full njir, hemat napa!` }, { quoted: msg });
      w.inventory[itemName] -= 1;
      w.mp = Math.min(w.maxMp, w.mp + 30);
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💧 Nyesss... *Mana Potion Kecil* seger!\nMP nambah 30 poin.\n💧 Mana Sekarang: ${w.mp}/${w.maxMp}` }, { quoted: msg });
    } else if (itemName === "mana_potion_besar") {
      if (w.mp >= w.maxMp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ MP lu masih full njir, hemat napa!` }, { quoted: msg });
      w.inventory[itemName] -= 1;
      w.mp = Math.min(w.maxMp, w.mp + 100);
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💧 Nyesss... *Mana Potion Besar* seger!\nMP nambah 100 poin.\n💧 Mana Sekarang: ${w.mp}/${w.maxMp}` }, { quoted: msg });
    } else {
      // Check if it's an artifact that can be used
      const rpgData = require('./rpgData');
      const artifact = rpgData.artifacts.find(a => a.id === itemName);
      if (artifact && artifact.action === "buff") {
        w.inventory[itemName] -= 1;
        const durationMs = artifact.duration * 60000;
        w.buffs[artifact.buff] = {
          name: artifact.name,
          expiresAt: Date.now() + durationMs
        };
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `🌟 Cling! *${artifact.name}* dipake...\nBuff [${artifact.buff}] aktif selama ${artifact.duration} menit.` }, { quoted: msg });
      } else if (artifact && artifact.action === "heal") {
        if (w.hp >= w.maxHp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Darah lu masih pull ngab, ngapain pake ini!` }, { quoted: msg });
        w.inventory[itemName] -= 1;
        w.hp = Math.min(w.maxHp, w.hp + artifact.amount);
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `✨ Aura ijo dari *${artifact.name}* nyerep ke badan lu...\nDarah lu pulih ${artifact.amount} HP.\n❤️ Darah Sekarang: ${w.hp}/${w.maxHp}` }, { quoted: msg });
      } else if (artifact && artifact.action === "instant_ore") {
        w.inventory[itemName] -= 1;
        w.inventory["gold"] = (w.inventory["gold"] || 0) + artifact.amount;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `✨ Lu nancepin *${artifact.name}* ke tanah...\nBOOM! Muncrat ${artifact.amount} Gold ore secara instan!` }, { quoted: msg });
      } else if (artifact && artifact.action === "instant_epic") {
        w.inventory[itemName] -= 1;
        w.hp = 1; // Pingsan
        w.inventory["diamond"] = (w.inventory["diamond"] || 0) + artifact.amount;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `🔔 Teng tong! Tambang rubuh cok!\nLu dapet ${artifact.amount} Diamond, tapi darah sisa 1 HP gegara ketiban batu awkwokwok.` }, { quoted: msg });
      } else if (artifact && artifact.action === "instant_massive") {
        w.inventory[itemName] -= 1;
        w.inventory["coal"] = (w.inventory["coal"] || 0) + artifact.amount;
        w.inventory["iron"] = (w.inventory["iron"] || 0) + artifact.amount;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `📖 Lu komat-kamit baca *${artifact.name}*...\nBuset ada Golem Purba nongol bawain lu ${artifact.amount} coal & iron!` }, { quoted: msg });
      } else if (artifact && artifact.action === "reset_cd") {
        w.inventory[itemName] -= 1;
        w.lastNambang = 0;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `⏳ ZAAAA WARUDO! Cooldown nambang lu di-reset seketika.` }, { quoted: msg });
      } else if (artifact && artifact.action === "heal_status") {
        w.inventory[itemName] -= 1;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `☁️ Nyesss... Lu make *${artifact.name}*, semua racun di badan luntur jadi suci.` }, { quoted: msg });
      }
      
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Lu kaga bisa pake barang ini langsung bambang!` }, { quoted: msg });
    }
  },

  async gacha(sock, msg, sender, args) {
    const groupId = msg.key.remoteJid;
    const w = getWallet(sender);
    const cost = 2000;

    if (w.coins < cost) {
      return sock.sendMessage(groupId, { text: `❌ Duit lu kaga cukup bos! Harga tiket gacha ${cost} koin. Lu cuma punya ${w.coins} koin.` }, { quoted: msg });
    }

    w.coins -= cost;
    saveWallet(sender, w);

    let sentMsg = await sock.sendMessage(groupId, { text: `🎰 *GACHA TIME* 🎰\n💸 Saldo kepotong: -${cost} koin\n\n🎲 [ ⚀ | ⚄ | ⚂ ]\n_Ngocok dadu..._` }, { quoted: msg });
    
    const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 600));
      const d1 = diceFaces[Math.floor(Math.random() * 6)];
      const d2 = diceFaces[Math.floor(Math.random() * 6)];
      const d3 = diceFaces[Math.floor(Math.random() * 6)];
      try {
        await sock.sendMessage(groupId, { text: `🎰 *GACHA TIME* 🎰\n💸 Saldo kepotong: -${cost} Gold\n\n🎲 [ ${d1} | ${d2} | ${d3} ]\n_Muter terus bos..._`, edit: sentMsg.key });
      } catch (e) {}
    }

    const rng = Math.random() * 100;
    let resultText = "";
    
    if (rng <= 50) {
      resultText = `💀 *ZONK ANJIR!* 💀\nLu dapet udara kosong. Sabar bos, bandar emang licik.`;
    } else if (rng <= 80) {
      const winGold = Math.floor(Math.random() * 4900) + 100;
      w.coins += winGold;
      resultText = `💸 *UANG KAGET!* 💸\nLumayan lu dapet *${winGold} koin*!`;
    } else if (rng <= 90) {
      w.inventory["stamina_kecil"] = (w.inventory["stamina_kecil"] || 0) + 1;
      resultText = `⚡ *DAPET ITEM!* ⚡\nLu dapet *1x Stamina Kecil*! Pake !pakai stamina_kecil buat ngurangin cooldown.`;
    } else if (rng <= 98) {
      w.inventory["iron"] = (w.inventory["iron"] || 0) + 2;
      resultText = `📦 *LUMAYAN OKE!* 📦\nLu dapet *2x Iron* dari dalem box!`;
    } else {
      const enchantsData = require('./enchantsData');
      const droppedEnchant = enchantsData.rollEnchant() || { name: "Haste", id: "haste" };
      w.inventory[`buku_${droppedEnchant.id}`] = (w.inventory[`buku_${droppedEnchant.id}`] || 0) + 1;
      resultText = `🎉 *HOKI PARAH BOSKU!* 🎉\nSinar emas muncul dari dalem box! Lu dapet item langka:\n✨ *Buku ${droppedEnchant.name}*`;
    }

    saveWallet(sender, w);

    await new Promise(r => setTimeout(r, 800));
    try {
      await sock.sendMessage(groupId, { text: `🎰 *GACHA TIME* 🎰\n\n🎲 [ ${rng <= 50 ? "⚀ | ⚁ | ⚂" : "⚅ | ⚅ | ⚅"} ]\n\n${resultText}`, edit: sentMsg.key });
    } catch (e) {}
  },

  // Method tambahan untuk API
  getAllWallets() {
    return db.prepare('SELECT * FROM users').all();
  }
};

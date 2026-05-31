// features/economy.js — Sistem Ekonomi Grup (Koin, Level, Daily, Shop)

const config = require("../config");
const db = require('../database/db');
const shop = [
  { id: 1, name: "Badge VIP",             price: 500,   desc: "Status VIP di grup", type: "role" },
  { id: 2, name: "Anti Warn 1x",          price: 300,   desc: "Hapus 1 warn kamu", type: "item" },
  { id: 3, name: "Bypass Slowmode",       price: 200,   desc: "Bypass slow mode 1 jam", type: "item" },
  { id: 4, name: "Pickaxe Besi (Lv.2)",   price: 500,   desc: "Hasil nambang 10-100 koin", type: "pickaxe", level: 2 },
  { id: 5, name: "Pickaxe Emas (Lv.3)",   price: 2500,  desc: "Hasil nambang 100-500 koin", type: "pickaxe", level: 3 },
  { id: 6, name: "Pickaxe Berlian (Lv.4)",price: 10000, desc: "Hasil nambang 500-2000 koin", type: "pickaxe", level: 4 },
  { id: 7, name: "Pickaxe Mythic (Lv.5)", price: 50000, desc: "Hasil nambang 2000-10000 koin", type: "pickaxe", level: 5 },
  { id: 8, name: "Pancingan Fiberglass (Lv.2)", price: 800,  desc: "Hasil mancing 25-150 koin", type: "pancingan", level: 2 },
  { id: 9, name: "Pancingan Karbon (Lv.3)",   price: 4000, desc: "Hasil mancing 150-800 koin", type: "pancingan", level: 3 },
  { id: 10, name: "Pancingan Pro Caster (Lv.4)", price: 15000, desc: "Hasil mancing 800-3000 koin", type: "pancingan", level: 4 },
  { id: 11, name: "Buku Fortune (Pickaxe)", price: 20000, desc: "Hasil nambang bijih lebih banyak", type: "enchant", enchantKey: "fortune" },
  { id: 12, name: "Buku Lure (Pancingan)", price: 25000, desc: "Peluang ikan langka lebih besar", type: "enchant", enchantKey: "lure" },
  { id: 13, name: "Stamina Kecil (5 Menit)", price: 500, desc: "Reset CD Mancing/Nambang 5 Menit", type: "item", itemKey: "stamina_kecil" },
  { id: 14, name: "Stamina Sedang (10 Menit)", price: 900, desc: "Reset CD Mancing/Nambang 10 Menit", type: "item", itemKey: "stamina_sedang" },
  { id: 15, name: "Stamina Besar (20 Menit)", price: 1500, desc: "Reset CD Mancing/Nambang 20 Menit", type: "item", itemKey: "stamina_besar" },
  { id: 16, name: "Potion Kecil", price: 200, desc: "Memulihkan 30 HP saat Combat", type: "item", itemKey: "potion_kecil" },
  { id: 17, name: "Potion Besar", price: 500, desc: "Memulihkan 100 HP saat Combat", type: "item", itemKey: "potion_besar" },
  { id: 18, name: "Mana Potion Kecil", price: 200, desc: "Memulihkan 30 MP", type: "item", itemKey: "mana_potion_kecil" },
  { id: 19, name: "Mana Potion Besar", price: 500, desc: "Memulihkan 100 MP", type: "item", itemKey: "mana_potion_besar" }
];

const itemsData = require('./itemsData');

function getWallet(sender) {
  let w = db.prepare('SELECT * FROM users WHERE id = ?').get(sender);
  if (!w) {
    w = {
      id: sender,
      coins: 0, level: 1, xp: 0, streak: 0, lastDaily: 0,
      lastMancing: 0, lastBerburu: 0, lastNambang: 0, pickaxeLevel: 1, pancinganLevel: 1,
      inventory: '{}', enchants: '{}',
      hp: 100, maxHp: 100, buffs: '{}', combat: '{}',
      mp: 50, maxMp: 50, skills: '{}'
    };
    db.prepare(`
      INSERT INTO users (id, coins, level, xp, streak, lastDaily, lastMancing, lastBerburu, lastNambang, pickaxeLevel, pancinganLevel, inventory, enchants, hp, maxHp, buffs, combat, mp, maxMp, skills)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(w.id, w.coins, w.level, w.xp, w.streak, w.lastDaily, w.lastMancing, w.lastBerburu, w.lastNambang, w.pickaxeLevel, w.pancinganLevel, w.inventory, w.enchants, w.hp, w.maxHp, w.buffs, w.combat, w.mp, w.maxMp, w.skills);
  }
  
  try { w.inventory = typeof w.inventory === 'string' ? JSON.parse(w.inventory) : w.inventory; } catch(e) { w.inventory = {}; }
  try { w.enchants = typeof w.enchants === 'string' ? JSON.parse(w.enchants) : w.enchants; } catch(e) { w.enchants = {}; }
  try { w.buffs = typeof w.buffs === 'string' ? JSON.parse(w.buffs) : w.buffs; } catch(e) { w.buffs = {}; }
  try { w.combat = typeof w.combat === 'string' ? JSON.parse(w.combat) : w.combat; } catch(e) { w.combat = {}; }
  try { w.skills = typeof w.skills === 'string' ? JSON.parse(w.skills) : w.skills; } catch(e) { w.skills = {}; }
  
  if (!w.inventory) w.inventory = {};
  if (!w.enchants) w.enchants = {};
  if (!w.buffs) w.buffs = {};
  if (!w.combat) w.combat = {};
  if (!w.skills) w.skills = {};
  if (w.hp === undefined) w.hp = 100;
  if (w.maxHp === undefined) w.maxHp = 100;
  if (w.mp === undefined) w.mp = 50;
  if (w.maxMp === undefined) w.maxMp = 50;
  
  // Set owner ke unlimited (999999999)
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
  const invStr = JSON.stringify(w.inventory || {});
  const enchStr = JSON.stringify(w.enchants || {});
  const buffsStr = JSON.stringify(w.buffs || {});
  const combatStr = JSON.stringify(w.combat || {});
  const skillsStr = JSON.stringify(w.skills || {});
  db.prepare(`
    UPDATE users 
    SET coins = ?, level = ?, xp = ?, streak = ?, lastDaily = ?, lastMancing = ?, lastBerburu = ?, lastNambang = ?, pickaxeLevel = ?, pancinganLevel = ?, inventory = ?, enchants = ?, hp = ?, maxHp = ?, buffs = ?, combat = ?, mp = ?, maxMp = ?, skills = ?
    WHERE id = ?
  `).run(w.coins, w.level, w.xp, w.streak, w.lastDaily, w.lastMancing, w.lastBerburu, w.lastNambang, w.pickaxeLevel, w.pancinganLevel || 1, invStr, enchStr, w.hp || 100, w.maxHp || 100, buffsStr, combatStr, w.mp || 50, w.maxMp || 50, skillsStr, sender);
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
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Daily sudah diklaim! Coba lagi dalam ${sisa} jam.` }, { quoted: msg });
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
      text: `✅ Daily berhasil! +${total} koin\n🔥 Streak: ${w.streak} hari (+${bonus} bonus)\n💰 Total: ${w.coins} koin`,
    }, { quoted: msg });
  },

  async cekSaldo(sock, msg, sender) {
    const config = require("../config");
    const no = sender.split("@")[0];
    const isOwner = config.owners.includes(no);
    const w = getWallet(sender);
    
    if (isOwner) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `💰 *Saldo Owner (Bebas Hambatan):*\nKoin: ∞ (Tak Terbatas)\nLevel: Max\nXP: ∞\nStreak: ${w.streak} hari\n⛏️ Pickaxe: Max Lv`,
      }, { quoted: msg });
    }

    return sock.sendMessage(msg.key.remoteJid, {
      text: `💰 *Saldo kamu:*\nKoin: ${w.coins}\nLevel: ${w.level}\nXP: ${w.xp}/${w.level * 100}\nStreak: ${w.streak} hari\n⛏️ Pickaxe: Lv.${w.pickaxeLevel}`,
    }, { quoted: msg });
  },

  async transfer(sock, msg, sender, args) {
    const config = require("../config");
    const no = sender.split("@")[0];
    const isOwner = config.owners.includes(no);

    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const jumlah = parseInt(args[1]);
    if (!target || !jumlah || jumlah <= 0)
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format: !transfer @user jumlah" }, { quoted: msg });
    
    const sw = getWallet(sender);
    if (!isOwner && sw.coins < jumlah)
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Koin tidak cukup!" }, { quoted: msg });
    
    if (!isOwner) sw.coins -= jumlah;
    const targetW = getWallet(target);
    targetW.coins += jumlah;
    saveWallet(sender, sw);
    saveWallet(target, targetW);
    return sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Berhasil transfer ${jumlah} koin ke @${target.split("@")[0]}`,
      mentions: [target],
    }, { quoted: msg });
  },

  async shop(sock, msg) {
    const categories = {
      "role": "👑 ROLE & STATUS",
      "item": "🎒 ITEM UMUM",
      "pickaxe": "⛏️ PERALATAN TAMBANG",
      "pancingan": "🎣 PERALATAN PANCING",
      "enchant": "📚 BUKU SIHIR (ENCHANT)"
    };
    
    let text = "🛒 *TOKO BOT*\n\n";
    
    for (const [key, title] of Object.entries(categories)) {
      const items = shop.filter(i => i.type === key);
      if (items.length > 0) {
        text += `*${title}*\n`;
        items.forEach(i => {
          text += `  ${i.id}. ${i.name} — ${i.price} koin\n     _${i.desc}_\n`;
        });
        text += "\n";
      }
    }
    
    text += "Ketik *!beli [nomor]* untuk membeli (misal: !beli 1).";
    return sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async beli(sock, msg, sender, args) {
    const w = getWallet(sender);
    const itemId = parseInt(args[0]);
    if (!itemId) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format salah. Ketik: !beli [nomor_item]" }, { quoted: msg });
    
    const item = shop.find(i => i.id === itemId);
    if (!item) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Item tidak ditemukan!" }, { quoted: msg });
    
    const config = require("../config");
    const no = sender.split("@")[0];
    const isOwner = config.owners.includes(no);

    if (!isOwner && w.coins < item.price) {
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Koinmu tidak cukup! Harga item ini ${item.price} koin, sedangkan saldomu ${w.coins} koin.` }, { quoted: msg });
    }

    if (item.type === "pickaxe") {
      if (w.pickaxeLevel >= item.level) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sudah punya pickaxe level ini atau lebih tinggi!" }, { quoted: msg });
      w.pickaxeLevel = item.level;
    }
    if (item.type === "pancingan") {
      if (w.pancinganLevel >= item.level) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sudah punya pancingan level ini atau lebih tinggi!" }, { quoted: msg });
      w.pancinganLevel = item.level;
    }
    if (item.type === "enchant") {
      if (w.enchants[item.enchantKey]) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Kamu sudah memiliki ${item.name}!` }, { quoted: msg });
      w.enchants[item.enchantKey] = true;
    }
    
    if (item.type === "item" && item.itemKey) {
      w.inventory[item.itemKey] = (w.inventory[item.itemKey] || 0) + 1;
    }

    if (!isOwner) w.coins -= item.price;
    
    saveWallet(sender, w);
    return sock.sendMessage(msg.key.remoteJid, { text: `✅ Berhasil membeli *${item.name}* seharga ${isOwner ? 0 : item.price} koin!` }, { quoted: msg });
  },

  leaderboard(sock, msg, groupId) {
    const limitSystem = require("./limitSystem");
    const sorted = db.prepare('SELECT * FROM users ORDER BY coins DESC LIMIT 10').all();
    if (sorted.length === 0) return sock.sendMessage(msg.key.remoteJid, { text: "Belum ada data ekonomi." }, { quoted: msg });
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
    if (w.combat && w.combat.active) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu tidak bisa melakukan ini saat sedang diserang monster! Ketik !serang atau !lari" }, { quoted: msg });
    
    const now = Date.now();
    const cooldown = 5 * 60000; // 5 menit
    if (now - w.lastMancing < cooldown) {
      const sisa = Math.ceil((cooldown - (now - w.lastMancing)) / 60000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Kolam lagi kosong! Coba lagi mancing dalam ${sisa} menit.` }, { quoted: msg });
    }
    
    w.lastMancing = now;
    const gacha = Math.random();
    if (gacha < 0.15) { // 15% fail rate
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: "🎣 Yahh kailmu putus ditarik hiu! Gagal dapat ikan." }, { quoted: msg });
    }

    const isLure = w.enchants["lure"];
    const result = itemsData.rollItem('fishing', w.pancinganLevel, isLure);
    const item = result.item;
    const tier = result.tierData;
    
    let namaPancingan = "Bambu (Lv.1)";
    if (w.pancinganLevel == 2) namaPancingan = "Fiberglass (Lv.2)";
    if (w.pancinganLevel == 3) namaPancingan = "Karbon (Lv.3)";
    if (w.pancinganLevel >= 4) namaPancingan = "Pro Caster (Lv.4+)";

    w.inventory[item.id] = (w.inventory[item.id] || 0) + 1;
    
    // XP
    w.xp += item.price;
    levelUp(w);
    saveWallet(sender, w);
    
    const text = `🎣 Berhasil mancing dengan *${namaPancingan}*!\n\n🐟 *${item.name}*\n📊 Tipe: ${tier.icon} ${tier.name}\n💰 Harga: ${item.price} koin\n🎲 Peluang: ${result.chanceString}\n\n_(Cek tas dengan !inv)_`;
    
    // Notif jika Epic ke atas
    if (item.tier >= 4) {
      await sock.sendMessage(msg.key.remoteJid, { text: `🎉 *WOAAH!* @${sender.split('@')[0]} baru saja mendapatkan tangkapan super langka: *${item.name}*!`, mentions: [sender] });
    }
    
    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async berburu(sock, msg, sender) {
    const w = getWallet(sender);
    if (w.combat && w.combat.active) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu tidak bisa melakukan ini saat sedang diserang monster! Ketik !serang atau !lari" }, { quoted: msg });
    
    const now = Date.now();
    const cooldown = 10 * 60000; // 10 menit
    if (now - w.lastBerburu < cooldown) {
      const sisa = Math.ceil((cooldown - (now - w.lastBerburu)) / 60000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Hutan lagi berbahaya! Coba berburu lagi dalam ${sisa} menit.` }, { quoted: msg });
    }
    
    w.lastBerburu = now;
    const gacha = Math.random();
    if (gacha < 0.3) {
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `🏹 Kamu diseruduk babi hutan! Kabur lari sampai senjatamu jatuh.` }, { quoted: msg });
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
    const text = `🏹 Tepat sasaran! Kamu berhasil berburu dan mendapatkan *${hasil}*!\n_(Cek tas dengan !inv)_`;
    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async nambang(sock, msg, sender) {
    const w = getWallet(sender);
    if (w.combat && w.combat.active) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu tidak bisa menambang saat sedang diserang monster! Ketik !serang atau !lari" }, { quoted: msg });
    
    const now = Date.now();
    const cooldown = 5 * 60000; // 5 menit
    if (now - w.lastNambang < cooldown) {
      const sisa = Math.ceil((cooldown - (now - w.lastNambang)) / 60000);
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Capek nambang terus! Istirahat dulu selama ${sisa} menit.` }, { quoted: msg });
    }
    
    w.lastNambang = now;
    
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
      return sock.sendMessage(msg.key.remoteJid, { text: "⛏️ Cangkulmu patah kena batu keras! Gagal nambang." }, { quoted: msg });
    }

    const isFortune = w.enchants["fortune"];
    const rpgData = require('./rpgData');
    const result = itemsData.rollItem('mining', w.pickaxeLevel, isFortune);
    const item = result.item;
    const tier = result.tierData;
    
    // Check Artifact Drop (Only if they actually got ore)
    let artifactText = "";
    if (Math.random() < 0.20) { // 20% chance to drop artifact instead of/with ore
      const artifact = rpgData.rollArtifact();
      w.inventory[artifact.id] = (w.inventory[artifact.id] || 0) + 1;
      artifactText = `\n🎁 *BONUS ARTEFAK!*\nKamu menemukan: *${artifact.name}* (${rpgData.artifactTiers[artifact.tier].name})`;
    }
    
    let namaPickaxe = "Batu (Lv.1)";
    if (w.pickaxeLevel == 2) namaPickaxe = "Besi (Lv.2)";
    if (w.pickaxeLevel == 3) namaPickaxe = "Emas (Lv.3)";
    if (w.pickaxeLevel == 4) namaPickaxe = "Berlian (Lv.4)";
    if (w.pickaxeLevel >= 5) namaPickaxe = "Mythic (Lv.5+)";

    w.inventory[item.id] = (w.inventory[item.id] || 0) + 1;
    
    w.xp += item.price;
    levelUp(w);
    saveWallet(sender, w);

    const text = `⛏️ Selesai menambang dengan *${namaPickaxe}*!\n\n💎 *${item.name}*\n📊 Tipe: ${tier.icon} ${tier.name}\n💰 Harga: ${item.price} koin\n🎲 Peluang: ${result.chanceString}${artifactText}\n\n_(Cek tas dengan !inv)_`;
    
    // Notif jika Epic ke atas
    if (item.tier >= 4) {
      await sock.sendMessage(msg.key.remoteJid, { text: `🎉 *JACKPOT!* @${sender.split('@')[0]} berhasil menambang *${item.name}*!`, mentions: [sender] });
    }

    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
  },

  async inventory(sock, msg, sender) {
    const w = getWallet(sender);
    
    // Status HP & Darah
    let text = `❤️ *STATUS KAMU*\n`;
    text += `▪️ Darah (HP): ${w.hp} / ${w.maxHp}\n`;
    text += `▪️ Mana (MP): ${w.mp} / ${w.maxMp}\n`;
    if (w.combat && w.combat.active) {
      text += `⚠️ *SEDANG BERTARUNG MELAWAN: ${w.combat.monster}*\n`;
    }
    text += `\n🎒 *INVENTORY KAMU*\n\n`;
    
    let isEmpty = true;
    for (const [itemId, amount] of Object.entries(w.inventory)) {
      if (amount > 0) {
        const itemData = itemsData.allItemsMap[itemId];
        if (itemData) {
          const tierStr = itemData.tier ? `(${itemsData.tiers[itemData.tier]?.name || 'Legacy'})` : '';
          text += `▪️ ${itemData.name} ${tierStr}: ${amount}\n`;
        } else {
          text += `▪️ ${itemId.toUpperCase()}: ${amount}\n`;
        }
        isEmpty = false;
      }
    }
    if (isEmpty) text += `_Tas kamu kosong melompong._\n`;
    
    text += `\n✨ *ENCHANTMENTS & BUFFS*\n`;
    let hasEnchant = false;
    if (w.enchants["fortune"]) { text += `▪️ Fortune (Pickaxe)\n`; hasEnchant = true; }
    if (w.enchants["lure"]) { text += `▪️ Lure (Pancingan)\n`; hasEnchant = true; }
    
    // Tampilkan Buff jika ada
    const now = Date.now();
    for (const [buffId, buffData] of Object.entries(w.buffs)) {
      if (buffData.expiresAt > now) {
        const sisaMenit = Math.ceil((buffData.expiresAt - now) / 60000);
        text += `▪️ [BUFF] ${buffData.name} (${sisaMenit} menit)\n`;
        hasEnchant = true;
      }
    }

    if (!hasEnchant) text += `_Belum ada buku enchant atau buff aktif._\n`;

    text += `\n💡 _Gunakan !sell [nama_item] [jumlah] untuk menjual barang_\n_Contoh: !sell ikan_mas 5 atau !sell all_`;
    return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },

  async sell(sock, msg, sender, args) {
    if (args.length < 1) return sock.sendMessage(msg.key.remoteJid, { text: `Format salah!\nContoh: !sell ikan_mas 5\nAtau: !sell all` }, { quoted: msg });
    
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
      
      if (totalJual === 0) return sock.sendMessage(msg.key.remoteJid, { text: "Tas kamu kosong, tidak ada yang bisa dijual." }, { quoted: msg });
      
      w.coins += totalJual;
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💰 *BERHASIL MENJUAL SEMUA BARANG*\n\n${textJual}\n*Total Pendapatan:* ${totalJual} koin\n*Saldo Sekarang:* ${w.coins} koin` }, { quoted: msg });
    } else {
      // Find the item
      const foundItem = Object.values(itemsData.allItemsMap).find(i => i.id === itemName || i.name.toLowerCase().includes(itemName));
      if (!foundItem) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Item '${itemName}' tidak ditemukan di database. Pastikan nama sesuai !inv` }, { quoted: msg });
      
      const realItemName = foundItem.id;
      const amountToSell = parseInt(args[1]) || 1;
      const currentStock = w.inventory[realItemName] || 0;
      
      if (currentStock < amountToSell) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Gagal! Kamu cuma punya ${currentStock} ${foundItem.name}.` }, { quoted: msg });
      
      const totalHarga = foundItem.price * amountToSell;
      w.inventory[realItemName] -= amountToSell;
      w.coins += totalHarga;
      saveWallet(sender, w);
      
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Berhasil menjual ${amountToSell} *${foundItem.name}*\n💰 Pendapatan: ${totalHarga} koin\n*Saldo Sekarang:* ${w.coins} koin` }, { quoted: msg });
    }
  },

  async pakai(sock, msg, sender, args) {
    if (args.length < 1) return sock.sendMessage(msg.key.remoteJid, { text: `Ketik barang yang mau dipakai!\nContoh: !pakai stamina_kecil` }, { quoted: msg });
    
    const itemName = args[0].toLowerCase();
    const w = getWallet(sender);
    
    const qty = w.inventory[itemName] || 0;
    if (qty <= 0) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Kamu tidak punya ${itemName} di tas!` }, { quoted: msg });
    
    if (itemName === "stamina_kecil") {
      w.inventory[itemName] -= 1;
      w.lastMancing = Math.max(0, w.lastMancing - (5 * 60000));
      w.lastNambang = Math.max(0, w.lastNambang - (5 * 60000));
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `⚡ Menggunakan *Stamina Kecil*!\nCooldown Mancing dan Nambang dikurangi 5 menit.\n(Sisa stamina_kecil kamu: ${w.inventory[itemName]})` }, { quoted: msg });
    } else if (itemName === "stamina_sedang") {
      w.inventory[itemName] -= 1;
      w.lastMancing = Math.max(0, w.lastMancing - (10 * 60000));
      w.lastNambang = Math.max(0, w.lastNambang - (10 * 60000));
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `⚡ Menggunakan *Stamina Sedang*!\nCooldown Mancing dan Nambang dikurangi 10 menit.\n(Sisa stamina_sedang kamu: ${w.inventory[itemName]})` }, { quoted: msg });
    } else if (itemName === "potion_besar") {
      if (w.hp >= w.maxHp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Darah kamu masih penuh!` }, { quoted: msg });
      w.inventory[itemName] -= 1;
      w.hp = Math.min(w.maxHp, w.hp + 100);
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `🧪 Menggunakan *Potion Besar*!\nDarah dipulihkan 100 HP.\n❤️ Darah Sekarang: ${w.hp}/${w.maxHp}` }, { quoted: msg });
    } else if (itemName === "mana_potion_kecil") {
      if (w.mp >= w.maxMp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Mana (MP) kamu masih penuh!` }, { quoted: msg });
      w.inventory[itemName] -= 1;
      w.mp = Math.min(w.maxMp, w.mp + 30);
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💧 Menggunakan *Mana Potion Kecil*!\nMana dipulihkan 30 MP.\n💧 Mana Sekarang: ${w.mp}/${w.maxMp}` }, { quoted: msg });
    } else if (itemName === "mana_potion_besar") {
      if (w.mp >= w.maxMp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Mana (MP) kamu masih penuh!` }, { quoted: msg });
      w.inventory[itemName] -= 1;
      w.mp = Math.min(w.maxMp, w.mp + 100);
      saveWallet(sender, w);
      return sock.sendMessage(msg.key.remoteJid, { text: `💧 Menggunakan *Mana Potion Besar*!\nMana dipulihkan 100 MP.\n💧 Mana Sekarang: ${w.mp}/${w.maxMp}` }, { quoted: msg });
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
        return sock.sendMessage(msg.key.remoteJid, { text: `🌟 Menggunakan *${artifact.name}*!\nBuff [${artifact.buff}] aktif selama ${artifact.duration} menit.` }, { quoted: msg });
      } else if (artifact && artifact.action === "heal") {
        if (w.hp >= w.maxHp) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Darah kamu masih penuh!` }, { quoted: msg });
        w.inventory[itemName] -= 1;
        w.hp = Math.min(w.maxHp, w.hp + artifact.amount);
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `✨ Menggunakan *${artifact.name}*!\nDarah dipulihkan ${artifact.amount} HP.\n❤️ Darah Sekarang: ${w.hp}/${w.maxHp}` }, { quoted: msg });
      } else if (artifact && artifact.action === "instant_ore") {
        w.inventory[itemName] -= 1;
        w.inventory["gold"] = (w.inventory["gold"] || 0) + artifact.amount;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `✨ Menggunakan *${artifact.name}*!\nTanah bergetar dan menghasilkan ${artifact.amount} Gold ore secara instan.` }, { quoted: msg });
      } else if (artifact && artifact.action === "instant_epic") {
        w.inventory[itemName] -= 1;
        w.hp = 1; // Pingsan
        w.inventory["diamond"] = (w.inventory["diamond"] || 0) + artifact.amount;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `🔔 Lonceng berbunyi! Tambang runtuh!\nKamu mendapatkan ${artifact.amount} Diamond, namun darahmu tersisa 1 HP akibat tertimpa batu.` }, { quoted: msg });
      } else if (artifact && artifact.action === "instant_massive") {
        w.inventory[itemName] -= 1;
        w.inventory["coal"] = (w.inventory["coal"] || 0) + artifact.amount;
        w.inventory["iron"] = (w.inventory["iron"] || 0) + artifact.amount;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `📖 Membaca *${artifact.name}*...\nSebuah Golem Purba muncul dan menggali ${artifact.amount} coal & iron secara instan ke tasmu!` }, { quoted: msg });
      } else if (artifact && artifact.action === "reset_cd") {
        w.inventory[itemName] -= 1;
        w.lastNambang = 0;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Waktu berputar mundur! Cooldown nambang kamu telah di-reset.` }, { quoted: msg });
      } else if (artifact && artifact.action === "heal_status") {
        w.inventory[itemName] -= 1;
        saveWallet(sender, w);
        return sock.sendMessage(msg.key.remoteJid, { text: `☁️ Menggunakan *${artifact.name}*!\nSemua efek racun dan status buruk telah dihilangkan.` }, { quoted: msg });
      }
      
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Item ${itemName} tidak bisa dipakai secara langsung.` }, { quoted: msg });
    }
  },

  // Method tambahan untuk API
  getAllWallets() {
    return db.prepare('SELECT * FROM users').all();
  }
};

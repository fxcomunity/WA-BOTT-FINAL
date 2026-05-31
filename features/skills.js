// features/skills.js
const db = require('../database/db');
const economy = require('./economy');
const skillsData = require('./skillsData');
const rpgData = require('./rpgData');

// Helper untuk format waktu
function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

// 1. COMMAND: !skills (Lihat daftar skill yang dimiliki & bisa dipelajari)
async function listSkills(sock, msg, sender) {
  const w = economy.getWallet(sender);
  
  let text = `📜 *BUKU SKILL TAMBANG*\n\n`;
  text += `💧 Mana (MP): ${w.mp}/${w.maxMp}\n\n`;

  // Skill yang sudah dipelajari
  text += `✅ *Skill Aktif (Dimiliki):*\n`;
  let hasLearned = false;
  for (const [skillId, skillState] of Object.entries(w.skills)) {
    const s = skillsData.skills.find(x => x.id === skillId);
    if (s) {
      hasLearned = true;
      const now = Date.now();
      const currentLevel = skillState.level || 1;
      const lvlData = s.levels[currentLevel - 1];
      
      let statusStr = "READY";
      if (skillState.lastUsed && (now - skillState.lastUsed < lvlData.cooldownMs)) {
        statusStr = `CD: ${formatTime(lvlData.cooldownMs - (now - skillState.lastUsed))}`;
      }
      text += `▪️ *${s.name} (Lv.${currentLevel})* - ${lvlData.mpCost} MP [${statusStr}]\n`;
      text += `  _Efek: ${lvlData.desc}_\n`;

      // Next level info
      if (currentLevel < 5) {
        const nextData = s.levels[currentLevel];
        let reqs = [];
        if (nextData.reqLevel) reqs.push(`Mining Lv.${nextData.reqLevel}`);
        if (nextData.reqGold) reqs.push(`${nextData.reqGold} Gold`);
        if (nextData.reqItem) reqs.push(`${nextData.reqItem.amount}x ${nextData.reqItem.id}`);
        text += `  🆙 _Next Lv: ${reqs.join(', ')} (!levelup ${s.id})_\n`;
      } else {
        text += `  ⭐ _Level Max_\n`;
      }
    }
  }
  if (!hasLearned) text += `_Belum ada skill yang dipelajari._\n`;

  // Skill yang bisa dipelajari (belum dimiliki)
  text += `\n🛒 *Bisa Dipelajari (!belajar nama_skill):*\n`;
  let canLearn = false;
  for (const s of skillsData.skills) {
    if (!w.skills[s.id]) {
      canLearn = true;
      const lvl1 = s.levels[0];
      text += `▪️ *${s.name}*\n  Syarat: `;
      let reqs = [];
      if (lvl1.reqLevel) reqs.push(`Mining Lv.${lvl1.reqLevel}`);
      if (lvl1.reqGold) reqs.push(`${lvl1.reqGold} Gold`);
      if (lvl1.reqItem) reqs.push(`${lvl1.reqItem.amount}x ${lvl1.reqItem.id}`);
      text += reqs.length > 0 ? reqs.join(', ') : s.source;
      text += `\n`;
    }
  }

  await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

// 2. COMMAND: !belajar (Pelajari skill baru ke Level 1)
async function belajar(sock, msg, sender, args) {
  if (args.length < 1) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format lu salah ngab! Ketik: !belajar <nama_skill>\nContoh: !belajar ledakan terkendali" }, { quoted: msg });
  }

  const query = args.join(" ").toLowerCase();
  const s = skillsData.skills.find(x => x.name.toLowerCase() === query || x.id === query);

  if (!s) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Skill apaan tuh? Ga nemu! Cek !skills dah." }, { quoted: msg });
  }

  const w = economy.getWallet(sender);

  if (w.skills[s.id]) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Lu udah tamat belajar skill ini ngab! Ketik !levelup buat nge-upgrade." }, { quoted: msg });
  }

  const lvl1 = s.levels[0];

  // Cek syarat Level 1
  if (lvl1.reqLevel && w.level < lvl1.reqLevel) {
    return sock.sendMessage(msg.key.remoteJid, { text: `❌ Level Mining lu masih ampas! Minimal butuh Level ${lvl1.reqLevel} bos.` }, { quoted: msg });
  }
  if (lvl1.reqGold && w.coins < lvl1.reqGold) {
    return sock.sendMessage(msg.key.remoteJid, { text: `❌ Duit lu kurang miskin! Butuh ${lvl1.reqGold} koin.` }, { quoted: msg });
  }
  if (lvl1.reqItem) {
    const itemStock = w.inventory[lvl1.reqItem.id] || 0;
    if (itemStock < lvl1.reqItem.amount) {
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Bahan lu kurang ngab! Butuh ${lvl1.reqItem.amount}x ${lvl1.reqItem.id} di tas.` }, { quoted: msg });
    }
  }

  // Proses bayar
  if (lvl1.reqGold) w.coins -= lvl1.reqGold;
  if (lvl1.reqItem) w.inventory[lvl1.reqItem.id] -= lvl1.reqItem.amount;

  // Pelajari Level 1
  w.skills[s.id] = { lastUsed: 0, level: 1 };
  economy.saveWallet(sender, w);

  return sock.sendMessage(msg.key.remoteJid, { text: `🎉 *CAKEPPP!* Lu berhasil tamatin buku skill:\n\n✨ *${s.name} (Lv.1)*\n📖 _${lvl1.desc}_\n\nPake skillnya ketik: *!skill ${s.id}*` }, { quoted: msg });
}

// 3. COMMAND: !levelup (Upgrade skill)
async function levelupSkill(sock, msg, sender, args) {
  if (args.length < 1) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format salah bos! Ketik: !levelup <nama_skill>" }, { quoted: msg });
  }

  const query = args.join(" ").toLowerCase();
  const s = skillsData.skills.find(x => x.name.toLowerCase() === query || x.id === query);

  if (!s) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Skill apaan tuh? Ga nemu." }, { quoted: msg });
  }

  const w = economy.getWallet(sender);

  if (!w.skills[s.id]) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Lu aja belom belajar skill ini! Ketik !belajar dulu gih." }, { quoted: msg });
  }

  const currentLevel = w.skills[s.id].level || 1;
  if (currentLevel >= 5) {
    return sock.sendMessage(msg.key.remoteJid, { text: "⭐ Udah max level (Lv.5) bro! Gak bisa di-upgrade lagi." }, { quoted: msg });
  }

  const nextLevelData = s.levels[currentLevel]; // array index is 0-based, so currentLevel corresponds to the next level's index

  // Cek syarat Next Level
  if (nextLevelData.reqLevel && w.level < nextLevelData.reqLevel) {
    return sock.sendMessage(msg.key.remoteJid, { text: `❌ Level Mining lu masih cupu! Minimal Level ${nextLevelData.reqLevel}.` }, { quoted: msg });
  }
  if (nextLevelData.reqGold && w.coins < nextLevelData.reqGold) {
    return sock.sendMessage(msg.key.remoteJid, { text: `❌ Duit lu ga cukup bang! Butuh ${nextLevelData.reqGold} koin.` }, { quoted: msg });
  }
  if (nextLevelData.reqItem) {
    const itemStock = w.inventory[nextLevelData.reqItem.id] || 0;
    if (itemStock < nextLevelData.reqItem.amount) {
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Bahan kurang! Lu butuh ${nextLevelData.reqItem.amount}x ${nextLevelData.reqItem.id} di tas.` }, { quoted: msg });
    }
  }

  // Proses bayar
  if (nextLevelData.reqGold) w.coins -= nextLevelData.reqGold;
  if (nextLevelData.reqItem) w.inventory[nextLevelData.reqItem.id] -= nextLevelData.reqItem.amount;

  // Upgrade
  w.skills[s.id].level = currentLevel + 1;
  economy.saveWallet(sender, w);

  return sock.sendMessage(msg.key.remoteJid, { text: `🎉 *GACOR KANG!*\n\n✨ *${s.name}* lu naik ke *Level ${w.skills[s.id].level}*!\n📖 _${nextLevelData.desc}_` }, { quoted: msg });
}


// 4. COMMAND: !skill (Gunakan skill)
async function useSkill(sock, msg, sender, args) {
  if (args.length < 1) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format lu salah ngab: !skill <nama_skill>" }, { quoted: msg });
  }

  const query = args.join(" ").toLowerCase();
  const s = skillsData.skills.find(x => x.name.toLowerCase() === query || x.id === query);

  if (!s) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Skill apaan tuh? Cek !skills dulu." }, { quoted: msg });
  }

  const w = economy.getWallet(sender);

  // Check if learned
  if (!w.skills[s.id]) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Lu belom belajar skill ini njir! Ketik !belajar" }, { quoted: msg });
  }

  const currentLevel = w.skills[s.id].level || 1;
  const lvlData = s.levels[currentLevel - 1];

  // Check Cooldown
  const now = Date.now();
  if (now - w.skills[s.id].lastUsed < lvlData.cooldownMs) {
    const sisa = lvlData.cooldownMs - (now - w.skills[s.id].lastUsed);
    return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *${s.name}* masih cooldown woy! Sabar ${formatTime(sisa)} lagi.` }, { quoted: msg });
  }

  // Check MP
  if (w.mp < lvlData.mpCost) {
    return sock.sendMessage(msg.key.remoteJid, { text: `💧 MP lu abis ngab! Butuh ${lvlData.mpCost} MP, sisa lu cuma ${w.mp}/${w.maxMp}. Nambang/minum pot sana!` }, { quoted: msg });
  }

  // ==============================
  // APPLY SKILL EFFECTS BASED ON LEVEL
  // ==============================
  w.mp -= lvlData.mpCost;
  w.skills[s.id].lastUsed = now;
  let replyText = `🪄 *Mengeluarkan Skill: ${s.name} (Lv.${currentLevel})*\n(-${lvlData.mpCost} MP)\n\n`;

  if (s.id === "deteksi_harta") {
    // Di Level berapapun dapat instant artifact (Lv 5 ada buff, tapi buff belum diimplementasi detail)
    const artifact = rpgData.rollArtifact();
    w.inventory[artifact.id] = (w.inventory[artifact.id] || 0) + 1;
    let extraText = "Mata batinmu terbuka! Kamu mendeteksi energi artefak...\n";
    if (currentLevel >= 2) extraText += "📍 (Jarak: Sekitar 20m)\n";
    if (currentLevel >= 3) extraText += "🧭 (Arah: Timur Laut)\n";
    if (currentLevel >= 4) extraText += `🔮 (Tingkat: ${rpgData.artifactTiers[artifact.tier].name})\n`;
    if (currentLevel >= 5) {
      w.buffs["deteksi_harta"] = { name: "Deteksi Harta Lv5", expiresAt: now + (10 * 60000) };
      extraText += "🌟 Buff +5% Artifact Drop aktif selama 10 menit!\n";
    }
    replyText += `${extraText}🎁 Mendapatkan: *${artifact.name}*`;
  } 
  else if (s.id === "ledakan_terkendali") {
    let amount = Math.floor(Math.random() * 16) + 15; // Base 15-30
    if (currentLevel >= 2) amount += 5;
    if (currentLevel >= 3) amount += 10;
    if (currentLevel >= 4) amount += 15;
    if (currentLevel >= 5) amount += 25;

    w.inventory["iron"] = (w.inventory["iron"] || 0) + amount;
    w.inventory["coal"] = (w.inventory["coal"] || 0) + amount;
    
    let failChance = 0.20;
    if (currentLevel === 2) failChance = 0.15;
    if (currentLevel === 3) failChance = 0.10;
    if (currentLevel === 4) failChance = 0.05;
    if (currentLevel === 5) failChance = 0.00;

    const isFail = Math.random() < failChance;
    if (isFail) {
      replyText += `💥 *BOOOM!!!* Ledakan tak terkendali!\nPickaxe kamu sedikit rusak (tapi belum ada durability). `;
    } else {
      replyText += `💥 *BOOOM!!!* Dinding tambang runtuh dengan sempurna!\nKamu memungut ${amount} Iron dan ${amount} Coal.`;
    }

    if (currentLevel >= 5 && Math.random() < 0.10) {
      w.inventory["diamond"] = (w.inventory["diamond"] || 0) + 2;
      replyText += `\n💎 *JACKPOT!* Ledakan Lv5 menemukan 2 Diamond!`;
    }
  }
  else if (s.id === "penyelarasan_kristal") {
    let ratio = 10;
    if (currentLevel === 3) ratio = 8;
    if (currentLevel === 4) ratio = 5;
    if (currentLevel === 5) ratio = 3;

    if ((w.inventory["iron"] || 0) >= ratio) {
      w.inventory["iron"] -= ratio;
      w.inventory["gold"] = (w.inventory["gold"] || 0) + 1;
      replyText += `✨ ${ratio} Besi melebur menjadi 1 Emas (Gold)!`;
    } else if ((w.inventory["coal"] || 0) >= ratio) {
      w.inventory["coal"] -= ratio;
      w.inventory["gold"] = (w.inventory["gold"] || 0) + 1;
      replyText += `✨ ${ratio} Batu Bara melebur menjadi 1 Emas (Gold)!`;
    } else {
      w.mp += lvlData.mpCost;
      w.skills[s.id].lastUsed = 0;
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Gagal! Kamu butuh minimal ${ratio} Besi atau ${ratio} Batu Bara di tas.` }, { quoted: msg });
    }

    if (currentLevel >= 5 && Math.random() < 0.05) {
      w.inventory["gold"] += 1;
      replyText += `\n🌟 *BONUS LV5!* Kamu mendapatkan 1 Emas tambahan!`;
    }
  }
  else if (s.id === "sentuhan_transmutasi") {
    if (currentLevel >= 5) {
      w.inventory["gold"] = (w.inventory["gold"] || 0) + 1;
      replyText += `🔮 Bebatuan di tanganmu berubah menjadi 1 Emas (Gold)!`;
    } else if (currentLevel >= 4 && Math.random() < 0.10) {
      w.inventory["gold"] = (w.inventory["gold"] || 0) + 1;
      replyText += `🔮 *LUCKY!* Bebatuan di tanganmu berubah menjadi 1 Emas (Gold)!`;
    } else if (currentLevel >= 3 && Math.random() < 0.15) {
      w.inventory["silver"] = (w.inventory["silver"] || 0) + 1;
      replyText += `🔮 Bebatuan di tanganmu berubah menjadi 1 Perak (Silver)!`;
    } else {
      w.inventory["copper"] = (w.inventory["copper"] || 0) + 5;
      replyText += `🔮 Bebatuan di tanganmu berubah menjadi 5 Tembaga (Copper)!`;
    }
  }
  else if (s.id === "penggalian_mistis") {
    w.lastNambang = 0;
    replyText += `⏳ Aura magis menyelimutimu. Cooldown !nambang direset!`;
    if (currentLevel >= 2) w.buffs["penggalian_mistis"] = { level: currentLevel, expiresAt: now + (10 * 60000) }; // buff tracking for extra ore
    if (currentLevel >= 5 && Math.random() < 0.10) {
      w.inventory["diamond"] = (w.inventory["diamond"] || 0) + 1;
      replyText += `\n💎 *MISTIS LV5!* Ada 1 Diamond jatuh dari langit!`;
    }
  }
  else if (s.id === "gempa_magma") {
    let multiplier = 1.0;
    if (currentLevel === 2) multiplier = 1.4;
    if (currentLevel === 3) multiplier = 1.5;
    if (currentLevel === 4) multiplier = 1.75;
    if (currentLevel === 5) multiplier = 2.0;

    let amount = Math.floor(50 * multiplier);
    if (currentLevel >= 3 && Math.random() < 0.20) amount *= 2; // chance double
    if (currentLevel >= 4 && Math.random() < 0.30) amount *= 2; 
    if (currentLevel >= 5 && Math.random() < 0.50) amount *= 2;

    w.inventory["diamond"] = (w.inventory["diamond"] || 0) + amount;
    w.inventory["mithril"] = (w.inventory["mithril"] || 0) + amount;
    replyText += `🌋 *GEMPA MAGMA!* Batuan cair mendingin dan meninggalkan ${amount} Diamond & ${amount} Mithril!!`;
  }
  else if (s.id === "void_mining") {
    let failChance = 0.10;
    if (currentLevel === 2) failChance = 0.08;
    if (currentLevel === 3) failChance = 0.05;
    if (currentLevel === 4) failChance = 0.03;
    if (currentLevel === 5) failChance = 0.00;

    if (Math.random() < failChance) {
      if (w.inventory["diamond"] > 0) {
        w.inventory["diamond"] -= 1;
        replyText += `🕳️ Portal hampa terbuka... Kamu kehilangan 1 Diamond karena tersedot ke Void.`;
      } else {
        replyText += `🕳️ Hampa menolakmu, tidak ada hasil kali ini.`;
      }
    } else {
      let mythosChance = 0;
      if (currentLevel === 3) mythosChance = 0.01;
      if (currentLevel === 4) mythosChance = 0.03;
      if (currentLevel === 5) mythosChance = 0.05;

      if (Math.random() < mythosChance) {
        w.inventory["mythical_ore"] = (w.inventory["mythical_ore"] || 0) + 1;
        replyText += `🕳️ *VOID MYTHOS!* Kamu menarik keluar 1 Mythical Ore!`;
      } else {
        let loot = 1;
        if (currentLevel >= 2) loot = Math.floor(Math.random() * 2) + 2; // 2-3 item
        w.inventory["mithril"] = (w.inventory["mithril"] || 0) + (10 * loot);
        w.inventory["diamond"] = (w.inventory["diamond"] || 0) + (5 * loot);
        replyText += `🕳️ Portal hampa memuntahkan ${10 * loot} Mithril dan ${5 * loot} Diamond!`;
      }
    }
  }
  else if (s.id === "sentuhan_dewa") {
    let qty = 1;
    if (currentLevel >= 3 && Math.random() < 0.25) qty = 2;
    if (currentLevel >= 4 && Math.random() < 0.50) qty = 2;
    if (currentLevel >= 5) qty = 2; // Selalu double

    w.inventory["mythical_ore"] = (w.inventory["mythical_ore"] || 0) + qty;
    replyText += `☄️ Tanganmu memancarkan cahaya surgawi...\nBerhasil menciptakan ${qty} *Mythical Ore*!`;
  }
  else if (s.type === "buff") {
    // Buff type skills
    let durationMins = 5;
    if (s.id === "panggilan_golem") {
      if (currentLevel === 1) durationMins = 0.5; // 30s
      if (currentLevel === 2) durationMins = 0.66; // 40s
      if (currentLevel === 3) durationMins = 0.83; // 50s
      if (currentLevel === 4) durationMins = 1; // 60s
      if (currentLevel === 5) durationMins = 1.5; // 90s
    }
    if (s.id === "animasi_tambang") {
      if (currentLevel === 1) durationMins = 1;
      if (currentLevel === 2) durationMins = 1.5;
      if (currentLevel === 3) durationMins = 2;
      if (currentLevel === 4) durationMins = 2.5;
      if (currentLevel === 5) durationMins = 3;
    }
    if (s.id === "pertahanan_karang") {
      durationMins = 15; // Base durasi buff perisai
    }

    w.buffs[s.id] = {
      name: s.name,
      level: currentLevel,
      expiresAt: now + (durationMins * 60000)
    };
    replyText += `🌟 ${lvlData.desc}`;
  }

  economy.saveWallet(sender, w);
  await sock.sendMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });
}

module.exports = {
  listSkills,
  belajar,
  levelupSkill,
  useSkill
};

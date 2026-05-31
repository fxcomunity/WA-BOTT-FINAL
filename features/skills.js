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
      let statusStr = "READY";
      if (skillState.lastUsed && (now - skillState.lastUsed < s.cooldownMs)) {
        statusStr = `CD: ${formatTime(s.cooldownMs - (now - skillState.lastUsed))}`;
      }
      text += `▪️ *${s.name}* (${s.mpCost} MP) [${statusStr}]\n`;
    }
  }
  if (!hasLearned) text += `_Belum ada skill yang dipelajari._\n`;

  // Skill yang bisa dipelajari (belum dimiliki)
  text += `\n🛒 *Bisa Dipelajari (!belajar nama_skill):*\n`;
  let canLearn = false;
  for (const s of skillsData.skills) {
    if (!w.skills[s.id]) {
      canLearn = true;
      text += `▪️ *${s.name}*\n  Syarat: `;
      let reqs = [];
      if (s.reqLevel) reqs.push(`Lv.${s.reqLevel}`);
      if (s.reqGold) reqs.push(`${s.reqGold} Gold`);
      if (s.reqItem) reqs.push(`1x ${s.reqItem.id}`);
      text += reqs.length > 0 ? reqs.join(', ') : s.source;
      text += `\n`;
    }
  }

  await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

// 2. COMMAND: !belajar (Pelajari skill baru)
async function belajar(sock, msg, sender, args) {
  if (args.length < 1) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format: !belajar <nama_skill>\nContoh: !belajar ledakan terkendali" }, { quoted: msg });
  }

  const query = args.join(" ").toLowerCase();
  const s = skillsData.skills.find(x => x.name.toLowerCase() === query || x.id === query);

  if (!s) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Skill tidak ditemukan. Cek !skills" }, { quoted: msg });
  }

  const w = economy.getWallet(sender);

  if (w.skills[s.id]) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sudah mempelajari skill ini!" }, { quoted: msg });
  }

  // Cek syarat
  if (s.reqLevel && w.level < s.reqLevel) {
    return sock.sendMessage(msg.key.remoteJid, { text: `❌ Level Mining kamu kurang! Butuh Level ${s.reqLevel}.` }, { quoted: msg });
  }
  if (s.reqGold && w.coins < s.reqGold) {
    return sock.sendMessage(msg.key.remoteJid, { text: `❌ Koin kamu kurang! Butuh ${s.reqGold} koin.` }, { quoted: msg });
  }
  if (s.reqItem) {
    const itemStock = w.inventory[s.reqItem.id] || 0;
    if (itemStock < s.reqItem.amount) {
      return sock.sendMessage(msg.key.remoteJid, { text: `❌ Kamu butuh ${s.reqItem.amount}x ${s.reqItem.id} di tas!` }, { quoted: msg });
    }
  }

  // Proses bayar
  if (s.reqGold) w.coins -= s.reqGold;
  if (s.reqItem) w.inventory[s.reqItem.id] -= s.reqItem.amount;

  // Pelajari
  w.skills[s.id] = { lastUsed: 0 };
  economy.saveWallet(sender, w);

  return sock.sendMessage(msg.key.remoteJid, { text: `🎉 *SELAMAT!* Kamu berhasil mempelajari skill magis:\n\n✨ *${s.name}*\n📖 _${s.desc}_\n\nGunakan dengan mengetik: *!skill ${s.id}*` }, { quoted: msg });
}

// 3. COMMAND: !skill (Gunakan skill)
async function useSkill(sock, msg, sender, args) {
  if (args.length < 1) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format: !skill <nama_skill>" }, { quoted: msg });
  }

  const query = args.join(" ").toLowerCase();
  const s = skillsData.skills.find(x => x.name.toLowerCase() === query || x.id === query);

  if (!s) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Skill tidak ditemukan." }, { quoted: msg });
  }

  const w = economy.getWallet(sender);

  // Check if learned
  if (!w.skills[s.id]) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu belum mempelajari skill ini! Ketik !belajar" }, { quoted: msg });
  }

  // Check Cooldown
  const now = Date.now();
  if (now - w.skills[s.id].lastUsed < s.cooldownMs) {
    const sisa = s.cooldownMs - (now - w.skills[s.id].lastUsed);
    return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Skill *${s.name}* sedang cooldown! Tunggu ${formatTime(sisa)} lagi.` }, { quoted: msg });
  }

  // Check MP
  if (w.mp < s.mpCost) {
    return sock.sendMessage(msg.key.remoteJid, { text: `💧 Mana (MP) kamu tidak cukup! Butuh ${s.mpCost} MP.\nSisa MP kamu: ${w.mp}/${w.maxMp}` }, { quoted: msg });
  }

  // ==============================
  // APPLY SKILL EFFECTS
  // ==============================
  w.mp -= s.mpCost;
  w.skills[s.id].lastUsed = now;
  let replyText = `🪄 *Mengeluarkan Skill: ${s.name}*\n(-${s.mpCost} MP)\n\n`;

  if (s.id === "deteksi_harta") {
    const artifact = rpgData.rollArtifact();
    w.inventory[artifact.id] = (w.inventory[artifact.id] || 0) + 1;
    replyText += `Mata batinmu terbuka! Kamu mendeteksi energi artefak dari dinding...\n🎁 Mendapatkan: *${artifact.name}* (${rpgData.artifactTiers[artifact.tier].name})`;
  } 
  else if (s.id === "ledakan_terkendali") {
    // 15-30 coal/iron/copper
    const amount = Math.floor(Math.random() * 16) + 15;
    w.inventory["iron"] = (w.inventory["iron"] || 0) + amount;
    w.inventory["coal"] = (w.inventory["coal"] || 0) + amount;
    replyText += `💥 *BOOOM!!!* Dinding tambang runtuh!\nKamu memungut ${amount} Iron dan ${amount} Coal dari puing-puing.`;
  }
  else if (s.id === "penyelarasan_kristal") {
    if ((w.inventory["iron"] || 0) >= 10) {
      w.inventory["iron"] -= 10;
      w.inventory["gold"] = (w.inventory["gold"] || 0) + 1;
      replyText += `✨ 10 Besi melebur dan mengkristal menjadi 1 Emas (Gold)!`;
    } else if ((w.inventory["coal"] || 0) >= 10) {
      w.inventory["coal"] -= 10;
      w.inventory["gold"] = (w.inventory["gold"] || 0) + 1;
      replyText += `✨ 10 Batu Bara melebur dan mengkristal menjadi 1 Emas (Gold)!`;
    } else {
      // Restore MP & CD since fail
      w.mp += s.mpCost;
      w.skills[s.id].lastUsed = 0;
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal! Kamu butuh minimal 10 Besi atau 10 Batu Bara di tas." }, { quoted: msg });
    }
  }
  else if (s.id === "sentuhan_transmutasi") {
    w.inventory["copper"] = (w.inventory["copper"] || 0) + 5;
    replyText += `🔮 Bebatuan di tanganmu berubah menjadi 5 Tembaga (Copper)!`;
  }
  else if (s.id === "penggalian_mistis") {
    w.lastNambang = 0;
    replyText += `⏳ Aura magis menyelimutimu. Cooldown !nambang telah direset sepenuhnya!`;
  }
  else if (s.id === "gempa_magma") {
    const amount = 50;
    w.inventory["diamond"] = (w.inventory["diamond"] || 0) + amount;
    w.inventory["mithril"] = (w.inventory["mithril"] || 0) + amount;
    replyText += `🌋 *GEMPA MAGMA!* Gunung bergetar hebat!\nBatuan cair mendingin dan meninggalkan ${amount} Diamond & ${amount} Mithril!!`;
  }
  else if (s.id === "void_mining") {
    const failChance = Math.random();
    if (failChance < 0.10) {
      // Hilang 1 item acak yang mahal
      if (w.inventory["diamond"] > 0) {
        w.inventory["diamond"] -= 1;
        replyText += `🕳️ Portal hampa terbuka... Namun tidak stabil!\nKamu kehilangan 1 Diamond karena tersedot ke Void.`;
      } else {
        replyText += `🕳️ Portal hampa terbuka... Namun tidak stabil!\nHampa menolakmu, tidak ada hasil kali ini.`;
      }
    } else {
      const artifact = rpgData.rollArtifact(); // Anggap aja Legend/Mythos
      w.inventory[artifact.id] = (w.inventory[artifact.id] || 0) + 1;
      w.inventory["mithril"] = (w.inventory["mithril"] || 0) + 10;
      replyText += `🕳️ Kamu merogoh ke dalam Void...\nKamu menarik keluar 10 Mithril dan sebuah *${artifact.name}*!`;
    }
  }
  else if (s.id === "sentuhan_dewa") {
    w.inventory["mythical_ore"] = (w.inventory["mythical_ore"] || 0) + 1;
    replyText += `☄️ Tanganmu memancarkan cahaya surgawi...\nKamu berhasil menciptakan 1 *Mythical Ore*!`;
  }
  else if (s.type === "buff") {
    // Buff type skills
    let durationMins = 5;
    if (s.id === "panggilan_golem") durationMins = 10;
    if (s.id === "pertahanan_karang" || s.id === "animasi_tambang") durationMins = 15;

    w.buffs[s.id] = {
      name: s.name,
      expiresAt: now + (durationMins * 60000)
    };
    replyText += `🌟 ${s.desc}`;
  }

  economy.saveWallet(sender, w);
  await sock.sendMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });
}

module.exports = {
  listSkills,
  belajar,
  useSkill
};

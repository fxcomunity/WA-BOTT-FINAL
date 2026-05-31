// features/combat.js
const db = require('../database/db');
const economy = require('./economy');
const rpgData = require('./rpgData');

function getPlayerDamage(pickaxeLevel) {
  switch (pickaxeLevel) {
    case 1: return Math.floor(Math.random() * 11) + 10; // 10-20
    case 2: return Math.floor(Math.random() * 21) + 20; // 20-40
    case 3: return Math.floor(Math.random() * 31) + 40; // 40-70
    case 4: return Math.floor(Math.random() * 51) + 70; // 70-120
    default: return Math.floor(Math.random() * 131) + 120; // 120-250
  }
}

async function triggerEncounter(sock, msg, sender, wallet) {
  const monster = rpgData.rollMonster();
  
  // Set combat state
  wallet.combat = {
    active: true,
    monsterId: monster.id,
    monsterName: monster.name,
    monsterHp: monster.hp,
    monsterMaxHp: monster.maxHp,
    monsterDamage: monster.damage,
    turn: 1,
    statusEffects: []
  };
  
  economy.getRawWallet = () => wallet; // Temporary override to force save
  // Actually, we should call economy.saveWallet directly but economy module is loaded.
  // Wait, we need to save the wallet. We will do it in the caller (economy.js).
  
  const text = `⚠️ *AWAS!* Saat sedang menambang, kamu diserang oleh:\n\n` +
               `👹 *${monster.name}* (Tier ${monster.tier})\n` +
               `❤️ HP Monster: ${monster.hp}/${monster.maxHp}\n\n` +
               `⚔️ _Apa yang akan kamu lakukan?_\n` +
               `Ketik:\n` +
               `👉 *!serang* (Maju lawan)\n` +
               `👉 *!lari* (Kabur, peluang berhasil 50%)\n` +
               `👉 *!potion* (Minum Potion +30 HP)`;
               
  await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  return wallet;
}

async function serang(sock, msg, sender) {
  let w = economy.getRawWallet(sender);
  if (!w.combat || !w.combat.active) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sedang tidak bertarung dengan monster apapun." }, { quoted: msg });
  }

  const combat = w.combat;
  let playerDmg = getPlayerDamage(w.pickaxeLevel);
  
  // Buff Tulang Naga Kerdil (+5 damage)
  if (w.buffs["damage_plus_5"] && w.buffs["damage_plus_5"].expiresAt > Date.now()) {
    playerDmg += 5;
  }

  let text = `⚔️ Kamu menyerang *${combat.monsterName}* dan menghasilkan *${playerDmg}* damage!\n`;
  combat.monsterHp -= playerDmg;

  if (combat.monsterHp <= 0) {
    // Menang
    const mData = rpgData.monsters.find(m => m.id === combat.monsterId);
    const goldDrop = Math.floor(Math.random() * (mData.dropGold[1] - mData.dropGold[0] + 1)) + mData.dropGold[0];
    
    w.coins += goldDrop;
    w.inventory[mData.dropItem] = (w.inventory[mData.dropItem] || 0) + 1;
    
    text += `\n🎉 *${combat.monsterName} TELAH DIKALAHKAN!*\n`;
    text += `💰 Mendapat: ${goldDrop} Koin\n`;
    text += `📦 Mendapat: 1x ${mData.dropItem.toUpperCase()}\n`;
    
    w.combat = { active: false };
    
    // Custom logic: Lich Penambang (Curse)
    if (combat.monsterId === "lich_penambang") {
      text += `\n✨ Kutukan Lich menghilang karena kamu menang!`;
    }

  } else {
    // Monster menyerang balik
    let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];
    
    text += `\n👹 *${combat.monsterName}* menyerang balik dan menghasilkan *${monsterDmg}* damage!\n`;
    w.hp -= monsterDmg;

    if (w.hp <= 0) {
      // Kalah / Mati
      const penalty = Math.floor(w.coins * 0.1);
      w.coins -= penalty;
      w.hp = 10; // Reset ke 10 HP
      w.combat = { active: false };
      
      text += `\n☠️ *KAMU PINGSAN!*\n`;
      text += `Darahmu habis saat melawan ${combat.monsterName}.\n`;
      text += `💸 Kamu kehilangan *${penalty} koin* untuk biaya perawatan klinik.\n`;
      text += `(Darah direstorasi ke 10 HP).`;
      
    } else {
      text += `\n❤️ Sisa Darah Kamu: ${w.hp}/${w.maxHp}\n`;
      text += `🖤 Sisa HP Monster: ${combat.monsterHp}/${combat.monsterMaxHp}\n\n`;
      text += `Ketik *!serang* lagi atau *!lari*!`;
    }
  }

  // Update DB — save ALL fields that could change during combat
  const invStr = JSON.stringify(w.inventory || {});
  const enchStr = JSON.stringify(w.enchants || {});
  const buffsStr = JSON.stringify(w.buffs || {});
  const combatStr = JSON.stringify(w.combat || {});
  const skillsStr = JSON.stringify(w.skills || {});
  db.prepare(`
    UPDATE users 
    SET coins = ?, hp = ?, xp = ?, level = ?, inventory = ?, enchants = ?, buffs = ?, combat = ?, skills = ?,
        pickaxeDurability = ?, maxPickaxeDurability = ?, pancinganDurability = ?, maxPancinganDurability = ?
    WHERE id = ?
  `).run(w.coins, w.hp, w.xp, w.level, invStr, enchStr, buffsStr, combatStr, skillsStr,
    w.pickaxeDurability, w.maxPickaxeDurability, w.pancinganDurability, w.maxPancinganDurability, sender);

  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

async function lari(sock, msg, sender) {
  let w = economy.getRawWallet(sender);
  if (!w.combat || !w.combat.active) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sedang tidak bertarung." }, { quoted: msg });
  }

  const chance = Math.random();
  if (chance > 0.5) {
    const mName = w.combat.monsterName;
    w.combat = { active: false };
    db.prepare(`UPDATE users SET combat = ? WHERE id = ?`).run(JSON.stringify(w.combat), sender);
    return sock.sendMessage(msg.key.remoteJid, { text: `🏃💨 Kamu berhasil kabur dari kejaran *${mName}* dengan selamat!` }, { quoted: msg });
  } else {
    // Gagal bos lari, diserang
    const combat = w.combat;
    let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];
    w.hp -= monsterDmg;
    
    let text = `🏃❌ Kamu gagal kabur dan tersandung!\n`;
    text += `👹 *${combat.monsterName}* menyerang dari belakang dan menghasilkan *${monsterDmg}* damage!\n`;
    
    if (w.hp <= 0) {
      const penalty = Math.floor(w.coins * 0.1);
      w.coins -= penalty;
      w.hp = 10;
      w.combat = { active: false };
      text += `\n☠️ *KAMU PINGSAN!*\n💸 Kamu kehilangan *${penalty} koin* untuk perawatan. (Darah direstorasi ke 10 HP).`;
    } else {
      text += `\n❤️ Sisa Darah Kamu: ${w.hp}/${w.maxHp}\n`;
      text += `Ketik *!serang* atau coba *!lari* lagi!`;
    }

    const combatStr = JSON.stringify(w.combat || {});
    db.prepare(`UPDATE users SET coins = ?, hp = ?, combat = ? WHERE id = ?`).run(w.coins, w.hp, combatStr, sender);
    return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  }
}

async function usePotion(sock, msg, sender) {
  let w = economy.getRawWallet(sender);
  if (w.hp >= w.maxHp) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Darah kamu masih penuh!" }, { quoted: msg });
  }

  // Check inventory for Potion
  if (w.inventory["potion_kecil"] > 0) {
    w.inventory["potion_kecil"] -= 1;
    w.hp = Math.min(w.maxHp, w.hp + 30);
    const invStr = JSON.stringify(w.inventory);
    db.prepare(`UPDATE users SET hp = ?, inventory = ? WHERE id = ?`).run(w.hp, invStr, sender);
    
    let text = `🧪 Kamu meminum *Potion Kecil* dan memulihkan 30 HP!\n❤️ Darah Sekarang: ${w.hp}/${w.maxHp}`;
    if (w.combat && w.combat.active) {
       text += `\n\n(Lanjut *!serang* atau *!lari*)`;
    }
    return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  } else {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu tidak punya Potion Kecil di tas! Beli di !shop" }, { quoted: msg });
  }
}

module.exports = {
  triggerEncounter,
  serang,
  lari,
  usePotion
};

// features/combat.js
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

function applyMonsterAbility(w, mData) {
  if (!mData?.ability) return '';
  if (mData.ability === 'reduce_durability') {
    const dmg = Math.floor(Math.random() * 6) + 5;
    w.pickaxeDurability = Math.max(0, (w.pickaxeDurability || 0) - dmg);
    return `\n⛏️ *${mData.name}* merusak pickaxe kamu! (-${dmg} durability, sisa: ${w.pickaxeDurability}/${w.maxPickaxeDurability})`;
  }
  return '';
}

async function triggerEncounter(sock, msg, sender, wallet) {
  const monster = rpgData.rollMonster();

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

  economy.saveWallet(sender, wallet);

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
  const w = economy.getRawWallet(sender);
  if (!w.combat || !w.combat.active) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sedang tidak bertarung dengan monster apapun." }, { quoted: msg });
  }

  const combat = w.combat;
  const mData = rpgData.monsters.find(m => m.id === combat.monsterId);
  let playerDmg = getPlayerDamage(w.pickaxeLevel);

  if (w.buffs["damage_plus_5"] && w.buffs["damage_plus_5"].expiresAt > Date.now()) {
    playerDmg += 5;
  }

  let text = `⚔️ Kamu menyerang *${combat.monsterName}* dan menghasilkan *${playerDmg}* damage!\n`;
  combat.monsterHp -= playerDmg;

  if (combat.monsterHp <= 0) {
    const goldDrop = Math.floor(Math.random() * (mData.dropGold[1] - mData.dropGold[0] + 1)) + mData.dropGold[0];

    w.coins += goldDrop;
    w.inventory[mData.dropItem] = (w.inventory[mData.dropItem] || 0) + 1;

    text += `\n🎉 *${combat.monsterName} TELAH DIKALAHKAN!*\n`;
    text += `💰 Mendapat: ${goldDrop} Koin\n`;
    text += `📦 Mendapat: 1x ${mData.dropItem.toUpperCase()}\n`;

    w.combat = { active: false };

    if (combat.monsterId === "lich_penambang") {
      text += `\n✨ Kutukan Lich menghilang karena kamu menang!`;
    }

  } else {
    let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];

    text += `\n👹 *${combat.monsterName}* menyerang balik dan menghasilkan *${monsterDmg}* damage!\n`;
    text += applyMonsterAbility(w, mData);
    w.hp -= monsterDmg;

    if (w.hp <= 0) {
      const penalty = Math.floor(w.coins * 0.1);
      w.coins -= penalty;
      w.hp = 10;
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

  economy.saveWallet(sender, w);
  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

async function lari(sock, msg, sender) {
  const w = economy.getRawWallet(sender);
  if (!w.combat || !w.combat.active) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sedang tidak bertarung." }, { quoted: msg });
  }

  const chance = Math.random();
  if (chance > 0.5) {
    const mName = w.combat.monsterName;
    w.combat = { active: false };
    economy.saveWallet(sender, w);
    return sock.sendMessage(msg.key.remoteJid, { text: `🏃💨 Kamu berhasil kabur dari kejaran *${mName}* dengan selamat!` }, { quoted: msg });
  }

  const combat = w.combat;
  const mData = rpgData.monsters.find(m => m.id === combat.monsterId);
  let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];
  w.hp -= monsterDmg;

  let text = `🏃❌ Kamu gagal kabur dan tersandung!\n`;
  text += `👹 *${combat.monsterName}* menyerang dari belakang dan menghasilkan *${monsterDmg}* damage!\n`;
  text += applyMonsterAbility(w, mData);

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

  economy.saveWallet(sender, w);
  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

async function usePotion(sock, msg, sender) {
  const w = economy.getRawWallet(sender);
  if (w.hp >= w.maxHp) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Darah kamu masih penuh!" }, { quoted: msg });
  }

  if (w.inventory["potion_kecil"] > 0) {
    w.inventory["potion_kecil"] -= 1;
    w.hp = Math.min(w.maxHp, w.hp + 30);
    economy.saveWallet(sender, w);

    let text = `🧪 Kamu meminum *Potion Kecil* dan memulihkan 30 HP!\n❤️ Darah Sekarang: ${w.hp}/${w.maxHp}`;
    if (w.combat && w.combat.active) {
      text += `\n\n(Lanjut *!serang* atau *!lari*)`;
    }
    return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  }

  return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu tidak punya Potion Kecil di tas! Beli di !shop" }, { quoted: msg });
}

module.exports = {
  triggerEncounter,
  serang,
  lari,
  usePotion
};

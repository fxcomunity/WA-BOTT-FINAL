// features/combat.js
const economy = require('./economy');
const rpgData = require('./rpgData');
const gearData = require('./gearData');
const skillsData = require('./skillsData');

const COMBAT_MAGIC_SKILLS = [
  "ledakan_terkendali", "penyelarasan_kristal", "sentuhan_transmutasi", "deteksi_harta"
];

function getFallbackDamage(pickaxeLevel) {
  switch (pickaxeLevel) {
    case 1: return Math.floor(Math.random() * 11) + 10;
    case 2: return Math.floor(Math.random() * 21) + 20;
    case 3: return Math.floor(Math.random() * 31) + 40;
    case 4: return Math.floor(Math.random() * 51) + 70;
    default: return Math.floor(Math.random() * 131) + 120;
  }
}

function getReadyMagicSkill(w) {
  for (const skillId of COMBAT_MAGIC_SKILLS) {
    if (!w.skills[skillId]) continue;
    const skill = skillsData.skills.find(s => s.id === skillId);
    if (!skill) continue;
    const level = w.skills[skillId].level || 1;
    const lvlData = skill.levels[level - 1];
    if (w.mp >= lvlData.mpCost) {
      return { skillId, skill, level, mpCost: lvlData.mpCost, name: skill.name };
    }
  }
  return null;
}

function tagsMatch(weapon, mData) {
  if (!weapon?.bonusTags || !mData?.tags) return false;
  return weapon.bonusTags.some(t => mData.tags.includes(t));
}

function calcSwordDamage(w, mData) {
  const weaponId = w.equipment?.weapon;
  const weapon = weaponId ? gearData.getWeapon(weaponId) : null;
  let dmg;

  if (weapon) {
    const variance = Math.floor(Math.random() * Math.max(1, Math.floor(weapon.baseAtk * 0.25)));
    dmg = weapon.baseAtk + variance;
    if (tagsMatch(weapon, mData)) dmg += weapon.bonusAtk;
  } else {
    dmg = Math.floor(getFallbackDamage(w.pickaxeLevel) * 0.6);
  }

  const acc = w.equipment?.accessory ? gearData.getAccessory(w.equipment.accessory) : null;
  if (acc?.beastBonus && mData.tags?.includes("beast")) dmg += acc.beastBonus;
  if (acc?.bossBonus && mData.tags?.includes("boss")) dmg += acc.bossBonus;

  if (w.buffs["damage_plus_5"]?.expiresAt > Date.now()) dmg += 5;
  return Math.max(1, dmg);
}

function calcMagicDamage(w, magicInfo, mData) {
  const lvl = magicInfo.level;
  let dmg = 25 + (lvl * 18) + Math.floor(Math.random() * 25);
  w.mp -= magicInfo.mpCost;

  const acc = w.equipment?.accessory ? gearData.getAccessory(w.equipment.accessory) : null;
  if (acc?.magicBonus) dmg += acc.magicBonus;
  if (mData.tags?.includes("magic")) dmg += Math.floor(lvl * 5);

  return Math.max(1, dmg);
}

function rollAttackType(w) {
  const magic = getReadyMagicSkill(w);
  if (!magic) return { type: "sword", magic: null };
  return { type: Math.random() < 0.5 ? "sword" : "magic", magic };
}

function applyArmorReduction(w, incoming) {
  const armor = w.equipment?.armor ? gearData.getArmor(w.equipment.armor) : null;
  if (!armor) return incoming;
  return Math.max(1, incoming - armor.def);
}

function applyMonsterAbility(w, mData) {
  if (!mData?.ability) return '';
  if (mData.ability === 'reduce_durability') {
    const dmg = Math.floor(Math.random() * 6) + 5;
    w.pickaxeDurability = Math.max(0, (w.pickaxeDurability || 0) - dmg);
    return `\n⛏️ *${mData.name}* merusak pickaxe kamu! (-${dmg} durability)`;
  }
  return '';
}

function buildEncounterText(source, monster) {
  return `⚠️ *AWAS!* Saat ${source}, kamu diserang oleh:\n\n` +
    `👹 *${monster.name}* (Tier ${monster.tier})\n` +
    `❤️ HP Monster: ${monster.hp}/${monster.maxHp}\n\n` +
    `⚔️ _Serangan acak: Pedang 🗡️ atau Magic ✨ (butuh skill + MP)_\n` +
    `Ketik:\n👉 *!serang* | *!lari* | *!potion*`;
}

async function startEncounter(sock, msg, sender, wallet, monster, source) {
  wallet.combat = {
    active: true,
    source,
    monsterId: monster.id,
    monsterName: monster.name,
    monsterHp: monster.hp,
    monsterMaxHp: monster.maxHp,
    monsterDamage: monster.damage,
    turn: 1,
    statusEffects: []
  };
  economy.saveWallet(sender, wallet);
  await sock.sendMessage(msg.key.remoteJid, { text: buildEncounterText(source, monster) }, { quoted: msg });
  return wallet;
}

async function triggerEncounter(sock, msg, sender, wallet) {
  return startEncounter(sock, msg, sender, wallet, rpgData.rollMonster(), "sedang menambang");
}

async function triggerHuntEncounter(sock, msg, sender, wallet) {
  return startEncounter(sock, msg, sender, wallet, rpgData.rollHuntMonster(), "sedang berburu");
}

async function serang(sock, msg, sender) {
  const w = economy.getRawWallet(sender);
  if (!w.combat?.active) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sedang tidak bertarung dengan monster apapun." }, { quoted: msg });
  }

  const combat = w.combat;
  const mData = rpgData.findMonster(combat.monsterId);
  const attack = rollAttackType(w);
  let playerDmg;
  let attackLine;

  if (attack.type === "magic" && attack.magic) {
    playerDmg = calcMagicDamage(w, attack.magic, mData);
    attackLine = `✨ Kamu melempar *${attack.magic.name}* ke *${combat.monsterName}* → *${playerDmg}* magic damage! (-${attack.magic.mpCost} MP)`;
  } else {
    playerDmg = calcSwordDamage(w, mData);
    const weapon = w.equipment?.weapon ? gearData.getWeapon(w.equipment.weapon) : null;
    const wpnName = weapon ? weapon.name : "Tinju + Pickaxe";
    attackLine = `🗡️ Kamu menebas dengan *${wpnName}* → *${playerDmg}* damage!`;
  }

  let text = `${attackLine}\n`;
  combat.monsterHp -= playerDmg;

  if (combat.monsterHp <= 0) {
    let goldDrop = Math.floor(Math.random() * (mData.dropGold[1] - mData.dropGold[0] + 1)) + mData.dropGold[0];
    const acc = w.equipment?.accessory ? gearData.getAccessory(w.equipment.accessory) : null;
    if (acc?.goldBonus) goldDrop = Math.floor(goldDrop * (1 + acc.goldBonus));

    w.coins += goldDrop;
    w.inventory[mData.dropItem] = (w.inventory[mData.dropItem] || 0) + 1;
    w.combat = { active: false };

    text += `\n🎉 *${combat.monsterName} TELAH DIKALAHKAN!*\n`;
    text += `💰 +${goldDrop} Koin\n📦 +1x ${mData.dropItem.replace(/_/g, " ").toUpperCase()}`;
    if (combat.monsterId === "lich_penambang") text += `\n✨ Kutukan Lich hilang!`;
  } else {
    let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];
    monsterDmg = applyArmorReduction(w, monsterDmg);

    text += `\n👹 *${combat.monsterName}* counter → *${monsterDmg}* damage!\n`;
    text += applyMonsterAbility(w, mData);
    w.hp -= monsterDmg;

    if (w.hp <= 0) {
      const penalty = Math.floor(w.coins * 0.1);
      w.coins -= penalty;
      w.hp = 10;
      w.combat = { active: false };
      text += `\n☠️ *KAMU PINGSAN!* 💸 -${penalty} koin (HP → 10)`;
    } else {
      text += `\n❤️ HP: ${w.hp}/${w.maxHp} | 🖤 Monster: ${combat.monsterHp}/${combat.monsterMaxHp}\n`;
      text += `Ketik *!serang* lagi atau *!lari*!`;
    }
  }

  economy.saveWallet(sender, w);
  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

async function lari(sock, msg, sender) {
  const w = economy.getRawWallet(sender);
  if (!w.combat?.active) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu sedang tidak bertarung." }, { quoted: msg });
  }

  if (Math.random() > 0.5) {
    const mName = w.combat.monsterName;
    w.combat = { active: false };
    economy.saveWallet(sender, w);
    return sock.sendMessage(msg.key.remoteJid, { text: `🏃💨 Kamu kabur dari *${mName}*!` }, { quoted: msg });
  }

  const combat = w.combat;
  const mData = rpgData.findMonster(combat.monsterId);
  let monsterDmg = applyArmorReduction(w,
    Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0]
  );
  w.hp -= monsterDmg;

  let text = `🏃❌ Gagal kabur! *${combat.monsterName}* serang → *${monsterDmg}* damage!\n`;
  text += applyMonsterAbility(w, mData);

  if (w.hp <= 0) {
    const penalty = Math.floor(w.coins * 0.1);
    w.coins -= penalty;
    w.hp = 10;
    w.combat = { active: false };
    text += `\n☠️ *PINGSAN!* 💸 -${penalty} koin`;
  } else {
    text += `\n❤️ HP: ${w.hp}/${w.maxHp}\nKetik *!serang* atau *!lari*!`;
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
  } else if (w.inventory["potion_besar"] > 0) {
    w.inventory["potion_besar"] -= 1;
    w.hp = Math.min(w.maxHp, w.hp + 100);
  } else {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Tidak ada potion! Beli di !shop (no. 7/8)" }, { quoted: msg });
  }

  economy.saveWallet(sender, w);
  let text = `🧪 Potion diminum! ❤️ HP: ${w.hp}/${w.maxHp}`;
  if (w.combat?.active) text += `\n(Lanjut *!serang* atau *!lari*)`;
  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

module.exports = {
  triggerEncounter,
  triggerHuntEncounter,
  serang,
  lari,
  usePotion,
};

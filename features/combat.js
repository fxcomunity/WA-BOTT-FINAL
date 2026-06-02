// features/combat.js
const economy = require('./economy');
const rpgData = require('./rpgData');
const gearData = require('./gearData');
const skillsData = require('./skillsData');

const COMBAT_MAGIC_SKILLS = [
  "ledakan_terkendali", "penyelarasan_kristal", "sentuhan_transmutasi", "deteksi_harta",
  "petir_olimpus", "penghakiman_maat", "supernova_surya", "pusaran_samudra", "kehancuran_kosmis", "trisula_blast", "mantra_pembersih", "pembuatan_skill"
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

  // Apply weapon enchants
  if (w.enchants) {
    if (w.enchants["weapon_sharpness"]) dmg = Math.floor(dmg * 1.15);
    if (w.enchants["weapon_power"]) dmg = Math.floor(dmg * 1.20);
    if (w.enchants["weapon_quick_charge"]) dmg = Math.floor(dmg * 1.10);
    if (w.enchants["armor_soul_speed"]) dmg = Math.floor(dmg * 1.10);
    
    if (w.enchants["weapon_smite"] && mData.tags?.includes("undead")) {
      dmg = Math.floor(dmg * 1.30);
    }
    if (w.enchants["weapon_bane_of_arthropods"] && ["rayap_batu", "laba_batu", "scorpion_kristal", "ratu_laba"].includes(mData.id)) {
      dmg = Math.floor(dmg * 1.30);
    }
    if (w.enchants["weapon_impaling"] && (["cacing_tanah"].includes(mData.id) || mData.id.includes("hiu") || mData.id.includes("ikan"))) {
      dmg = Math.floor(dmg * 1.35);
    }
    if (w.enchants["weapon_piercing"]) {
      dmg += 15;
    }
    if (w.enchants["weapon_fire_aspect"]) {
      dmg = Math.floor(dmg * 1.10);
    }
    if (w.enchants["weapon_flame"]) {
      dmg = Math.floor(dmg * 1.12);
    }
  }

  return Math.max(1, dmg);
}

function calcMagicDamage(w, magicInfo, mData) {
  if (magicInfo.skillId === "pembuatan_skill") return 99999999;
  if (["petir_olimpus", "penghakiman_maat", "supernova_surya", "pusaran_samudra", "kehancuran_kosmis", "trisula_blast", "mantra_pembersih"].includes(magicInfo.skillId)) {
    w.mp -= magicInfo.mpCost;
    return Math.floor(Math.random() * 200000) + 100000;
  }
  
  const lvl = magicInfo.level;
  let dmg = 25 + (lvl * 18) + Math.floor(Math.random() * 25);
  
  if (w.enchants && w.enchants["weapon_infinity"]) {
    // MP cost ignored!
  } else {
    w.mp -= magicInfo.mpCost;
  }

  const acc = w.equipment?.accessory ? gearData.getAccessory(w.equipment.accessory) : null;
  if (acc?.magicBonus) dmg += acc.magicBonus;
  if (mData.tags?.includes("magic")) dmg += Math.floor(lvl * 5);

  if (w.enchants && w.enchants["weapon_channeling"]) {
    dmg = Math.floor(dmg * 1.25);
  }

  return Math.max(1, dmg);
}

function rollAttackType(w) {
  const magic = getReadyMagicSkill(w);
  if (!magic) return { type: "sword", magic: null };
  return { type: Math.random() < 0.5 ? "sword" : "magic", magic };
}

function applyArmorReduction(w, incoming, mData) {
  const armor = w.equipment?.armor ? gearData.getArmor(w.equipment.armor) : null;
  let def = armor ? armor.def : 0;

  if (w.enchants) {
    if (w.enchants["armor_aqua_affinity"]) def += 10;
    
    // Protection enchants directly reduce incoming damage
    if (w.enchants["armor_protection"]) {
      incoming = Math.floor(incoming * 0.85);
    }
    if (w.enchants["armor_blast_protection"] && mData && (mData.tags?.includes("golem") || mData.tags?.includes("armor"))) {
      incoming = Math.floor(incoming * 0.70);
    }
    if (w.enchants["armor_fire_protection"] && mData && (mData.tags?.includes("fire") || mData.id.includes("naga") || mData.id.includes("phoenix"))) {
      incoming = Math.floor(incoming * 0.70);
    }
    if (w.enchants["armor_projectile_protection"] && mData && mData.tags?.includes("flying")) {
      incoming = Math.floor(incoming * 0.70);
    }
    if (w.enchants["armor_frost_walker"] && mData && (mData.id.includes("magma") || mData.id.includes("phoenix"))) {
      incoming = Math.floor(incoming * 0.75);
    }
  }

  if (def === 0) return Math.max(1, incoming);
  return Math.max(1, incoming - def);
}

function applyMonsterAbility(w, mData) {
  let text = '';
  if (mData?.ability === 'reduce_durability') {
    const dmg = Math.floor(Math.random() * 6) + 5;
    w.pickaxeDurability = Math.max(0, (w.pickaxeDurability || 0) - dmg);
    text += `\n⛏️ *${mData.name}* merusak pickaxe kamu! (-${dmg} durability)`;
  }
  if (mData?.abilities) {
    for (const ab of mData.abilities) {
      if (Math.random() < ab.chance) {
        if (ab.type === "instant_kill") {
           w.hp = 0;
           text += `\n☠️ *${ab.name}:* ${ab.desc} (Kamu terbunuh instan!)`;
        } else if (ab.type === "magic") {
           const dmg = Math.floor(mData.damage[1] * 1.5);
           w.hp -= dmg;
           text += `\n✨ *${ab.name}:* ${ab.desc} (-${dmg} HP!)`;
        } else if (ab.type === "stun" || ab.type === "defense_buff") {
           text += `\n⚠️ *${ab.name}:* ${ab.desc}`;
        }
      }
    }
  }
  return text;
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
    attackLine = `✨ Kamu melempar *${attack.magic.name}* ke *${combat.monsterName}* → *${playerDmg}* magic damage!${w.enchants?.["weapon_infinity"] ? " (⚡ INFINITY: 0 Mana!)" : ` (-${attack.magic.mpCost} MP)`}`;
  } else {
    playerDmg = calcSwordDamage(w, mData);
    const weapon = w.equipment?.weapon ? gearData.getWeapon(w.equipment.weapon) : null;
    const wpnName = weapon ? weapon.name : "Tinju + Pickaxe";
    attackLine = `🗡️ Kamu menebas dengan *${wpnName}* → *${playerDmg}* damage!`;
  }

  let text = `${attackLine}\n`;
  
  let hits = 1;
  if (attack.type !== "magic" && w.enchants && w.enchants["weapon_multishot"] && Math.random() < 0.25) {
    hits = 2;
    text += `🏹 *MULTISHOT:* Tembakan beruntun! Kamu menyerang *2x* sekaligus!\n`;
  }
  
  combat.monsterHp -= (playerDmg * hits);

  if (combat.monsterHp <= 0) {
    let goldDrop = Math.floor(Math.random() * (mData.dropGold[1] - mData.dropGold[0] + 1)) + mData.dropGold[0];
    const acc = w.equipment?.accessory ? gearData.getAccessory(w.equipment.accessory) : null;
    if (acc?.goldBonus) goldDrop = Math.floor(goldDrop * (1 + acc.goldBonus));
    if (w.enchants && w.enchants["weapon_looting"]) {
      goldDrop = Math.floor(goldDrop * 1.25);
    }

    w.coins += goldDrop;
    w.inventory[mData.dropItem] = (w.inventory[mData.dropItem] || 0) + 1;
    w.combat = { active: false };

    text += `\n🎉 *${combat.monsterName} TELAH DIKALAHKAN!*\n`;
    text += `💰 +${goldDrop} Koin\n📦 +1x ${mData.dropItem.replace(/_/g, " ").toUpperCase()}`;
    if (combat.monsterId === "lich_penambang") text += `\n✨ Kutukan Lich hilang!`;
    
    if (mData.tier >= 8 && mData.abilities && mData.abilities.length > 0) {
      const skillName = mData.abilities[0].name;
      if (!w.skills[skillName]) {
         w.skills[skillName] = { level: 5 };
         text += `\n✨ *PENGUASAAN DEWA:* Kamu berhasil menyerap skill dewa: *${skillName.replace(/_/g, " ").toUpperCase()}*!`;
      }
    }
    
    if (w.enchants && w.enchants["weapon_mending"]) {
      w.hp = Math.min(w.maxHp, w.hp + 5);
      text += `\n✨ *MENDING:* Memulihkan +5 HP karena menang pertarungan!`;
    }
  } else {
    let monsterCounter = true;
    if (w.enchants) {
      if (w.enchants["weapon_knockback"] && Math.random() < 0.15) {
        monsterCounter = false;
        text += `💨 *KNOCKBACK:* Monster terpental dan gagal counter turn ini!\n`;
      } else if (w.enchants["weapon_punch"] && Math.random() < 0.20) {
        monsterCounter = false;
        text += `🥊 *PUNCH:* Monster terkena stun dan melewatkan serangannya!\n`;
      }
    }

    if (monsterCounter) {
      let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];
      monsterDmg = applyArmorReduction(w, monsterDmg, mData);

      text += `👹 *${combat.monsterName}* counter → *${monsterDmg}* damage!\n`;
      text += applyMonsterAbility(w, mData);
      
      // Thorns reflect
      if (w.enchants && w.enchants["armor_thorns"] && monsterDmg > 0) {
        const reflectDmg = Math.max(1, Math.floor(monsterDmg * 0.20));
        combat.monsterHp -= reflectDmg;
        text += `🌵 *THORNS:* Baju berduri memantulkan *${reflectDmg}* damage ke monster!\n`;
      }

      w.hp -= monsterDmg;

      if (combat.monsterHp <= 0) {
        // Monster died from thorns!
        let goldDrop = Math.floor(Math.random() * (mData.dropGold[1] - mData.dropGold[0] + 1)) + mData.dropGold[0];
        if (w.enchants && w.enchants["weapon_looting"]) goldDrop = Math.floor(goldDrop * 1.25);
        w.coins += goldDrop;
        w.inventory[mData.dropItem] = (w.inventory[mData.dropItem] || 0) + 1;
        w.combat = { active: false };
        text += `\n🎉 *${combat.monsterName} mati terkena pantulan duri!*\n💰 +${goldDrop} Koin\n📦 +1x ${mData.dropItem.replace(/_/g, " ").toUpperCase()}`;
        if (w.enchants && w.enchants["weapon_mending"]) {
          w.hp = Math.min(w.maxHp, w.hp + 5);
        }
        
        // Cek jika player juga mati (hp <= 0) karena serangan terakhir monster tersebut
        if (w.hp <= 0) {
          let penalty = Math.floor(w.coins * 0.1);
          if (w.enchants && w.enchants["armor_feather_falling"]) {
            penalty = Math.floor(penalty * 0.5);
            text += `\n🪶 *FEATHER FALLING:* Denda koin pingsan dikurangi 50%!`;
          }
          w.coins -= penalty;
          w.hp = 10;
          text += `\n☠️ *KAMU PINGSAN!* Walaupun monster mati, kamu juga pingsan akibat serangan terakhir! 💸 -${penalty} koin (HP → 10)`;
          
          if (w.enchants && w.enchants["armor_curse_of_binding"]) {
            delete w.enchants["armor_curse_of_binding"];
            text += `\n🔓 *Curse of Binding* terlepas dari armor kamu!`;
          }
          
          if (w.enchants) {
            if (w.enchants["pickaxe_curse_of_vanishing"]) {
              w.pickaxeLevel = 1;
              w.pickaxeDurability = 50;
              w.maxPickaxeDurability = 50;
              for (const k of Object.keys(w.enchants)) {
                if (k.startsWith("pickaxe_")) delete w.enchants[k];
              }
              text += `\n☠️ *CURSE OF VANISHING:* Pickaxe kamu lenyap seketika!`;
            }
            if (w.enchants["pancingan_curse_of_vanishing"]) {
              w.pancinganLevel = 1;
              w.pancinganDurability = 50;
              w.maxPancinganDurability = 50;
              for (const k of Object.keys(w.enchants)) {
                if (k.startsWith("pancingan_")) delete w.enchants[k];
              }
              text += `\n☠️ *CURSE OF VANISHING:* Pancingan kamu lenyap seketika!`;
            }
            if (w.enchants["weapon_curse_of_vanishing"]) {
              const itemKey = w.equipment?.weapon;
              if (itemKey) {
                w.equipment.weapon = null;
                for (const k of Object.keys(w.enchants)) {
                  if (k.startsWith("weapon_")) delete w.enchants[k];
                }
                text += `\n☠️ *CURSE OF VANISHING:* Senjata *${itemKey.replace(/_/g, " ").toUpperCase()}* kamu lenyap seketika!`;
              }
            }
            if (w.enchants["armor_curse_of_vanishing"]) {
              const itemKey = w.equipment?.armor;
              if (itemKey) {
                w.equipment.armor = null;
                for (const k of Object.keys(w.enchants)) {
                  if (k.startsWith("armor_")) delete w.enchants[k];
                }
                text += `\n☠️ *CURSE OF VANISHING:* Armor *${itemKey.replace(/_/g, " ").toUpperCase()}* kamu lenyap seketika!`;
              }
            }
          }
        }
      } else if (w.hp <= 0) {
        let penalty = Math.floor(w.coins * 0.1);
        if (w.enchants && w.enchants["armor_feather_falling"]) {
          penalty = Math.floor(penalty * 0.5);
          text += `🪶 *FEATHER FALLING:* Denda koin pingsan dikurangi 50%!\n`;
        }
        w.coins -= penalty;
        w.hp = 10;
        w.combat = { active: false };
        
        text += `\n☠️ *KAMU PINGSAN!* 💸 -${penalty} koin (HP → 10)\n`;
        
        // Remove curse of binding
        if (w.enchants && w.enchants["armor_curse_of_binding"]) {
          delete w.enchants["armor_curse_of_binding"];
          text += `🔓 *Curse of Binding* terlepas dari armor kamu!\n`;
        }
        
        // Curse of vanishing checks
        if (w.enchants) {
          if (w.enchants["pickaxe_curse_of_vanishing"]) {
            w.pickaxeLevel = 1;
            w.pickaxeDurability = 50;
            w.maxPickaxeDurability = 50;
            for (const k of Object.keys(w.enchants)) {
              if (k.startsWith("pickaxe_")) delete w.enchants[k];
            }
            text += `☠️ *CURSE OF VANISHING:* Pickaxe kamu lenyap seketika!\n`;
          }
          if (w.enchants["pancingan_curse_of_vanishing"]) {
            w.pancinganLevel = 1;
            w.pancinganDurability = 50;
            w.maxPancinganDurability = 50;
            for (const k of Object.keys(w.enchants)) {
              if (k.startsWith("pancingan_")) delete w.enchants[k];
            }
            text += `☠️ *CURSE OF VANISHING:* Pancingan kamu lenyap seketika!\n`;
          }
          if (w.enchants["weapon_curse_of_vanishing"]) {
            const itemKey = w.equipment?.weapon;
            if (itemKey) {
              w.equipment.weapon = null;
              for (const k of Object.keys(w.enchants)) {
                if (k.startsWith("weapon_")) delete w.enchants[k];
              }
              text += `☠️ *CURSE OF VANISHING:* Senjata *${itemKey.replace(/_/g, " ").toUpperCase()}* kamu lenyap seketika!\n`;
            }
          }
          if (w.enchants["armor_curse_of_vanishing"]) {
            const itemKey = w.equipment?.armor;
            if (itemKey) {
              w.equipment.armor = null;
              for (const k of Object.keys(w.enchants)) {
                if (k.startsWith("armor_")) delete w.enchants[k];
              }
              text += `☠️ *CURSE OF VANISHING:* Armor *${itemKey.replace(/_/g, " ").toUpperCase()}* kamu lenyap seketika!\n`;
            }
          }
        }
      } else {
        text += `\n❤️ HP: ${w.hp}/${w.maxHp} | 🖤 Monster: ${combat.monsterHp}/${combat.monsterMaxHp}\n`;
        text += `Ketik *!serang* lagi atau *!lari*!`;
      }
    } else {
      // Monster counter skipped
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

  let runChance = 0.5;
  if (w.enchants) {
    if (w.enchants["weapon_riptide"]) runChance = 0.8;
    if (w.enchants["armor_depth_strider"]) runChance += 0.10;
  }

  if (Math.random() < runChance) {
    const mName = w.combat.monsterName;
    w.combat = { active: false };
    economy.saveWallet(sender, w);
    return sock.sendMessage(msg.key.remoteJid, { text: `🏃💨 Kamu kabur dari *${mName}*!` }, { quoted: msg });
  }

  const combat = w.combat;
  const mData = rpgData.findMonster(combat.monsterId);
  let monsterDmg = Math.floor(Math.random() * (combat.monsterDamage[1] - combat.monsterDamage[0] + 1)) + combat.monsterDamage[0];
  monsterDmg = applyArmorReduction(w, monsterDmg, mData);

  if (w.enchants && w.enchants["weapon_loyalty"] && Math.random() < 0.5) {
    monsterDmg = 0;
  }

  w.hp -= monsterDmg;

  let text = `🏃❌ Gagal kabur! *${combat.monsterName}* serang → *${monsterDmg}* damage!\n`;
  if (monsterDmg === 0 && w.enchants?.["weapon_loyalty"]) {
    text = `🏃❌ Gagal kabur! *${combat.monsterName}* melayangkan serangan, tapi 🔱 *LOYALTY* melindungimu! (0 damage)\n`;
  }
  text += applyMonsterAbility(w, mData);

  if (w.hp <= 0) {
    let penalty = Math.floor(w.coins * 0.1);
    if (w.enchants && w.enchants["armor_feather_falling"]) {
      penalty = Math.floor(penalty * 0.5);
    }
    w.coins -= penalty;
    w.hp = 10;
    w.combat = { active: false };
    text += `\n☠️ *PINGSAN!* 💸 -${penalty} koin (HP → 10)`;
    
    // Remove curse of binding
    if (w.enchants && w.enchants["armor_curse_of_binding"]) {
      delete w.enchants["armor_curse_of_binding"];
    }

    // Curse of vanishing checks
    if (w.enchants) {
      if (w.enchants["pickaxe_curse_of_vanishing"]) {
        w.pickaxeLevel = 1;
        w.pickaxeDurability = 50;
        w.maxPickaxeDurability = 50;
        for (const k of Object.keys(w.enchants)) {
          if (k.startsWith("pickaxe_")) delete w.enchants[k];
        }
        text += `\n☠️ *CURSE OF VANISHING:* Pickaxe kamu lenyap seketika!`;
      }
      if (w.enchants["pancingan_curse_of_vanishing"]) {
        w.pancinganLevel = 1;
        w.pancinganDurability = 50;
        w.maxPancinganDurability = 50;
        for (const k of Object.keys(w.enchants)) {
          if (k.startsWith("pancingan_")) delete w.enchants[k];
        }
        text += `\n☠️ *CURSE OF VANISHING:* Pancingan kamu lenyap seketika!`;
      }
      if (w.enchants["weapon_curse_of_vanishing"]) {
        const itemKey = w.equipment?.weapon;
        if (itemKey) {
          w.equipment.weapon = null;
          for (const k of Object.keys(w.enchants)) {
            if (k.startsWith("weapon_")) delete w.enchants[k];
          }
          text += `\n☠️ *CURSE OF VANISHING:* Senjata *${itemKey.replace(/_/g, " ").toUpperCase()}* kamu lenyap seketika!`;
        }
      }
      if (w.enchants["armor_curse_of_vanishing"]) {
        const itemKey = w.equipment?.armor;
        if (itemKey) {
          w.equipment.armor = null;
          for (const k of Object.keys(w.enchants)) {
            if (k.startsWith("armor_")) delete w.enchants[k];
          }
          text += `\n☠️ *CURSE OF VANISHING:* Armor *${itemKey.replace(/_/g, " ").toUpperCase()}* kamu lenyap seketika!`;
        }
      }
    }
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

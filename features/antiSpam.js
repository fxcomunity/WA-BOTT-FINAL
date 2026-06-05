// features/antiSpam.js — Anti Spam, Flood, Mute, Slow Mode

const msgCount = {};     // { sender: { count, lastReset } }
const mutedUsers = {};   // { sender: unmuteAt }
const slowMode = { active: false, delay: 30 };
const lastMsg = {};      // { sender: timestamp } untuk slow mode

const FLOOD_WINDOW = 10 * 1000; // 10 detik

module.exports = {
  check(sender) {
    const now = Date.now();

    // Cek mute
    if (mutedUsers[sender] && now < mutedUsers[sender]) return true;

    // Cek slow mode
    if (slowMode.active) {
      const economy = require('./economy');
      const wallet = economy.getWallet ? economy.getWallet(sender) : null;
      const hasBypass = wallet && wallet.buffs && wallet.buffs["bypass_slowmode"] && Date.now() < wallet.buffs["bypass_slowmode"].expiresAt;
      if (!hasBypass) {
        if (lastMsg[sender] && now - lastMsg[sender] < slowMode.delay * 1000) return true;
        lastMsg[sender] = now;
      }
    }

    // Cek flood
    if (!msgCount[sender]) msgCount[sender] = { count: 0, lastReset: now };
    if (now - msgCount[sender].lastReset > FLOOD_WINDOW) {
      msgCount[sender] = { count: 1, lastReset: now };
      return false;
    }
    msgCount[sender].count++;
    const config = require("../config");
    return msgCount[sender].count > config.floodLimit;
  },

  mute(sender, menit) {
    mutedUsers[sender] = Date.now() + menit * 60 * 1000;
  },

  unmute(sender) {
    delete mutedUsers[sender];
  },

  isMuted(sender) {
    const now = Date.now();
    return mutedUsers[sender] && now < mutedUsers[sender];
  },

  setSlowMode(delay) {
    slowMode.active = true;
    slowMode.delay = delay;
  },

  disableSlowMode() {
    slowMode.active = false;
  },
};

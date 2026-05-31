// features/afk.js — Fitur AFK (Away From Keyboard)

const afkUsers = {};

module.exports = {
  setAfk(sender, reason, time) {
    afkUsers[sender] = {
      reason: reason || 'Sedang sibuk',
      time: time
    };
  },

  checkAfk(sender) {
    if (afkUsers[sender]) {
      delete afkUsers[sender];
      return true; // Berarti baru saja kembali
    }
    return false;
  },

  getAfkReason(sender) {
    return afkUsers[sender] || null;
  }
};

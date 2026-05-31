// features/statistics.js — Sistem Pelacakan Statistik Grup
const fs = require('fs');
const path = require('path');

const statsFile = path.join(__dirname, '../data_stats.json');
let statsData = {};

// Load data saat pertama jalan
if (fs.existsSync(statsFile)) {
  try {
    statsData = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
  } catch (e) {
    console.error("Gagal membaca data_stats.json:", e);
  }
}

// Fungsi untuk menyimpan ke file
function saveStats() {
  try {
    fs.writeFileSync(statsFile, JSON.stringify(statsData, null, 2));
  } catch (e) {
    console.error("Gagal menyimpan data_stats.json:", e);
  }
}

module.exports = {
  // Mencatat setiap pesan yang masuk
  track: (groupId, sender) => {
    if (!groupId || !sender) return;
    
    if (!statsData[groupId]) {
      statsData[groupId] = {
        totalMessages: 0,
        users: {}
      };
    }
    
    if (!statsData[groupId].users[sender]) {
      statsData[groupId].users[sender] = 0;
    }
    
    statsData[groupId].totalMessages++;
    statsData[groupId].users[sender]++;
    
    // Simpan setiap kelipatan 5 pesan agar tidak terlalu sering write file
    if (statsData[groupId].totalMessages % 5 === 0) {
      saveStats();
    }
  },

  // Mendapatkan statistik grup secara keseluruhan
  getGroupStats: (groupId) => {
    if (!statsData[groupId]) return "⚠️ Belum ada statistik tercatat untuk grup ini.";
    
    const totalMsg = statsData[groupId].totalMessages;
    const totalUsers = Object.keys(statsData[groupId].users).length;
    
    return `📈 *STATISTIK GRUP*\n\n👥 Total Member Terdeteksi: ${totalUsers}\n💬 Total Pesan Grup: ${totalMsg}\n\nGrup ini cukup aktif! 🔥`;
  },

  // Mendapatkan statistik user spesifik di semua grup yang tercatat
  getUserStats: (sender) => {
    let totalMsgUser = 0;
    let activeGroups = 0;
    
    for (const groupId in statsData) {
      if (statsData[groupId].users[sender]) {
        totalMsgUser += statsData[groupId].users[sender];
        activeGroups++;
      }
    }
    
    if (totalMsgUser === 0) return "⚠️ Kamu belum pernah mengirim pesan yang tercatat.";
    
    return `👤 *STATISTIK KAMU*\n\n📱 Nomor: +${sender.split("@")[0]}\n💬 Total Pesan Terkirim: ${totalMsgUser}\n🏘️ Aktif di: ${activeGroups} Grup`;
  },

  // Mendapatkan daftar member paling aktif di grup (Top 10)
  getTopActive: (groupId) => {
    if (!statsData[groupId]) return "⚠️ Belum ada statistik tercatat untuk grup ini.";
    
    const users = statsData[groupId].users;
    
    // Urutkan berdasarkan jumlah pesan terbanyak
    const sortedUsers = Object.entries(users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
      
    if (sortedUsers.length === 0) return "⚠️ Belum ada data member.";
    
    let text = `🏆 *TOP 10 MEMBER TERAKTIF*\n\n`;
    sortedUsers.forEach((user, index) => {
      let medal = "🏅";
      if (index === 0) medal = "🥇";
      if (index === 1) medal = "🥈";
      if (index === 2) medal = "🥉";
      
      const no = user[0].split("@")[0];
      const count = user[1];
      
      text += `${medal} +${no} : ${count} pesan\n`;
    });
    
    text += `\nTetap aktif dan ramaikan grup ya! 🔥`;
    return text;
  }
};
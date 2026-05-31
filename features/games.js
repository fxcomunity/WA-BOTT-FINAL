const activeGames = new Map();

// Sample questions for quiz
const quizQuestions = [
  { q: "Apa nama ibukota Indonesia?", a: "Jakarta" },
  { q: "Siapa penemu lampu pijar?", a: "Thomas Alva Edison" },
  { q: "Planet ketiga dari matahari adalah?", a: "Bumi" },
  { q: "Hewan tercepat di darat adalah?", a: "Cheetah" },
  { q: "Berapa hasil 15 x 5?", a: "75" }
];

module.exports = {
  createPoll: async (sock, groupId, args) => {
    if (!args || args.length === 0) {
      return sock.sendMessage(groupId, { text: "❌ Format salah!\nContoh: !poll Mau makan apa? | Nasi Goreng | Mie Ayam" });
    }
    const text = args.join(" ");
    const split = text.split("|").map(s => s.trim()).filter(s => s);
    
    // WhatsApp butuh minimal 2 opsi untuk sebuah polling
    if (split.length < 3) {
      return sock.sendMessage(groupId, { text: "❌ Minimal harus ada *2 Opsi* untuk membuat polling!\nContoh: !poll Pertanyaan | Opsi 1 | Opsi 2" });
    }

    const pollName = split[0];
    const options = split.slice(1);

    try {
      await sock.sendMessage(groupId, {
        poll: {
          name: `📊 *${pollName}*`,
          values: options,
          selectableCount: 1
        }
      });
    } catch (e) {
      console.log("Error createPoll:", e);
      await sock.sendMessage(groupId, { text: "❌ Gagal membuat polling. Pastikan format benar." });
    }
  },
  endPoll: async (sock, groupId, msg) => {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    if (!context || !context.quotedMessage) {
      return sock.sendMessage(groupId, { text: "❌ Balas (quote) pesan polling yang ingin ditutup dengan command !endpoll" });
    }

    const isFromMe = context.participant === sock.user.id.split(":")[0] + "@s.whatsapp.net" || context.participant === sock.user.id;
    
    try {
      await sock.sendMessage(groupId, { 
        delete: { 
          remoteJid: groupId, 
          fromMe: isFromMe, 
          id: context.stanzaId, 
          participant: context.participant 
        } 
      });
      await sock.sendMessage(groupId, { text: "✅ Polling berhasil ditutup (pesan dihapus)." });
    } catch (e) {
      console.log("Error endPoll:", e);
      await sock.sendMessage(groupId, { text: "❌ Gagal menutup polling. Pastikan pesan tersebut adalah polling dari bot." });
    }
  },

  startQuiz: async (sock, msg, groupId) => { 
    if (activeGames.has(groupId)) {
      return sock.sendMessage(groupId, { text: "⚠️ Masih ada game yang sedang berjalan di grup ini! Jawab dulu atau tunggu selesai." }, { quoted: msg });
    }
    
    const q = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    activeGames.set(groupId, { type: "kuis", answer: q.a.toLowerCase() });

    await sock.sendMessage(groupId, { 
      text: `🎮 *KUIS DIMULAI!*\n\n📝 *Soal:* ${q.q}\n\nKetik *!jawab [jawabanmu]* untuk menjawab!` 
    }, { quoted: msg });
  },

  tebaknomor: async (sock, msg, groupId, sender) => { 
    if (activeGames.has(groupId)) {
      return sock.sendMessage(groupId, { text: "⚠️ Masih ada game yang sedang berjalan di grup ini! Jawab dulu atau tunggu selesai." }, { quoted: msg });
    }

    const number = Math.floor(Math.random() * 100) + 1; // 1-100
    activeGames.set(groupId, { type: "tebak", answer: number.toString(), attempts: 0 });

    await sock.sendMessage(groupId, { 
      text: `🎮 *TEBAK NOMOR DIMULAI!*\n\nSaya telah memikirkan sebuah angka dari *1 sampai 100*.\nKetik *!jawab [angka]* untuk menebak!` 
    }, { quoted: msg });
  },

  jawab: async (sock, msg, groupId, sender, args) => {
    if (!activeGames.has(groupId)) {
      return sock.sendMessage(groupId, { text: "⚠️ Tidak ada game yang sedang berjalan di grup ini." }, { quoted: msg });
    }

    const game = activeGames.get(groupId);
    const answer = args.join(" ").toLowerCase();

    if (!answer) {
      return sock.sendMessage(groupId, { text: "❌ Masukkan jawabanmu! Contoh: !jawab 50" }, { quoted: msg });
    }

    if (game.type === "kuis") {
      if (answer === game.answer) {
        activeGames.delete(groupId);
        return sock.sendMessage(groupId, { 
          text: `🎉 *BENAR!* @${sender.split("@")[0]} berhasil menjawab kuis!\n\nJawaban: *${game.answer}*`,
          mentions: [sender]
        }, { quoted: msg });
      } else {
        return sock.sendMessage(groupId, { text: "❌ Salah! Coba lagi." }, { quoted: msg });
      }
    } 
    
    else if (game.type === "tebak") {
      game.attempts += 1;
      const guess = parseInt(answer);
      const target = parseInt(game.answer);

      if (isNaN(guess)) return sock.sendMessage(groupId, { text: "❌ Masukkan tebakan berupa angka!" }, { quoted: msg });

      if (guess === target) {
        activeGames.delete(groupId);
        return sock.sendMessage(groupId, { 
          text: `🎉 *TEBAKAN BENAR!*\n\n@${sender.split("@")[0]} berhasil menebak angka *${target}* dalam ${game.attempts} percobaan!`,
          mentions: [sender]
        }, { quoted: msg });
      } else if (guess < target) {
        return sock.sendMessage(groupId, { text: `📈 Angka terlalu KECIL! Coba lagi. (Percobaan ke-${game.attempts})` }, { quoted: msg });
      } else {
        return sock.sendMessage(groupId, { text: `📉 Angka terlalu BESAR! Coba lagi. (Percobaan ke-${game.attempts})` }, { quoted: msg });
      }
    }
  }
};
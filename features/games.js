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
      return sock.sendMessage(groupId, { text: "❌ Format lu berantakan ngab!\nContoh: !poll Mabar jam brapa? | Jam 7 | Jam 8" });
    }
    const text = args.join(" ");
    const split = text.split("|").map(s => s.trim()).filter(s => s);
    
    // WhatsApp butuh minimal 2 opsi untuk sebuah polling
    if (split.length < 3) {
      return sock.sendMessage(groupId, { text: "❌ Minimal 2 opsi lah bambang! Kalo 1 doang namanya bukan milih!\nContoh: !poll Pertanyaan | Opsi 1 | Opsi 2" });
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
      await sock.sendMessage(groupId, { text: "❌ Waduh gagal bikin polling njir, coba cek lagi formatnya." });
    }
  },
  endPoll: async (sock, groupId, msg) => {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    if (!context || !context.quotedMessage) {
      return sock.sendMessage(groupId, { text: "❌ Quote dulu pesannya ngab! Reply polling yang mau ditutup pake !endpoll" });
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
      await sock.sendMessage(groupId, { text: "✅ Polling kelar! Pesan udah gue hapus bos." });
    } catch (e) {
      console.log("Error endPoll:", e);
      await sock.sendMessage(groupId, { text: "❌ Gagal bos nutup polling njir. Lu yakin itu polling dari gue?" });
    }
  },

  startQuiz: async (sock, msg, groupId) => { 
    if (activeGames.has(groupId)) {
      return sock.sendMessage(groupId, { text: "⚠️ Woy selesain dulu game yang lagi jalan! Sabar napa." }, { quoted: msg });
    }
    
    const q = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    activeGames.set(groupId, { type: "kuis", answer: q.a.toLowerCase() });

    await sock.sendMessage(groupId, { 
      text: `🎮 *KUIS DIMULAI NJIR!*\n\n📝 *Soal:* ${q.q}\n\nKetik *!jawab [jawabanlu]* cepetan!` 
    }, { quoted: msg });
  },

  tebaknomor: async (sock, msg, groupId, sender) => { 
    if (activeGames.has(groupId)) {
      return sock.sendMessage(groupId, { text: "⚠️ Woy selesain dulu game yang lagi jalan! Sabar napa." }, { quoted: msg });
    }

    const number = Math.floor(Math.random() * 100) + 1; // 1-100
    activeGames.set(groupId, { type: "tebak", answer: number.toString(), attempts: 0 });

    await sock.sendMessage(groupId, { 
      text: `🎮 *TEBAK NOMOR COK!*\n\nGue lagi mikirin angka dari *1 ampe 100*.\nKetik *!jawab [angka]*! Siapa cepat dia dapat!` 
    }, { quoted: msg });
  },

  jawab: async (sock, msg, groupId, sender, args) => {
    if (!activeGames.has(groupId)) {
      return sock.sendMessage(groupId, { text: "⚠️ Kaga ada game yang jalan kocak, mau jawab apaan lu." }, { quoted: msg });
    }

    const game = activeGames.get(groupId);
    const answer = args.join(" ").toLowerCase();

    if (!answer) {
      return sock.sendMessage(groupId, { text: "❌ Jawaban lu mana njir? Contoh: !jawab 50" }, { quoted: msg });
    }

    if (game.type === "kuis") {
      if (answer === game.answer) {
        activeGames.delete(groupId);
        return sock.sendMessage(groupId, { 
          text: `🎉 *BENER ANJAY!* @${sender.split("@")[0]} pinter bet dah!\n\nJawaban: *${game.answer}*`,
          mentions: [sender]
        }, { quoted: msg });
      } else {
        return sock.sendMessage(groupId, { text: "❌ Salah kocak! Mikir lagi awkwokwok." }, { quoted: msg });
      }
    } 
    
    else if (game.type === "tebak") {
      game.attempts += 1;
      const guess = parseInt(answer);
      const target = parseInt(game.answer);

      if (isNaN(guess)) return sock.sendMessage(groupId, { text: "❌ Pake angka bambang, bukan huruf!" }, { quoted: msg });

      if (guess === target) {
        activeGames.delete(groupId);
        return sock.sendMessage(groupId, { 
          text: `🎉 *JACKPOT!* Tebakan lu bener!\n\n@${sender.split("@")[0]} nebak angka *${target}* setelah ${game.attempts} kali ngide!`,
          mentions: [sender]
        }, { quoted: msg });
      } else if (guess < target) {
        return sock.sendMessage(groupId, { text: `📈 Kurang gede bang! Naikin lagi angkanya. (Niat ke-${game.attempts})` }, { quoted: msg });
      } else {
        return sock.sendMessage(groupId, { text: `📉 Kegedean njir! Turunin dikit. (Niat ke-${game.attempts})` }, { quoted: msg });
      }
    }
  }
};
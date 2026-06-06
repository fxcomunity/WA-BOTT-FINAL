// features/fun.js — Fitur Hiburan & Mini Game (Edisi Brutal & Gaul)

const quotes = [
  "Lu kira hidup lu sinetron? Bangun bego, kerja keras!",
  "Gak usah sok puitis kalo dompet masih tipis.",
  "Muka pas-pasan minimal akhlak bagus, jangan jelek luar dalam.",
  "Rezeki udah ada yang ngatur, tapi kalo lu rebahan doang ya ngatur gimana ngab?",
  "Uang bukan segalanya, tapi kalo ga ada uang lu bukan siapa-siapa anjir.",
  "Jangan pantang menyerah! Kecuali sadar diri emang ga mampu, nah itu mending nyerah aja."
];

const fakta = [
  "Lu tau ga? Otak lu sama otak udang gedean otak udang.",
  "Orang yang suka ngomong 'aku sih orangnya blak-blakan' biasanya emang toxic aja.",
  "Tidur terlalu lama bikin lu bodoh, pantes lu kayak gini.",
  "Jomblo terlalu lama bisa bikin lu lupa cara pdkt.",
  "Mau lu mandi kembang 7 rupa juga kalo nasib jelek ya jelek aja."
];

const apakah = [
  "Yoi, bener banget!",
  "Sadar diri bego, jelas enggak lahh!",
  "Mungkin iya sih.",
  "Gak usah nanya yang aneh-aneh, udah pasti GAK!",
  "Bisa jadi, kalo lu lagi hoki.",
  "Mustahil anjir!",
  "Nanya mulu lu, yakali!"
];

const kapankah = [
  "Besok juga kejadian.",
  "Lusa ngab.",
  "Nunggu lu glowing, yang mana itu ga mungkin.",
  "Tahun depan lah anjir.",
  "Ngimpi lu? Gak bakal kejadian!",
  "Sebentar lagi, tunggu aja.",
  "Pas babi bisa terbang."
];

const khodam = [
  "Macan Cisewu 🐯", "Knalpot Racing 🏍️", "Sempak Firaun 🩲", "Panci Gosong 🍳", 
  "Kipas Angin Cosmos 🌬️", "Jin Botol Bekas 🧞", "Siluman Lele 🐟", "Tuyul Muallaf 👼",
  "Nyi Roro Kidul 🌊", "Bapak Lu 👨", "Biji Ketumbar 🌰", "Kecoak Terbang 🪳", "Kosong (Sama Kaya Otak Lu) 👻"
];

const truthQuestions = [
  "Siapa orang di grup ini yang paling lu pengen kick tapi gak enak ngomongnya?",
  "Apa hal paling memalukan yang pernah lu lakuin pas lagi boker/di kamar mandi?",
  "Pernah gak lu diem-diem nge-stalk chat mantan pake akun palsu? Ngaku lu!",
  "Siapa orang terakhir yang lu kepoin profil WA-nya hari ini?",
  "Pernah gak lu bohong ke temen lu demi bisa rebahan di rumah? Bohong apaan?",
  "Apa rahasia paling memalukan yang gak ada satu pun orang di grup ini yang tau?",
  "Kapan terakhir kali lu nangis bombay karena masalah sepele/galau gak jelas?",
  "Siapa orang di grup ini yang menurut lu paling caper/sok asik?",
  "Pernah gak lu minjem duit ke temen tapi pura-pura lupa bayar?"
];

const dareChallenges = [
  "SS (Screenshot) chat terakhir lu sama emak lu, terus kirim ke grup ini!",
  "Voice Note nyanyi lagu balonku ada lima tapi pake huruf vokal O semua selama 15 detik!",
  "Chat mantan lu sekarang juga bilang 'Gue kangen, tapi boong', SS kirim kesini!",
  "Kirim foto muka jelek lu sekarang tanpa filter/editan di grup ini!",
  "Pura-pura kesurupan lewat Voice Note selama 10 detik!",
  "Tag satu orang di grup ini yang menurut lu paling cakep/cantik, terus bilang 'Maukah kamu jadi babuku?'",
  "SS riwayat pencarian (history) browser lu 5 menit terakhir, kirim ke grup!",
  "Voice Note desah manja selama 5 detik, jangan malu-malu kucing!"
];

// Cooldown map for menfess (sender JID -> timestamp of last use)
const menfessCooldown = {};

module.exports = {
  getTruth: async (sock, msg) => {
    const t = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `🎯 *TRUTH:* \n\n"${t}"` }, { quoted: msg });
  },
  getDare: async (sock, msg) => {
    const d = dareChallenges[Math.floor(Math.random() * dareChallenges.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `🔥 *DARE:* \n\n"${d}"` }, { quoted: msg });
  },
  getQuote: async (sock, msg) => {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `📜 *Quotes Brutal:*\n\n"${q}"` }, { quoted: msg });
  },
  getFakta: async (sock, msg) => {
    const f = fakta[Math.floor(Math.random() * fakta.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `🧠 *Fakta Nyelekit:*\n\n${f}` }, { quoted: msg });
  },
  getApakah: async (sock, msg, question) => {
    if (!question) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Nanya apaan woy? Yang jelas! Contoh: !apakah aku ganteng?" }, { quoted: msg });
    const a = apakah[Math.floor(Math.random() * apakah.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `🎱 *Pertanyaan:* ${question}\n*Jawaban:* ${a}` }, { quoted: msg });
  },
  getKapankah: async (sock, msg, question) => {
    if (!question) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Nanya apaan anjir? Contoh: !kapankah aku kaya?" }, { quoted: msg });
    const k = kapankah[Math.floor(Math.random() * kapankah.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Pertanyaan:* ${question}\n*Jawaban:* ${k}` }, { quoted: msg });
  },
  getRate: async (sock, msg, text) => {
    if (!text) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Mau ngerate apaan lu? Contoh: !rate Muka Mamat" }, { quoted: msg });
    const rate = Math.floor(Math.random() * 101);
    let komen = "";
    if(rate < 30) komen = "Ampun dah jelek banget 🤮";
    else if(rate < 70) komen = "B aja sih ngab 🗿";
    else komen = "Anjay GG gaming 🔥";
    await sock.sendMessage(msg.key.remoteJid, { text: `📊 *Rate untuk ${text}:*\n\n*${rate}%*\n${komen}` }, { quoted: msg });
  },
  getJodoh: async (sock, msg) => {
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length < 2) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Woy tag 2 orang lah bego! Mau dicek sama angin? Contoh: !jodoh @user1 @user2" }, { quoted: msg });
    const u1 = mentions[0].split("@")[0];
    const u2 = mentions[1].split("@")[0];
    const persen = Math.floor(Math.random() * 101);
    let komen = "";
    if (persen > 80) komen = "Anjay mabar! Buruan ke KUA ngab, gass! 💍";
    else if (persen > 50) komen = "Boleh lah, pepet terus mumpung dia lengah! 🔥";
    else if (persen > 20) komen = "Yaelah sadar diri wir, lu jauh di bawah stlur dia. 😅";
    else komen = "Mundur wir! Muka lu kayak keset welcome, jangan ngimpi! 💔";
    
    const textMsg = `╭━━• [ 💘 *CEK JODOH* ] •━━╮\n┃\n┃ 👩‍❤️‍👨 @${u1} & @${u2}\n┃ 📊 *Kecocokan:* ${persen}%\n┃ 💬 *Catatan:* ${komen}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    await sock.sendMessage(msg.key.remoteJid, { text: textMsg, mentions: [mentions[0], mentions[1]] }, { quoted: msg });
  },
  getCekKhodam: async (sock, msg, nama) => {
    if (!nama) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Nama sapa yang mau dicek woy? Contoh: !cekkhodam Budi" }, { quoted: msg });
    const k = khodam[Math.floor(Math.random() * khodam.length)];
    const textMsg = `╭━━• [ 👻 *CEK KHODAM* ] •━━╮\n┃\n┃ 👤 *Target:* ${nama}\n┃ 🔮 *Khodam:* ${k}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
    await sock.sendMessage(msg.key.remoteJid, { text: textMsg }, { quoted: msg });
  },
  getBisakah: async (sock, msg, question) => {
    if (!question) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Pertanyaannya mana anjir? Contoh: !bisakah aku terbang?" }, { quoted: msg });
    const b = ["Bisa dong bos!", "Yakali ga bisa.", "Mungkin aja bisa sih.", "Diusahain aja dulu ngab.", "Kagak bakal bisa woy sadar diri!", "Ngimpi lu sana, jelas kagak!", "Muka kek lu mana bisa."];
    const ans = b[Math.floor(Math.random() * b.length)];
    await sock.sendMessage(msg.key.remoteJid, { text: `🎱 *Pertanyaan:* Bisakah ${question}\n*Jawaban:* ${ans}` }, { quoted: msg });
  },
  sendMenfess: async (sock, msg, sender, args) => {
    // Cooldown: 1 minute per sender
    const now = Date.now();
    if (menfessCooldown[sender] && now - menfessCooldown[sender] < 60000) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Sabar njir, cooldown 1 menit!" }, { quoted: msg });
    }
    menfessCooldown[sender] = now;
    const raw = args.join(" ");
    if (!raw.includes("|")) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format salah njir! Pake: !menfess nomor_tujuan | pesan\nContoh: !menfess 628123456789 | Woi nyet balikin duit gue" }, { quoted: msg });
    
    let [target, ...pesanArr] = raw.split("|");
    target = target.trim().replace(/[^0-9]/g, "");
    const pesan = pesanArr.join("|").trim();
    
    if (!target || !pesan) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Nomor atau pesannya mana ngab?" }, { quoted: msg });
    
    // Validasi nomor (biasanya nomor WA minimal 10 digit)
    if (target.length < 10) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Nomor tujuannya kaga bener njir!" }, { quoted: msg });
    
    const targetJid = target + "@s.whatsapp.net";
    const menfessMsg = `╭━━• [ 💌 *SURAT KALENG MASUK* ] •━━╮\n┃\n┃ Eh ada yg nitip pesen rahasia nih buat lu:\n┃ \n┃ 💬 "${pesan}"\n┃ \n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n_Pesan ini dikirim anonim dari JackBOT. Jgn nanya ini sapa, gue jg kaga bakal ngasi tau._`;
    
    try {
      await sock.sendMessage(targetJid, { text: menfessMsg });
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Sip ngab! Surat kaleng udah nyampe ke ${target} diem-diem bae.` }, { quoted: msg });
    } catch (e) {
      console.error("Gagal bos ngirim menfess:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal bos ngirim menfess njir. Pastiin nomornya beneran pake WA, bukan nomor dukun." }, { quoted: msg });
    }
  },
  imagine: async (sock, msg, prompt) => {
    if (!prompt) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kasih teks/deskripsinya dong! Contoh: !imagine kucing cyberpunk" }, { quoted: msg });
    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });
      const { simulateProgress } = require("./utils");
      const progress = await simulateProgress(sock, msg.key.remoteJid, msg, "🎨 AI sedang menggambar impianmu...");
      
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&nologo=true`;
      
      await progress.stop(true);
      await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: imageUrl }, 
        caption: `✨ *AI IMAGINE* ✨\n\n📝 Prompt: _${prompt}_\n👤 Developer: 陈嘉杰 | Val` 
      }, { quoted: msg });
    } catch (e) {
      console.log("Imagine error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal bos ngegambar njir. Server lagi ampas ato lu nyari gambar yg dilarang agama." }, { quoted: msg });
    }
  }
};

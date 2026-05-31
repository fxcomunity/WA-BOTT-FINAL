const axios = require('axios');
const config = require('../config');

async function askGemini(question, key) {
  const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    contents: [{ parts: [{ text: question }] }]
  }, { timeout: 15000 });
  return res.data.candidates[0].content.parts[0].text;
}

async function askOpenAI(question, key) {
  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: question }]
  }, { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 });
  return res.data.choices[0].message.content;
}

async function askDeepSeek(question, key) {
  const res = await axios.post('https://api.deepseek.com/chat/completions', {
    model: "deepseek-chat",
    messages: [{ role: "user", content: question }]
  }, { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 });
  return res.data.choices[0].message.content;
}

async function askMistral(question, key) {
  const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
    model: "mistral-small-latest",
    messages: [{ role: "user", content: question }]
  }, { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 });
  return res.data.choices[0].message.content;
}

module.exports = {
  ask: async (question) => {
    const keys = config.apiKeys;
    let errors = [];

    // 1. Coba Gemini
    if (keys.gemini) {
      try {
        return await askGemini(question, keys.gemini);
      } catch (err) {
        errors.push("Gemini: " + (err.response?.status || err.message));
        console.log("⚠️ Gemini gagal, mencoba fallback ke OpenAI...");
      }
    }

    // 2. Fallback ke OpenAI
    if (keys.openai) {
      try {
        return await askOpenAI(question, keys.openai);
      } catch (err) {
        errors.push("OpenAI: " + (err.response?.status || err.message));
        console.log("⚠️ OpenAI gagal, mencoba fallback ke DeepSeek...");
      }
    }

    // 3. Fallback ke DeepSeek
    if (keys.deepseek) {
      try {
        return await askDeepSeek(question, keys.deepseek);
      } catch (err) {
        errors.push("DeepSeek: " + (err.response?.status || err.message));
        console.log("⚠️ DeepSeek gagal, mencoba fallback ke Mistral...");
      }
    }

    // 4. Fallback ke Mistral
    if (keys.mistral) {
      try {
        return await askMistral(question, keys.mistral);
      } catch (err) {
        errors.push("Mistral: " + (err.response?.status || err.message));
        console.log("⚠️ Mistral gagal.");
      }
    }

    if (!keys.gemini && !keys.openai && !keys.deepseek && !keys.mistral) {
      return "⚠️ Kunci API belum diisi di file .env! Bot tidak bisa memproses balasan AI.";
    }

    console.error("AI Fallback Exhausted Errors:", errors);
    return "Maaf, semua server AI sedang sibuk atau mencapai limit saat ini. Coba tanyakan lagi nanti ya! 😢";
  }
};
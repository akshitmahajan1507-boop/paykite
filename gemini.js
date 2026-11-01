require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash"];

function shortError(e) {
  const m = String(e.message || e);
  const code = m.match(/"code":\s*(\d+)/);
  return code ? "code " + code[1] : m.slice(0, 80);
}

async function generate({ contents, config }) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({ model, contents, config });
      } catch (e) {
        lastErr = e;
        console.log(`   ⚠️ ${model} fail (${shortError(e)})`);
        // Model hi exist nahi karta (404): dobara try karne ka faayda nahi
        if (String(e.message).includes('"code":404')) break;
        const wait = String(e.message).includes('"code":429') ? 20000 : 2500;
        if (wait > 5000) console.log(`   ⏳ ${wait / 1000}s ruk raha hoon (limit)`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

module.exports = { generate };
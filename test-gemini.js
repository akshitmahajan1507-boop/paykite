require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "Say hello in one short sentence.",
  });
  console.log("✅", response.text);
}

main().catch((e) => console.error("❌", e.message));
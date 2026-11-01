const { Type } = require("@google/genai");
const { generate } = require("./gemini");
const { PRODUCTS } = require("./catalog");

// Catalog ke saare shabd (naam + tags) jinse product pehchana ja sake
const KEYWORDS = [
  ...new Set(
    PRODUCTS.flatMap((p) => [...p.tags, ...p.name.toLowerCase().split(/\s+/)])
      .map((w) => w.replace(/[^a-z]/g, ""))
      .filter((w) => w.length > 2)
  ),
];

// Step 1: bina AI ke, code se
function parseWithCode(text) {
  const t = text.toLowerCase();
  const found = KEYWORDS.filter((k) => new RegExp("\\b" + k).test(t));
  if (found.length === 0) return null;

  const num = t.match(/(\d+(?:\.\d+)?)/);
  return { query: found.join(" "), maxBudget: num ? Number(num[1]) : 50, by: "code" };
}

// Step 2: code samajh na paye to Gemini (sirf 1 call)
async function parseWithGemini(text) {
  const response = await generate({
    contents: [{ role: "user", parts: [{ text }] }],
    config: {
      systemInstruction:
        "User ek product kharidna chahta hai. Usse nikalo: query (product ka English naam, " +
        "jaise 'headphones') aur maxBudget (USD number; na bataya ho to 50). Sirf JSON do.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING },
          maxBudget: { type: Type.NUMBER },
        },
        required: ["query", "maxBudget"],
      },
    },
  });
  const out = JSON.parse(response.text);
  return { query: String(out.query), maxBudget: Number(out.maxBudget) || 50, by: "gemini" };
}

async function parseRequest(text) {
  const byCode = parseWithCode(text);
  if (byCode) return byCode;
  try {
    return await parseWithGemini(text);
  } catch {
    return null; // dono fail: server user se saaf bolne ko kahega
  }
}

module.exports = { parseRequest };
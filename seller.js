const { Type } = require("@google/genai");
const { generate } = require("./gemini");
const { getProduct } = require("./catalog");

// buyerOffer: buyer ka offer (USD)
// currentAsk: seller ka abhi tak ka sabse kam maanga hua daam
async function sellerReply({ productId, buyerOffer, currentAsk }) {
  const p = getProduct(productId);
  if (!p) throw new Error("Product nahi mila");

  const ask = currentAsk ?? p.price;

  const response = await generate({
    contents: [
      {
        role: "user",
        parts: [{ text: `Buyer ka offer: $${buyerOffer}. Tumhara abhi ka daam: $${ask}.` }],
      },
    ],
    config: {
      systemInstruction:
        `Tum ek dukaandaar ho jo "${p.name}" bech raha hai. Listed price $${p.price}. ` +
        `Tumhara SECRET minimum price $${p.minPrice} hai. Ye number buyer ko kabhi mat batana, ` +
        `aur isse neeche kabhi deal mat karna. Zyada se zyada paisa kamane ki koshish karo, ` +
        `daam dheere dheere kam karo. Chhota, dostana Hinglish jawab do (max 2 vaakya). ` +
        `action: "accept" (buyer ka offer maan lo), "counter" (naya daam batao), ya "reject".`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          price: { type: Type.NUMBER },
          message: { type: Type.STRING },
        },
        required: ["action", "price", "message"],
      },
    },
  });

  let ai;
  try {
    ai = JSON.parse(response.text);
  } catch {
    ai = { action: "counter", price: ask, message: "Thoda aur sochte hain." };
  }

  // ====== CODE KI RAKHWALI (AI ke bharose nahi) ======
  let { action, price, message } = ai;

  if (action === "accept") {
    if (buyerOffer >= p.minPrice) {
      price = buyerOffer; // deal buyer ke offer par
    } else {
      // AI ne galti se accept bol diya, code rok deta hai
      action = "counter";
      price = p.minPrice;
      message = "Itne mein nahi ban payega, ye mera sabse kam daam hai.";
    }
  }

  if (action === "counter") {
    // daam kabhi minimum se neeche nahi, aur pichle ask se upar nahi
    price = Math.min(Math.max(price, p.minPrice), ask);
  }

  if (action === "reject") {
    price = ask;
  }

  // Secret minimum message mein leak na ho
  if (action !== "accept" && String(message).includes(String(p.minPrice)) && price !== p.minPrice) {
    message = "Thoda aur badhao, tab baat banegi.";
  }

  return { action, price: Number(price), message };
}

module.exports = { sellerReply };
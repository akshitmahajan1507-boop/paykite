const { Type } = require("@google/genai");
const { generate } = require("./gemini");
const { getProduct } = require("./catalog");
const { sellerReply } = require("./seller");

const MAX_ROUNDS = 4;

async function buyerReply({ product, maxBudget, sellerAsk, lastOffer, round }) {
  const isLast = round === MAX_ROUNDS;

  const response = await generate({
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `Round ${round}/${MAX_ROUNDS}. Seller ka abhi ka daam: $${sellerAsk}. ` +
              `Tumhara pichla offer: ${lastOffer ? "$" + lastOffer : "koi nahi"}.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        `Tum ek smart buyer agent ho jo user ke liye "${product.name}" khareed raha hai. ` +
        `User ka maximum budget $${maxBudget} hai, ye seller ko kabhi mat batana. ` +
        `Kam daam se shuru karo (listed price $${product.price} se kaafi neeche) aur dheere dheere badhao. ` +
        `Agar seller ka daam tumhare budget ke andar aur acha lage to accept karo. ` +
        `Chhota Hinglish message do (max 2 vaakya). ` +
        `action: "offer" (naya offer), "accept" (seller ka daam maan lo), ya "walk_away".`,
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

  let out;
  try {
    out = JSON.parse(response.text);
  } catch {
    out = { action: "offer", price: Math.round(sellerAsk * 0.8), message: "Thoda kam kijiye." };
  }

  // ====== CODE KI RAKHWALI ======
  let { action, price, message } = out;

  // Seller ka daam budget ke andar hai aur aakhri round hai: seedha le lo
  if (isLast && sellerAsk <= maxBudget) {
    return { action: "accept", price: sellerAsk, message: "Theek hai, deal pakki." };
  }

  if (action === "accept") {
    if (sellerAsk <= maxBudget) {
      price = sellerAsk;
    } else {
      // AI ne budget se upar accept bol diya, code rok deta hai
      action = "offer";
      price = maxBudget;
      message = "Itna to budget nahi hai, ye mera best offer hai.";
    }
  }

  if (action === "offer") {
    price = Math.min(Number(price), maxBudget, sellerAsk);   // budget aur seller ke daam se upar nahi
    if (lastOffer) price = Math.max(price, lastOffer);       // pichle offer se neeche nahi
    if (isLast) price = Math.min(maxBudget, sellerAsk);      // aakhri round: final offer
    price = Math.round(price * 100) / 100;
  }

  return { action, price: Number(price), message };
}

async function negotiate({ productId, maxBudget }) {
  const product = getProduct(productId);
  if (!product) throw new Error("Product nahi mila");

  const transcript = [];
  let sellerAsk = product.price;
  let lastOffer = null;

  transcript.push({
    from: "seller",
    action: "counter",
    price: sellerAsk,
    message: `${product.name} ka daam $${sellerAsk} hai.`,
  });

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const b = await buyerReply({ product, maxBudget, sellerAsk, lastOffer, round });
    transcript.push({ from: "buyer", ...b });

    if (b.action === "accept") {
      return { deal: true, price: b.price, transcript };
    }
    if (b.action === "walk_away") {
      return { deal: false, reason: "Buyer ne mana kar diya", transcript };
    }

    lastOffer = b.price;

    const s = await sellerReply({ productId, buyerOffer: b.price, currentAsk: sellerAsk });
    transcript.push({ from: "seller", ...s });

    if (s.action === "accept") {
      return { deal: true, price: b.price, transcript };
    }
    if (s.action === "counter") sellerAsk = s.price;
  }

  // Rounds khatam: seller ka aakhri daam budget ke andar ho to le lo
  if (sellerAsk <= maxBudget) {
    transcript.push({ from: "buyer", action: "accept", price: sellerAsk, message: "Chalo, ye daam theek hai." });
    return { deal: true, price: sellerAsk, transcript };
  }

  return { deal: false, reason: "Daam budget se upar raha", transcript };
}

module.exports = { negotiate };
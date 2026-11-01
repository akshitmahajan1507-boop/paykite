const { getProduct } = require("./catalog");

const MAX_ROUNDS = 4;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Hinglish messages ----------
const BUYER_OFFER_MSG = [
  (p) => `Bhai $${p} mein de do, main abhi le leta hoon.`,
  (p) => `$${p} tak ja sakta hoon, kya kehte ho?`,
  (p) => `Thoda kam kijiye, $${p} mein baat banti hai?`,
];
const SELLER_COUNTER_MSG = [
  (p) => `Itne mein to nuksan hoga bhai, aapke liye $${p} kar deta hoon.`,
  (p) => `Quality top hai, $${p} se neeche nahi ho payega.`,
  (p) => `Chalo aapke liye special, $${p}. Bataiye?`,
];
const SELLER_ACCEPT_MSG = [
  (p) => `Chalo bhai, $${p} mein deal pakki!`,
  (p) => `Theek hai, aapki baat maan leta hoon. $${p} final.`,
];
const BUYER_ACCEPT_MSG = [
  (p) => `Theek hai, $${p} mein deal karte hain.`,
  (p) => `Done! $${p} mein le leta hoon.`,
];

// ---------- Seller ka strategy ----------
// Seller apna daam dheere dheere minimum ki taraf kam karta hai, minimum se neeche kabhi nahi.
function sellerNextAsk(currentAsk, minPrice) {
  const next = currentAsk - (currentAsk - minPrice) * 0.5;
  return Math.max(minPrice, Math.min(currentAsk, Math.ceil(next)));
}

function sellerRespond(product, buyerOffer, currentAsk) {
  const nextAsk = sellerNextAsk(currentAsk, product.minPrice);

  // Offer us daam ke barabar ya upar hai jo seller waise bhi maangta, to accept
  if (buyerOffer >= nextAsk && buyerOffer >= product.minPrice) {
    return { action: "accept", price: buyerOffer, message: pick(SELLER_ACCEPT_MSG)(buyerOffer) };
  }
  return { action: "counter", price: nextAsk, message: pick(SELLER_COUNTER_MSG)(nextAsk) };
}

// ---------- Buyer ka strategy ----------
// Buyer kam se shuru karta hai, har round thoda badhata hai, budget se upar kabhi nahi.
function buyerPlannedOffer(product, maxBudget, round) {
  const cap = Math.min(maxBudget, product.price);
  const start = Math.min(cap, Math.round(product.price * 0.62));
  const step = (cap - start) * ((round - 1) / (MAX_ROUNDS - 1));
  return Math.min(cap, Math.round(start + step));
}

function buyerRespond(product, maxBudget, sellerAsk, lastOffer, round) {
  const planned = buyerPlannedOffer(product, maxBudget, round);
  const isLast = round === MAX_ROUNDS;

  // Seller ka daam budget ke andar hai aur hamare plan ke aas-paas ya aakhri round: le lo
  if (sellerAsk <= maxBudget && (sellerAsk <= planned * 1.05 || isLast)) {
    return { action: "accept", price: sellerAsk, message: pick(BUYER_ACCEPT_MSG)(sellerAsk) };
  }

  let offer = planned;
  if (lastOffer) offer = Math.max(offer, lastOffer);   // pichle offer se neeche nahi
  offer = Math.min(offer, maxBudget, sellerAsk);       // budget aur seller ke daam se upar nahi
  return { action: "offer", price: offer, message: pick(BUYER_OFFER_MSG)(offer) };
}

// ---------- Poori negotiation ----------
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
    const b = buyerRespond(product, maxBudget, sellerAsk, lastOffer, round);
    transcript.push({ from: "buyer", ...b });

    if (b.action === "accept") {
      // Code ki aakhri jaanch
      if (b.price > maxBudget || b.price < product.minPrice) break;
      return { deal: true, price: b.price, transcript };
    }

    lastOffer = b.price;
    const s = sellerRespond(product, b.price, sellerAsk);
    transcript.push({ from: "seller", ...s });

    if (s.action === "accept") {
      if (s.price > maxBudget || s.price < product.minPrice) break;
      return { deal: true, price: s.price, transcript };
    }
    sellerAsk = s.price;
  }

  return { deal: false, reason: "Daam budget se upar raha", transcript };
}

module.exports = { negotiate };
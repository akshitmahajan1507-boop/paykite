const { sellerReply } = require("./seller");

async function main() {
  // Wireless Headphones: listed $45, secret minimum $36
  const offers = [20, 30, 40];

  for (const offer of offers) {
    const r = await sellerReply({ productId: "p1", buyerOffer: offer });
    console.log(`\n💰 Buyer offer: $${offer}`);
    console.log(`🛒 Seller: [${r.action}] $${r.price} - ${r.message}`);
  }
}

main().catch((e) => console.error("❌", e.message));
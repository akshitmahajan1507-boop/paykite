const { negotiate } = require("./negotiate");

async function run(maxBudget) {
  console.log(`\n==== Wireless Headphones, buyer budget $${maxBudget} ====`);
  const r = await negotiate({ productId: "p1", maxBudget });

  r.transcript.forEach((t) => {
    const who = t.from === "buyer" ? "🧑 Buyer " : "🛒 Seller";
    console.log(`${who} [${t.action}] $${t.price} - ${t.message}`);
  });

  console.log(r.deal ? `\n✅ DEAL: $${r.price}` : `\n❌ NO DEAL: ${r.reason}`);
}

async function main() {
  // await run(40); // ye pass ho chuka hai, abhi band
  await run(30); // minimum se neeche: NO DEAL aana chahiye
}

main().catch((e) => console.error("❌", e.message));
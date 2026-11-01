const { negotiate } = require("./negotiate-lite");

async function run(maxBudget) {
  console.log(`\n==== Wireless Headphones (listed $45), buyer budget $${maxBudget} ====`);
  const r = await negotiate({ productId: "p1", maxBudget });

  r.transcript.forEach((t) => {
    const who = t.from === "buyer" ? "🧑 Buyer " : "🛒 Seller";
    console.log(`${who} [${t.action}] $${t.price} - ${t.message}`);
  });

  console.log(r.deal ? `\n✅ DEAL: $${r.price}` : `\n❌ NO DEAL: ${r.reason}`);
}

async function main() {
  await run(40); // seller ka minimum $36: deal honi chahiye
  await run(30); // minimum se neeche: NO DEAL
  await run(60); // budget kaafi hai
}

main();
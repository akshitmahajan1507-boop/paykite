const readline = require("readline");
const { startPurchase, finalizePurchase } = require("./shop");
const { getState } = require("./rules");

function waitEnter(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, () => { rl.close(); res(); }));
}

async function main() {
  const r = await startPurchase({
    query: "headphones",
    maxBudget: 40,
    baseUrl: "http://localhost:3000",
  });

  console.log("Status:", r.status);
  (r.transcript || []).forEach((t) => {
    console.log(`${t.from === "buyer" ? "🧑 Buyer " : "🛒 Seller"} [${t.action}] $${t.price} - ${t.message}`);
  });

  if (r.status !== "ready_to_pay") {
    console.log("Message:", r.message);
    return;
  }

  console.log(`\n💰 Deal: ${r.product.name} @ $${r.price}`);
  console.log("👉 Ye link Incognito mein kholo, US Personal sandbox account se Pay Now dabao:\n", r.approveUrl);
  console.log("\n(Browser 'localhost refused to connect' dikhaye to theek hai.)");

  await waitEnter("\nApprove karne ke baad yahan Enter dabao... ");

  const f = await finalizePurchase(r.orderId);
  console.log("\nFinal:", f);
  console.log("Budget state:", { spent: getState().spent, left: getState().left });
}

main().catch((e) => console.error("❌", e.message));
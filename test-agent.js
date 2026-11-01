const readline = require("readline");
const { runAgent, confirmAction } = require("./agent");

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a); }));
}

async function main() {
  const msg = process.argv[2] || "Priya ko 5 dollar bhejo";
  console.log("👤 You:", msg);

  const r = await runAgent(msg);

  if (r.type === "text") {
    console.log("\n🤖 Agent:", r.text);
    return;
  }

  // Confirm wala case
  console.log("\n⚠️ ", r.message);
  const ans = await ask("Confirm? (y/n): ");
  if (ans.trim().toLowerCase() === "y") {
    const result = await confirmAction(r.action);
    console.log("✅ Result:", result);
  } else {
    console.log("❌ Cancel kar diya. Koi paisa nahi gaya.");
  }
}

main().catch((e) => console.error("❌", e.message));
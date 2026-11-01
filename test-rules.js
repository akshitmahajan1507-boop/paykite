const { checkRules, recordSpend, getState } = require("./rules");

function show(label, price) {
  const r = checkRules(price);
  console.log(`${label} ($${price}):`, r.ok ? "✅ allowed" : "❌ " + r.reason);
}

show("Test 1: chhoti kharid", 36);
show("Test 2: limit se upar", 60);
show("Test 3: galat amount", -5);

recordSpend(50, "item A");
recordSpend(50, "item B");
recordSpend(50, "item C");
recordSpend(40, "item D"); // total 190

show("Test 4: budget kam pad jayega", 20); // 190 + 20 = 210 > 200
show("Test 5: ek aur chhoti kharid", 10);  // 190 + 10 = 200, allowed

console.log("\nState:", getState());
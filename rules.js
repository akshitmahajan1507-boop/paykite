// Tumhari "dor": ye limits code mein hain, AI inhe badal nahi sakta
const rules = {
  maxPerOrder: 60,     // $50 wala product pass ho, $77 aur $100 wale block hon
  monthlyBudget: 300,
};

// Is mahine ab tak kitna kharch hua (server restart par reset hota hai)
let spentThisMonth = 0;
const history = [];

function checkRules(price) {
  const amount = Number(price);

  if (!(amount > 0)) {
    return { ok: false, reason: "Amount galat hai." };
  }
  if (amount > rules.maxPerOrder) {
    return {
      ok: false,
      reason: `Ye kharid ek order ki limit ($${rules.maxPerOrder}) se upar hai.`,
    };
  }
  if (spentThisMonth + amount > rules.monthlyBudget) {
    const left = rules.monthlyBudget - spentThisMonth;
    return {
      ok: false,
      reason: `Mahine ka budget kam pad jayega. Bacha hua budget: $${left.toFixed(2)}.`,
    };
  }
  return { ok: true };
}

// Kharid poori hone par hi call karna (capture ke baad)
function recordSpend(price, label) {
  const amount = Number(price);
  spentThisMonth += amount;
  history.unshift({ time: new Date().toLocaleTimeString(), amount, label });
}

function getState() {
  return {
    ...rules,
    spent: Math.round(spentThisMonth * 100) / 100,
    left: Math.round((rules.monthlyBudget - spentThisMonth) * 100) / 100,
    history,
  };
}

module.exports = { rules, checkRules, recordSpend, getState };
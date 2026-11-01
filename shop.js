const { searchProducts, getProduct } = require("./catalog");
const { negotiate } = require("./negotiate-lite");
const { checkRules, recordSpend } = require("./rules");
const { createOrder, captureOrder } = require("./paypal");

// Approve ke intezaar wale orders server par rakhe jaate hain.
// Browser sirf orderId bhejta hai, price kabhi nahi.
const pendingOrders = new Map();

async function startPurchase({ productId, query, maxBudget, baseUrl }) {
  const budget = Number(maxBudget) > 0 ? Number(maxBudget) : 50;

  let product;
  if (productId) {
    const full = getProduct(productId);
    if (!full) return { status: "no_product", message: "Ye product nahi mila." };
    const { minPrice, ...publicInfo } = full; // seller ka secret bahar nahi jata
    product = publicInfo;
  } else {
    const results = searchProducts(query, budget);
    if (results.length === 0) {
      return { status: "no_product", message: `"${query}" ke liye koi product nahi mila.` };
    }
    product = results[0];
  }
  // Rules check 1: deal ke waqt
  const rule = checkRules(neg.price);
  if (!rule.ok) {
    return { status: "blocked", product, price: neg.price, transcript: neg.transcript, message: rule.reason };
  }

  const order = await createOrder({
    title: product.name,
    amount: neg.price,
    returnUrl: `${baseUrl}/return`,
    cancelUrl: `${baseUrl}/cancel`,
  });

  pendingOrders.set(order.orderId, { price: neg.price, title: product.name, productId: product.id });

  return {
    status: "ready_to_pay",
    product,
    price: neg.price,
    transcript: neg.transcript,
    orderId: order.orderId,
    approveUrl: order.approveUrl,
  };
}

async function finalizePurchase(orderId) {
  const pending = pendingOrders.get(orderId);
  if (!pending) return { status: "unknown", message: "Ye order nahi mila ya pehle hi ho chuka." };

  // Rules check 2: paisa katne se theek pehle
  const rule = checkRules(pending.price);
  if (!rule.ok) {
    pendingOrders.delete(orderId);
    return { status: "blocked", message: rule.reason };
  }

  const cap = await captureOrder(orderId);
  if (cap.status !== "COMPLETED") {
    return { status: "not_completed", message: `PayPal status: ${cap.status}` };
  }

  pendingOrders.delete(orderId);
  recordSpend(pending.price, pending.title);
  return { status: "paid", title: pending.title, price: pending.price, captureId: cap.captureId };
}

module.exports = { startPurchase, finalizePurchase };
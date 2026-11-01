const { createOrder } = require("./paypal");

createOrder({
  title: "Test headphones",
  amount: 20,
  returnUrl: "http://localhost:3000/return",
  cancelUrl: "http://localhost:3000/cancel",
})
  .then((r) => {
    console.log("✅ Order ban gaya:", r.orderId, r.status);
    console.log("👉 Ye link browser mein kholo:\n", r.approveUrl);
  })
  .catch((e) => console.error("❌", e.message));
  
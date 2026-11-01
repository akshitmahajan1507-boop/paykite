const { sendPayout } = require("./paypal");

sendPayout({
  email: "sb-ylw2m53613855@personal.example.com",
  amount: 10,
  note: "Test payout",
})
  .then((r) => console.log("✅ Payout gaya:", r))
  .catch((e) => console.error("❌", e.message));
const { createInvoice } = require("./paypal");

createInvoice({
  name: "Rahul",
  email: "sb-ylw2m53613855@personal.example.com",
  amount: 50,
  description: "Logo design",
})
  .then((r) => console.log("✅ Invoice ban gaya:", r))
  .catch((e) => console.error("❌", e.message));
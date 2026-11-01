const { captureOrder } = require("./paypal");

captureOrder("0LV722562G641373E")
  .then((r) => console.log("✅ Paisa kat gaya:", r))
  .catch((e) => console.error("❌", e.message));
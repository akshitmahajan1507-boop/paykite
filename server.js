require("dotenv").config();
const express = require("express");
const { parseRequest } = require("./parse");
const { startPurchase, finalizePurchase, getOrders, markCancelled } = require("./shop");
const { getState } = require("./rules");
const { PRODUCTS, registerLive } = require("./catalog");
const { searchLive } = require("./channel3");

const app = express();
app.set("trust proxy", true); // Render par sahi https link ke liye
app.use(express.json());
app.use(express.static("public"));

// Simple rate limit: ek IP se 1 minute mein max N requests
function makeLimiter(max) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < 60000);
    if (list.length >= max) {
      return res.status(429).json({
        status: "error",
        error: "Bahut zyada requests. 1 minute baad dobara try karo.",
        message: "Bahut zyada requests. 1 minute baad dobara try karo.",
      });
    }
    list.push(now);
    hits.set(req.ip, list);
    next();
  };
}
app.use("/api/shop", makeLimiter(6));
app.use("/api/live-products", makeLimiter(10));

// orderId -> { status: "waiting" | "paid" | "blocked" | "cancelled" | "error", ... }
const results = new Map();

const baseUrl = (req) => `${req.protocol}://${req.get("host")}`;

// Demo store ke products (seller ka minPrice kabhi nahi bhejte)
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS.map(({ minPrice, ...publicInfo }) => publicInfo));
});

// Channel3 ke live products
app.get("/api/live-products", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 80) || "wireless headphones";
  try {
    const items = await searchLive(q);
    registerLive(items);
    res.json(items.map(({ minPrice, ...publicInfo }) => publicInfo));
  } catch (e) {
    console.error("Channel3:", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/shop", async (req, res) => {
  try {
    const productId = req.body.productId ? String(req.body.productId) : null;
    let parsed;

    if (productId) {
      const b = Number(req.body.maxBudget);
      parsed = { query: productId, maxBudget: b > 0 ? b : 50, by: "button" };
    } else {
      const message = String(req.body.message || "").trim().slice(0, 300);
      if (!message) return res.status(400).json({ status: "error", message: "Message khali hai." });

      parsed = await parseRequest(message);
      if (!parsed) {
        return res.json({
          status: "unclear",
          message: "Samajh nahi aaya. Jaise bolo: 'headphones chahiye, 40 dollar se zyada nahi'.",
        });
      }
    }

    const r = await startPurchase({
      productId,
      query: parsed.query,
      maxBudget: parsed.maxBudget,
      baseUrl: baseUrl(req),
    });

    if (r.status === "ready_to_pay") {
      results.set(r.orderId, { status: "waiting" });
    }
    res.json({ ...r, parsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

// PayPal approve ke baad user yahan aata hai
app.get("/return", async (req, res) => {
  const orderId = String(req.query.token || "");
  try {
    const f = await finalizePurchase(orderId);
    results.set(orderId, f);
    const ok = f.status === "paid";
    res.send(page(
      ok ? "✅ Payment ho gaya" : "⚠️ Payment nahi hua",
      ok ? `${esc(f.title)} ke $${f.price} PayPal (sandbox) se pay ho gaye. Ab ye tab band karke Paykite par wapas jao.`
         : esc(f.message || "Kuch gadbad hui."),
    ));
  } catch (e) {
    console.error(e);
    results.set(orderId, { status: "error", message: e.message });
    res.send(page("❌ Error", "Payment capture mein dikkat aayi. Paykite par wapas jao."));
  }
});

app.get("/cancel", (req, res) => {
  const orderId = String(req.query.token || "");
  if (orderId) {
    results.set(orderId, { status: "cancelled" });
    markCancelled(orderId);
  }
  res.send(page("Payment cancel", "Aapne PayPal par cancel kiya. Koi paisa nahi gaya. Paykite par wapas jao."));
});

// Pehla tab ye poll karta hai
app.get("/api/order/:id", (req, res) => {
  res.json(results.get(req.params.id) || { status: "unknown" });
});

app.get("/api/state", (req, res) => res.json(getState()));
app.get("/api/orders", (req, res) => res.json(getOrders()));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(title, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title></head>
<body style="font-family:system-ui;background:#0a0e1f;color:#eef1ff;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:20px">
<div><div style="font-size:54px">🪁</div><h1>${title}</h1><p style="color:#9aa3c7;max-width:420px">${text}</p></div></body></html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🪁 Paykite chal raha hai: http://localhost:${PORT}`));
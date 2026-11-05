require("dotenv").config();

const SEARCH_URL = "https://api.trychannel3.com/v1/search";
const cache = new Map(); // query -> { t, items }  (quota bachane ke liye 10 min cache)

// Price number ya object, dono handle karo
function num(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v.replace(/[^0-9.]/g, ""));
  if (v && typeof v === "object") return num(v.price ?? v.amount ?? v.value);
  return NaN;
}

function normalize(p) {
  if (!p || !p.title) return null;
  const offers = (Array.isArray(p.offers) ? p.offers : [])
    .map((o) => ({ ...o, _price: num(o.price) }))
    .filter((o) => Number.isFinite(o._price) && o._price > 0 && (!o.currency || o.currency === "USD"));
  if (!offers.length) return null;

  const inStock = offers.filter((o) => !o.availability || /in.?stock/i.test(String(o.availability)));
  const pool = inStock.length ? inStock : offers;
  pool.sort((a, b) => a._price - b._price);
  const offer = pool[0];

  const price = Math.round(offer._price);
  if (price < 3 || price > 100) return null;

  const brand =
    (Array.isArray(p.brands) && p.brands[0] && p.brands[0].name) || (p.brand && p.brand.name) || "";
  const images = Array.isArray(p.images) ? p.images : [];
  const img = images.find((i) => JSON.stringify(i).includes("hero")) || images[0];

  return {
    id: "c3_" + String(p.id),
    name: String(p.title).replace(/\s+/g, " ").trim().slice(0, 70),
    emoji: "🛍️",
    image: img && typeof img.url === "string" ? img.url : "",
    price,
    minPrice: Math.ceil(price * 0.8), // DEMO seller rule: asli merchants mol-bhav nahi karte
    tags: [],
    brand,
    merchant: offer.merchant_domain || "",
    url: typeof offer.url === "string" ? offer.url : "",
    live: true,
  };
}

async function searchLive(query) {
  const key = process.env.CHANNEL3_API_KEY;
  if (!key) throw new Error("CHANNEL3_API_KEY set nahi hai");

  const q = String(query || "").trim().toLowerCase();
  const hit = cache.get(q);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.items;

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: { "x-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ query: q, limit: 20 }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Channel3 ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);

  const raw = data.products || [];
  const items = raw.map(normalize).filter(Boolean).slice(0, 12);

  if (raw.length > 0 && items.length === 0) {
    throw new Error("Products mile par price/offer samajh nahi aaya. Sample: " + JSON.stringify(raw[0]).slice(0, 600));
  }

  cache.set(q, { t: Date.now(), items });
  if (cache.size > 50) cache.delete(cache.keys().next().value);
  return items;
}

module.exports = { searchLive };
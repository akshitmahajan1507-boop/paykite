const PRODUCTS = [
  { id: "p1",  name: "Wireless Headphones",     emoji: "🎧", price: 45, minPrice: 36, tags: ["audio", "headphones", "wireless"] },
  { id: "p2",  name: "Bluetooth Speaker",       emoji: "🔊", price: 30, minPrice: 24, tags: ["audio", "speaker", "bluetooth"] },
  { id: "p3",  name: "Smart Watch",             emoji: "⌚", price: 80, minPrice: 64, tags: ["watch", "fitness", "wearable"] },
  { id: "p4",  name: "Laptop Backpack",         emoji: "🎒", price: 35, minPrice: 28, tags: ["bag", "backpack", "travel"] },
  { id: "p5",  name: "Stainless Water Bottle",  emoji: "🍶", price: 15, minPrice: 12, tags: ["bottle", "water", "fitness"] },
  { id: "p6",  name: "Desk Lamp (LED)",         emoji: "💡", price: 22, minPrice: 17, tags: ["lamp", "desk", "light"] },
  { id: "p7",  name: "Mechanical Keyboard",     emoji: "⌨️", price: 55, minPrice: 44, tags: ["keyboard", "computer", "typing"] },
  { id: "p8",  name: "Wireless Mouse",          emoji: "🖱️", price: 18, minPrice: 14, tags: ["mouse", "computer", "wireless"] },
  { id: "p9",  name: "Yoga Mat",                emoji: "🧘", price: 25, minPrice: 20, tags: ["yoga", "fitness", "mat"] },
  { id: "p10", name: "Sunglasses",              emoji: "🕶️", price: 28, minPrice: 22, tags: ["glasses", "sun", "fashion"] },
  { id: "p11", name: "Phone Stand",             emoji: "📱", price: 10, minPrice: 8,  tags: ["phone", "stand", "desk"] },
  { id: "p12", name: "Notebook Set (3 pack)",   emoji: "📓", price: 12, minPrice: 9,  tags: ["notebook", "study", "stationery"] },
];

// Naam ya tag se product dhundna
function searchProducts(query, maxPrice) {
  const words = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  return PRODUCTS.filter((p) => {
    const text = (p.name + " " + p.tags.join(" ")).toLowerCase();
    const matches = words.length === 0 || words.some((w) => text.includes(w));
    const affordable = !maxPrice || p.price <= maxPrice * 1.5; // thoda upar bhi dikhao, mol-bhav ke liye
    return matches && affordable;
  }).map(({ minPrice, ...publicInfo }) => publicInfo); // minPrice kabhi bahar nahi jata
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

module.exports = { PRODUCTS, searchProducts, getProduct };
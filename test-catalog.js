const { searchProducts, getProduct } = require("./catalog");

console.log("🔍 'headphones' search:");
console.log(searchProducts("headphones"));

console.log("\n🔍 'fitness', budget $20:");
console.log(searchProducts("fitness", 20));

console.log("\n📦 p1 (seller ka andar ka data):");
console.log(getProduct("p1"));
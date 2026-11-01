const { parseRequest } = require("./parse");

const samples = [
  "Mujhe wireless headphones chahiye, 40 dollar se zyada nahi",
  "ek yoga mat kharid do 30 ke andar",
  "bluetooth speaker dhundo",
];

async function main() {
  for (const s of samples) {
    console.log(`\n"${s}"`);
    console.log("→", await parseRequest(s));
  }
}
main();
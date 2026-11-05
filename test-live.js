const { searchLive } = require("./channel3");

searchLive("wireless headphones")
  .then((items) => {
    console.log("Normalized products:", items.length);
    console.log(
      items.slice(0, 3).map(({ id, name, price, minPrice, merchant, image, url }) => ({
        id, name, price, minPrice, merchant, hasImage: !!image, hasUrl: !!url,
      }))
    );
  })
  .catch((e) => console.error("❌", e.message));
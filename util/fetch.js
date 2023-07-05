import dotenv from "dotenv";
dotenv.config(); // Setup .env

async function getFact() {
  const randomCatRes = await fetch(
    `https://api.thecatapi.com/v1/images/search?has_breeds=1?api_key=${process.env.CATAPI_KEY}`
  );

  const randomCat = await randomCatRes.json();
  JSON.parse(JSON.stringify(randomCat));
  const randomCatDescriptionRes = await fetch("https://api.thecatapi.com/v1/images/" + randomCat[0].id);
  const randomCatDescription = await randomCatDescriptionRes.json();
  return randomCatDescription;
}

export default getFact;

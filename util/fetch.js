import db from "./Database.js";

async function getFact(retryCount = 0) {
  try {
    const randomCatRes = await fetch(
      `https://api.thecatapi.com/v1/images/search?has_breeds=1&api_key=${process.env.CATAPI_KEY}`
    );
    const [randomCat] = await randomCatRes.json();

    const catDetailsRes = await fetch(
      `https://api.thecatapi.com/v1/images/${randomCat.id}?api_key=${process.env.CATAPI_KEY}`
    );
    const catDetails = await catDetailsRes.json();

    const catData = {
      id: catDetails.id,
      url: catDetails.url,
      breed_name: catDetails.breeds[0].name,
      image_url: catDetails.url,
      description: catDetails.breeds[0].description,
      wikipedia_url: catDetails.breeds[0].wikipedia_url,
    };

    // Сохраняем данные в БД сразу после получения
    await db.saveCatDetails(catData);

    return catData;
  } catch (error) {
    console.error("Ошибка получения данных:", error);
    throw error;
  }
}

export default getFact;

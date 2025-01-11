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

    // Проверка наличия данных о породе
    if (!catDetails?.breeds?.[0]) {
      throw new Error("Нет данных о породе кота");
    }

    const breed = catDetails.breeds[0];

    const catData = {
      id: catDetails.id,
      url: catDetails.url,
      breeds: [
        {
          id: breed.id,
          name: breed.name,
          temperament: breed.temperament,
          origin: breed.origin,
          life_span: breed.life_span,
          wikipedia_url: breed.wikipedia_url,
          weight: breed.weight,
          description: breed.description,
        },
      ],
    };

    await db.saveCatDetails(catData);
    return catData;
  } catch (error) {
    console.error("Ошибка получения данных:", error);
    if (retryCount < 3) {
      return getFact(retryCount + 1);
    }
    throw error;
  }
}

export default getFact;

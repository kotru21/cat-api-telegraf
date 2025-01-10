import dotenv from "dotenv";
dotenv.config();

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function getFact(retryCount = 0) {
  try {
    // Шаг 1: Получаем ID случайного кота
    const randomCatRes = await fetch(
      `https://api.thecatapi.com/v1/images/search?has_breeds=1&api_key=${process.env.CATAPI_KEY}`
    );

    const [randomCat] = await randomCatRes.json();

    // Шаг 2: Получаем полную информацию о породе
    const catDetailsRes = await fetch(
      `https://api.thecatapi.com/v1/images/${randomCat.id}?api_key=${process.env.CATAPI_KEY}`
    );

    const catDetails = await catDetailsRes.json();

    // Формируем объект с нужными полями
    return {
      id: catDetails.id,
      url: catDetails.url,
      breed_name: catDetails.breeds[0].name,
      image_url: catDetails.url, // Добавляем для БД
      breeds: catDetails.breeds,
      description: catDetails.breeds[0].description,
      wikipedia_url: catDetails.breeds[0].wikipedia_url,
    };
  } catch (error) {
    console.error("Ошибка получения данных:", error);
    throw error;
  }
}

export default getFact;

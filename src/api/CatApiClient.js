import config from "./config/index.js";
export class CatApiClient {
  constructor(apiKey) {
    this.apiKey = config.CAT_API_TOKEN;
    this.baseUrl = "https://api.thecatapi.com/v1";
  }

  async getRandomCatWithBreed() {
    const response = await fetch(
      `${this.baseUrl}/images/search?has_breeds=1&api_key=${this.apiKey}`
    );
    const [randomCat] = await response.json();

    const catDetailsRes = await fetch(
      `${this.baseUrl}/images/${randomCat.id}?api_key=${this.apiKey}`
    );
    return await catDetailsRes.json();
  }
}

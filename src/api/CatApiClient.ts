import config from "../config/index.js";
import logger from "../utils/logger.js";

interface CatApiImage {
  id: string;
  url: string;
  breeds?: any[];
  width?: number;
  height?: number;
  [key: string]: any;
}

export class CatApiClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private retries: number;

  constructor(
    apiKey = config.CAT_API_TOKEN,
    baseUrl = "https://api.thecatapi.com/v1"
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeoutMs = 8000;
    this.retries = 2;
  }

  async fetchJson<T>(
    url: string,
    options: RequestInit = {},
    attempt = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt < this.retries) {
        const backoff = 200 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        return this.fetchJson<T>(url, options, attempt + 1);
      }
      logger.error({ err, url }, "CatApi request failed");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getRandomCatWithBreed(): Promise<CatApiImage> {
    const [randomCat] = await this.fetchJson<CatApiImage[]>(
      `${this.baseUrl}/images/search?has_breeds=1&api_key=${this.apiKey}`
    );

    return await this.fetchJson<CatApiImage>(
      `${this.baseUrl}/images/${randomCat.id}?api_key=${this.apiKey}`
    );
  }
}

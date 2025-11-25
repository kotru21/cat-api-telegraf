import config from '../config/index.js';
import logger from '../utils/logger.js';
import { CatApiImage } from './interfaces/TheCatApi.js';

export class CatApiClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private retries: number;

  constructor(apiKey = config.CAT_API_TOKEN, baseUrl = 'https://api.thecatapi.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeoutMs = 8000;
    this.retries = 2;
  }

  /**
   * Default headers for all API requests
   * API key is passed via header instead of query string for security
   */
  private getHeaders(): HeadersInit {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async fetchJson<T>(url: string, options: RequestInit = {}, attempt = 0): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers },
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (attempt < this.retries) {
        const backoff = 200 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        return this.fetchJson<T>(url, options, attempt + 1);
      }
      logger.error({ err, url }, 'CatApi request failed');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getRandomCatWithBreed(): Promise<CatApiImage> {
    const [randomCat] = await this.fetchJson<CatApiImage[]>(
      `${this.baseUrl}/images/search?has_breeds=1`,
    );

    if (!randomCat) {
      throw new Error('No cat found');
    }

    return await this.fetchJson<CatApiImage>(`${this.baseUrl}/images/${randomCat.id}`);
  }

  async getCatById(catId: string): Promise<CatApiImage> {
    return this.fetchJson<CatApiImage>(`${this.baseUrl}/images/${catId}`);
  }
}

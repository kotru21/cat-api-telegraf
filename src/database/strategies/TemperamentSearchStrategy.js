import { SearchStrategy } from "./SearchStrategy.js";

export class TemperamentSearchStrategy extends SearchStrategy {
  createQuery(feature, value) {
    return {
      query: `SELECT id, breed_name, image_url, description, wikipedia_url, count 
              FROM msg 
              WHERE temperament LIKE ? 
              ORDER BY count DESC`,
      params: [`%${value}%`],
    };
  }
}

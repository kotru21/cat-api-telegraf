import { SearchStrategy } from "./SearchStrategy.js";

export class ExactMatchSearchStrategy extends SearchStrategy {
  createQuery(feature, value) {
    return {
      query: `SELECT id, breed_name, image_url, description, wikipedia_url, count 
              FROM msg 
              WHERE ${feature} = ? 
              ORDER BY count DESC`,
      params: [value],
    };
  }
}

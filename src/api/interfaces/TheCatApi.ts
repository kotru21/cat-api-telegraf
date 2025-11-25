export interface CatBreed {
  id: string;
  name: string;
  temperament?: string;
  origin?: string;
  description?: string;
  life_span?: string;
  wikipedia_url?: string;
  weight?: { metric: string; imperial: string };
  [key: string]: unknown;
}

export interface CatApiImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
  breeds?: CatBreed[];
  categories?: { id: number; name: string }[];
}

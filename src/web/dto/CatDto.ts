export interface CatDto {
  id: string;
  url: string;
  width?: number;
  height?: number;
  likes?: number;
  breeds?: {
    id: string;
    name: string;
    temperament?: string;
    origin?: string;
    description?: string;
    life_span?: string;
    wikipedia_url?: string;
    weight?: { metric: string; imperial: string };
  }[];
}

interface CatLikeInput {
  id: string;
  url?: string;
  image_url?: string;
  width?: number;
  height?: number;
  count?: number;
  breed_id?: string;
  breed_name?: string;
  temperament?: string;
  origin?: string;
  description?: string;
  life_span?: string;
  wikipedia_url?: string;
  weight_metric?: string;
  weight_imperial?: string;
  breeds?: Array<{
    id: string;
    name?: string;
    temperament?: string;
    origin?: string;
    description?: string;
    life_span?: string;
    wikipedia_url?: string;
    weight?: { metric: string; imperial: string };
  }>;
}

export function toCatDto(data: CatLikeInput): CatDto {
  // Handle Prisma Cat object (flat structure)
  if (!data.breeds && data.breed_name) {
    return {
      id: data.id,
      url: data.image_url || data.url,
      likes: data.count || 0,
      breeds: [
        {
          id: data.breed_id || '',
          name: data.breed_name,
          temperament: data.temperament,
          origin: data.origin,
          description: data.description,
          life_span: data.life_span,
          wikipedia_url: data.wikipedia_url,
          weight: {
            metric: data.weight_metric || '',
            imperial: data.weight_imperial || '',
          },
        },
      ],
    };
  }

  // Handle TheCatAPI response or constructed object
  return {
    id: data.id,
    url: data.url,
    width: data.width,
    height: data.height,
    likes: data.count || 0,
    breeds: Array.isArray(data.breeds)
      ? data.breeds.map((b) => ({
          id: b.id,
          name: b.name || 'Unknown',
          temperament: b.temperament,
          origin: b.origin,
          description: b.description,
          life_span: b.life_span,
          wikipedia_url: b.wikipedia_url,
          weight: b.weight,
        }))
      : [],
  };
}

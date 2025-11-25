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

export interface CatLikeInput {
  id: string;
  url?: string | null;
  image_url?: string | null;
  width?: number;
  height?: number;
  count?: number;
  breed_id?: string | null;
  breed_name?: string | null;
  temperament?: string | null;
  origin?: string | null;
  description?: string | null;
  life_span?: string | null;
  wikipedia_url?: string | null;
  weight_metric?: string | null;
  weight_imperial?: string | null;
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
      url: data.image_url || data.url || '',
      likes: data.count || 0,
      breeds: [
        {
          id: data.breed_id || '',
          name: data.breed_name,
          temperament: data.temperament ?? undefined,
          origin: data.origin ?? undefined,
          description: data.description ?? undefined,
          life_span: data.life_span ?? undefined,
          wikipedia_url: data.wikipedia_url ?? undefined,
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
    url: data.url || '',
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

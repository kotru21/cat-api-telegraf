import store, { emit } from '../state/store';
import { getCatDetails } from '../../api';
import { sanitize } from '../../utils';

interface RawCatDetails {
  id: string;
  breed_name?: string;
  description?: string;
  count?: number;
  wikipedia_url?: string;
  origin?: string;
  temperament?: string;
  life_span?: string;
  weight_metric?: string;
  weight_imperial?: string;
  image_url?: string;
}

interface CatDetails {
  id: string;
  breedName: string;
  description: string;
  likes: number;
  wikipediaUrl: string | null;
  origin: string;
  temperament: string;
  lifeSpan: string;
  weightMetric: string;
  weightImperial: string;
  imageUrl: string | null;
}

// TTL cache for cat details to avoid refetch when navigating back quickly
const cache = new Map<string, { data: RawCatDetails; ts: number }>(); // catId -> { data, ts }
const TTL = 30 * 1000;

export function normalizeCatDetails(raw: RawCatDetails): CatDetails | null {
  if (!raw) return null;
  return {
    id: raw.id,
    breedName: raw.breed_name || 'Unknown',
    description: raw.description || '—',
    likes: raw.count ?? 0,
    wikipediaUrl: raw.wikipedia_url || null,
    origin: raw.origin || '—',
    temperament: raw.temperament || '—',
    lifeSpan: raw.life_span || '—',
    weightMetric: raw.weight_metric || '?',
    weightImperial: raw.weight_imperial || '?',
    imageUrl: raw.image_url || null,
  };
}

export async function loadCatDetails(catId: string, { force = false } = {}) {
  if (!catId) return;
  const now = Date.now();
  const cached = cache.get(catId);
  if (!force && cached && now - cached.ts < TTL) {
    store.setState({
      catDetails: normalizeCatDetails(cached.data),
      loading: { ...store.getState().loading, catDetails: false },
    });
    emit('catDetails:loaded');
    return cached.data;
  }
  store.setState({
    loading: { ...store.getState().loading, catDetails: true },
    errors: { ...store.getState().errors, catDetails: null },
  });
  emit('catDetails:loading');
  try {
    const data = await getCatDetails(catId);
    cache.set(catId, { data, ts: now });
    store.setState({
      catDetails: normalizeCatDetails(data),
      loading: { ...store.getState().loading, catDetails: false },
    });
    emit('catDetails:loaded');
    return data;
  } catch (err) {
    store.setState({
      errors: { ...store.getState().errors, catDetails: err },
      loading: { ...store.getState().loading, catDetails: false },
    });
    emit('catDetails:error');
    throw err;
  }
}

export default { loadCatDetails, normalizeCatDetails };

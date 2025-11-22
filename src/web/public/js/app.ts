import Alpine from 'alpinejs';
import {
  getLeaderboard,
  getProfile,
  getCatDetails,
  addLike,
  getUserLikes,
  deleteLike,
  getSimilarCats,
  getRandomImages,
  buildWsUrl,
} from './api.js';
import { formatUptime } from './utils.js';
import { Cat, LeaderboardEntry, UserProfile } from './types.js';

// Global store
Alpine.store('global', {
  user: null as UserProfile | null,
  async init() {
    const store = this as { user: UserProfile | null };
    try {
      store.user = await getProfile();
    } catch {
      store.user = null;
    }
  },
});

// Leaderboard component
Alpine.data('leaderboard', () => ({
  items: [] as LeaderboardEntry[],
  loading: false,
  error: null as string | null,

  async init() {
    this.loading = true;
    try {
      this.items = await getLeaderboard();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  },
}));

// Cat Details component
Alpine.data('catDetails', (catId: string) => ({
  cat: null as Cat | null,
  loading: false,
  error: null as string | null,
  likeLocked: false,
  likesCount: 0,

  async init() {
    if (!catId) {
      this.error = 'No Cat ID provided';
      return;
    }
    this.loading = true;
    try {
      this.cat = await getCatDetails(catId);
      if (this.cat) {
        this.likesCount = this.cat.likes || 0;
        document.title = `${this.cat.breeds?.[0]?.name || 'Cat'} | Cat Details`;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  },

  async toggleLike() {
    if (this.likeLocked || !this.cat) return;
    this.likeLocked = true;

    // Optimistic update
    this.likesCount++;

    try {
      await addLike(this.cat.id);
    } catch (err) {
      // Revert on error
      this.likesCount--;
      console.error('Failed to like:', err);
    }

    setTimeout(() => {
      this.likeLocked = false;
    }, 400);
  },
  navigateSimilar(feature: string, rawValue: string) {
    let cleanValue = rawValue;
    if (feature === 'weight_metric') {
      const metricMatch = rawValue.match(/\(([0-9. -]+)кг\)/);
      if (metricMatch && metricMatch[1]) {
        const metricPart = metricMatch[1];
        const numbers = metricPart.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
          const min = parseFloat(numbers[0]);
          const max = parseFloat(numbers[1]);
          cleanValue = ((min + max) / 2).toFixed(1);
        } else if (numbers && numbers.length === 1) {
          cleanValue = numbers[0];
        }
      } else {
        const numbers = rawValue.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
          const min = parseFloat(numbers[0]);
          const max = parseFloat(numbers[1]);
          cleanValue = ((min + max) / 2).toFixed(1);
        }
      }
    } else if (feature === 'temperament') {
      cleanValue = rawValue.split(',')[0].trim();
    }
    window.location.href = `/similar.html?feature=${feature}&value=${encodeURIComponent(cleanValue)}`;
  },
}));

// Similar Cats component
Alpine.data('similarCats', () => ({
  cats: [] as Cat[],
  displayedCats: [] as Cat[],
  loading: false,
  error: null as string | null,
  featureName: '',
  searchValue: '',
  totalItems: 0,
  currentPage: 1,
  pageSize: 9,
  totalPages: 0,

  FEATURE_NAMES: {
    origin: 'происхождению',
    temperament: 'темпераменту',
    life_span: 'продолжительности жизни',
    weight_metric: 'весу',
  } as Record<string, string>,

  async init() {
    const params = new URLSearchParams(window.location.search);
    const feature = params.get('feature');
    const value = params.get('value');

    if (!feature || !value) {
      this.error = 'Не указаны параметры поиска';
      return;
    }

    this.featureName = this.FEATURE_NAMES[feature] || feature;
    this.searchValue = value;
    document.title = `Поиск по ${this.featureName}: ${value} | CatBot`;

    this.loading = true;
    try {
      const data = (await getSimilarCats(feature, value)) as Cat[];
      if (!Array.isArray(data) || data.length === 0) {
        this.error = 'К сожалению, мы не нашли котов с похожими характеристиками';
        this.cats = [];
      } else {
        this.cats = data;
        this.totalItems = data.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updatePage(1);
      }
    } catch (err) {
      console.error('similar load error', err);
      this.error = 'Произошла ошибка при загрузке данных';
    } finally {
      this.loading = false;
    }
  },

  updatePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    this.displayedCats = this.cats.slice(start, start + this.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  get pages() {
    const range = [];
    const delta = 2;
    for (
      let i = Math.max(2, this.currentPage - delta);
      i <= Math.min(this.totalPages - 1, this.currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (this.currentPage - delta > 2) {
      range.unshift('...');
    }
    if (this.currentPage + delta < this.totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (this.totalPages > 1) {
      range.push(this.totalPages);
    }

    return range;
  },
}));

// Hero Avatars component
Alpine.data('heroAvatars', () => ({
  avatars: [] as Cat[],
  loading: true,

  async init() {
    try {
      const images = (await getRandomImages(3)) as Cat[];
      this.avatars = images || [];
    } catch (e) {
      console.error('Failed to load hero avatars', e);
    } finally {
      this.loading = false;
    }
  },
}));

// Stats component
Alpine.data('stats', () => ({
  messageCount: '...',
  uptime: {
    days: { value: '0', label: 'дн.' },
    hours: { value: '0', label: 'ч.' },
    minutes: { value: '0', label: 'мин.' },
    seconds: { value: '0', label: 'сек.' },
  },
  loading: true,
  ws: null as WebSocket | null,
  interval: null as number | null,

  init() {
    this.connect();
  },

  connect() {
    this.ws = new WebSocket(buildWsUrl());

    this.ws.onmessage = (event) => {
      this.loading = false;
      try {
        const { messageCount, uptimeDateObject } = JSON.parse(event.data);
        if (messageCount != null) {
          this.messageCount = messageCount;
        }
        if (uptimeDateObject) {
          const startDate = new Date(uptimeDateObject);
          if (this.interval) window.clearInterval(this.interval);

          const update = () => {
            this.uptime = formatUptime(startDate);
          };
          update();
          this.interval = window.setInterval(update, 1000);
        }
      } catch (e) {
        console.error('Invalid WS payload', e);
      }
    };

    this.ws.onerror = () => {
      this.loading = false;
      this.messageCount = 'Ошибка';
    };

    this.ws.onclose = () => {
      // Optional: reconnect logic
    };
  },

  destroy() {
    if (this.interval) window.clearInterval(this.interval);
    if (this.ws) this.ws.close();
  },
}));

// Navigation component
Alpine.data('navigation', () => ({
  mobileMenuOpen: false,
  scrolled: false,

  init() {
    // Scroll handler
    const onScroll = () => {
      this.scrolled = window.scrollY > 10;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial check
  },

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  },

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  },
}));

// Profile component
Alpine.data('profile', () => ({
  likes: [] as Cat[],
  loading: false,
  error: null as string | null,
  search: '',
  confirmModalOpen: false,
  catToDelete: null as Cat | null,

  async init() {
    this.loading = true;
    try {
      this.likes = (await getUserLikes()) || [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.likes = [];
    } finally {
      this.loading = false;
    }
  },

  get filteredLikes() {
    if (!this.search) return this.likes;
    const lower = this.search.toLowerCase();
    return this.likes.filter((cat) => (cat.breeds?.[0]?.name || '').toLowerCase().includes(lower));
  },

  confirmDelete(cat: Cat) {
    this.catToDelete = cat;
    this.confirmModalOpen = true;
  },

  async deleteLike() {
    if (!this.catToDelete) return;

    const catId = this.catToDelete.id;
    this.confirmModalOpen = false;

    // Optimistic update
    const originalLikes = [...this.likes];
    this.likes = this.likes.filter((l) => l.id !== catId);

    try {
      await deleteLike(catId);
      this.catToDelete = null;
    } catch (err) {
      // Revert
      this.likes = originalLikes;
      alert('Не удалось удалить лайк');
      console.error(err);
    }
  },
}));

Alpine.start();

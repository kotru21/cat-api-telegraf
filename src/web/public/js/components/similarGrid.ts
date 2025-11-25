/* eslint-disable @typescript-eslint/no-explicit-any -- frontend component with flexible types */
import { preloadImages, PLACEHOLDER, sanitize } from '../utils';
import overlayImageWithSkeleton from './overlayImage';

interface CatData {
  id: string;
  breed_name: string;
  description: string;
  image_url: string;
  count: number;
}

interface SimilarGridOptions {
  data?: CatData[];
  pageData?: CatData[];
  skipSkeleton?: boolean;
}

/**
 * Рендер сетки похожих котов со скелетоном и предзагрузкой.
 */
export default async function renderSimilarGrid({
  data = [],
  pageData,
  skipSkeleton = false,
}: SimilarGridOptions = {}) {
  const skeletonContent = document.getElementById('skeleton-content');
  const resultsContent = document.getElementById('results-content');
  if (!resultsContent || !skeletonContent) return { cards: [] };

  if (!Array.isArray(data) || data.length === 0) {
    skeletonContent.style.display = 'none';
    resultsContent.style.display = 'none';
    const noResults = document.getElementById('no-results');
    if (noResults) noResults.style.display = 'block';
    return { cards: [] };
  }

  const renderSet = Array.isArray(pageData) ? pageData : data;

  const preloadResult = await preloadImages(
    renderSet.map((c) => c.image_url),
    3000,
  );
  const hasTimeout = preloadResult.length === 0;

  resultsContent.innerHTML = '';

  const cards = renderSet.map((cat, idx) => {
    const card = document.createElement('div');
    card.className = 'cat-card overflow-hidden shadow-lg';

    const preloaded =
      !hasTimeout && Array.isArray(preloadResult)
        ? preloadResult.find((r: any) => r.index === idx && r.success)
        : null;

    const imgContainer = document.createElement('div');
    imgContainer.className = 'img-container overflow-hidden';
    imgContainer.style.aspectRatio = '3/2';

    const { wrapper: overlayWrap } = overlayImageWithSkeleton({
      src: preloaded && preloaded.img ? preloaded.img.src : cat.image_url || PLACEHOLDER.MEDIUM,
      alt: cat.breed_name || 'Cat',
      width: '100%',
      height: '100%',
      shape: 'rect',
      wrapperClass: 'w-full h-full',
      placeholder: PLACEHOLDER.MEDIUM,
      alreadyLoaded: !!(preloaded && preloaded.img),
    });
    imgContainer.appendChild(overlayWrap);

    const info = document.createElement('div');
    info.className = 'p-5';
    info.innerHTML = `
      <h3 class="text-xl font-bold mb-2">${sanitize(cat.breed_name || 'Unknown')}</h3>
      <p class="text-gray-400 text-sm mb-4 line-clamp-2">${sanitize(
        cat.description || 'Нет описания',
      )}</p>
      <div class="flex justify-between items-center">
        <span class="cat-likes"><i class="fas fa-heart text-red-500 mr-2"></i> ${
          cat.count || 0
        }</span>
        <a href="/catDetails?id=${encodeURIComponent(
          cat.id,
        )}" class="text-indigo-400 hover:text-indigo-300">
          <i class="fas fa-info-circle mr-1"></i> Подробнее
        </a>
      </div>`;

    card.appendChild(imgContainer);
    card.appendChild(info);
    resultsContent.appendChild(card);
    return card;
  });

  resultsContent.style.display = 'grid';
  if (!skipSkeleton) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        skeletonContent.style.opacity = '0';
        resultsContent.style.opacity = '1';
        setTimeout(() => {
          skeletonContent.style.display = 'none';
        }, 500);
      }, 50);
    });
  }

  return { cards };
}

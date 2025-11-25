/* eslint-disable @typescript-eslint/no-explicit-any -- frontend component with flexible types */
import { getRandomImages } from '../api';
import { PLACEHOLDER } from '../utils';
import overlayImageWithSkeleton from './overlayImage';

export async function initHeroAvatars({
  containerSelector = '#hero-cats-container',
  count = 3,
} = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const skeletonHTML = container.innerHTML;

  try {
    const images: any[] = await getRandomImages(count);
    const preloadPromises = images.map(
      (img: any, index: number) =>
        new Promise((resolve) => {
          const pre = new Image();
          pre.onload = () => resolve({ loaded: true, index, data: img, src: pre.src });
          pre.onerror = () => resolve({ loaded: false, index, data: img });
          pre.src = img.image_url;
          if (pre.complete) resolve({ loaded: true, index, data: img, src: pre.src });
        }),
    );

    const results = await Promise.all(preloadPromises);
    results.sort((a: any, b: any) => a.index - b.index);

    container.innerHTML = '';
    results.forEach((result: any) => {
      const { wrapper } = overlayImageWithSkeleton({
        src: result.loaded ? result.src : PLACEHOLDER.SMALL,
        alt: 'Cat',
        width: 40,
        height: 40,
        shape: 'circle',
        borderClass: 'border-2 border-indigo-600',
        wrapperClass: '-mr-2 first:ml-0', // для наложения (-space-x)
        alreadyLoaded: result.loaded,
        placeholder: PLACEHOLDER.SMALL,
      });
      container.appendChild(wrapper);
    });
  } catch (err) {
    console.error('Ошибка при загрузке аватаров котов:', err);
    container.innerHTML = skeletonHTML; // fall back
  }
}

export default initHeroAvatars;

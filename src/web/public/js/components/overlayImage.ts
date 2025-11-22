import { PLACEHOLDER } from '../utils';

interface OverlayImageOptions {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  shape?: 'circle' | 'rect';
  wrapperClass?: string;
  imgClass?: string;
  skeletonClass?: string;
  borderClass?: string;
  placeholder?: string;
  alreadyLoaded?: boolean;
  lazy?: boolean;
  delay?: number;
}

/**
 * Универсальный helper для наложения skeleton поверх изображения без layout shift.
 */
export function overlayImageWithSkeleton({
  src,
  alt = '',
  width,
  height,
  shape = 'rect',
  wrapperClass = '',
  imgClass = '',
  skeletonClass = '',
  borderClass = '',
  placeholder = PLACEHOLDER.MEDIUM,
  alreadyLoaded = false,
  lazy = true,
  delay = 50,
}: OverlayImageOptions) {
  const wrapper = document.createElement('div');
  wrapper.className = `relative inline-block overflow-hidden ${wrapperClass}`.trim();
  if (width != null) wrapper.style.width = typeof width === 'number' ? width + 'px' : width;
  if (height != null) wrapper.style.height = typeof height === 'number' ? height + 'px' : height;

  const sharedRadius = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  const skeleton = document.createElement('div');
  skeleton.className =
    `absolute inset-0 ${sharedRadius} bg-gray-700 animate-pulse opacity-100 transition-opacity duration-300 ${borderClass} ${skeletonClass}`.trim();

  const img = document.createElement('img');
  img.alt = alt;
  img.decoding = 'async';
  if (lazy) img.loading = 'lazy';
  img.className =
    `absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 ${sharedRadius} ${borderClass} ${imgClass}`.trim();
  img.src = src || placeholder;

  const finalize = () => {
    requestAnimationFrame(() => {
      img.classList.add('opacity-100');
      skeleton.classList.add('opacity-0');
      setTimeout(() => skeleton.remove(), 350);
    });
  };

  img.onload = finalize;
  img.onerror = () => {
    if (img.src !== placeholder) img.src = placeholder;
    finalize();
  };

  // Если уже предзагружено — быстро скрываем skeleton
  if (alreadyLoaded) {
    requestAnimationFrame(() => setTimeout(finalize, delay));
  }

  wrapper.appendChild(img); // сначала изображение
  wrapper.appendChild(skeleton); // сверху скелет
  return { wrapper, img, skeleton };
}

export default overlayImageWithSkeleton;

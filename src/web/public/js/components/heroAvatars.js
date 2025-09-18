import { getRandomImages } from "/js/api.js";
import { PLACEHOLDER } from "/js/utils.js";

export async function initHeroAvatars({
  containerSelector = "#hero-cats-container",
  count = 3,
} = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const skeletonHTML = container.innerHTML;

  try {
    const images = await getRandomImages(count);
    const preloadPromises = images.map(
      (img, index) =>
        new Promise((resolve) => {
          const pre = new Image();
          pre.onload = () =>
            resolve({ loaded: true, index, data: img, src: pre.src });
          pre.onerror = () => resolve({ loaded: false, index, data: img });
          pre.src = img.image_url;
          if (pre.complete)
            resolve({ loaded: true, index, data: img, src: pre.src });
        })
    );

    const results = await Promise.all(preloadPromises);
    results.sort((a, b) => a.index - b.index);

    container.innerHTML = "";
    results.forEach((result) => {
      const wrap = document.createElement("div");
      wrap.className = "img-container";
      wrap.style.width = "40px";
      wrap.style.height = "40px";

      const skeleton = document.createElement("div");
      skeleton.className =
        "skeleton bg-gray-700 animate-pulse w-10 h-10 rounded-full border-2 border-indigo-600 opacity-100 transition-opacity duration-300";

      const imgEl = document.createElement("img");
      imgEl.alt = "Cat";
      imgEl.className =
        "hero-cat-badge w-10 h-10 rounded-full border-2 border-indigo-600 object-cover img-preload opacity-0 transition-opacity duration-300";
      imgEl.src = result.loaded ? result.src : PLACEHOLDER.SMALL;
      imgEl.onerror = () => {
        imgEl.src = PLACEHOLDER.SMALL;
        imgEl.classList.add("img-loaded", "opacity-100");
      };

      requestAnimationFrame(() => {
        setTimeout(() => {
          imgEl.classList.add("img-loaded", "opacity-100");
          skeleton.classList.add("skeleton-hidden", "opacity-0");
          setTimeout(() => skeleton.remove(), 400);
        }, 50);
      });

      wrap.appendChild(skeleton);
      wrap.appendChild(imgEl);
      container.appendChild(wrap);
    });
  } catch (err) {
    console.error("Ошибка при загрузке аватаров котов:", err);
    container.innerHTML = skeletonHTML; // fall back
  }
}

export default initHeroAvatars;

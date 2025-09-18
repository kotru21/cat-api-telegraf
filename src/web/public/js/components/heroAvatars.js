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
      skeleton.className = [
        "skeleton",
        "w-10 h-10 rounded-full border-2 border-indigo-600",
        "opacity-100 transition-opacity duration-300",
        "bg-gray-800",
        "[background-size:1400px_100%]",
        "bg-[linear-gradient(110deg,#374151_8%,#4b5563_18%,#374151_33%)]",
        "animate-shimmer",
      ].join(" ");

      const imgEl = document.createElement("img");
      imgEl.alt = "Cat";
      imgEl.className =
        "hero-cat-badge w-10 h-10 rounded-full border-2 border-indigo-600 object-cover img-preload opacity-0 transition-opacity duration-300";
      imgEl.src = result.loaded ? result.src : PLACEHOLDER.SMALL;
      imgEl.onerror = () => {
        imgEl.src = PLACEHOLDER.SMALL;
        imgEl.classList.add("img-loaded", "opacity-100");
      };

      const finalize = () => {
        imgEl.classList.add("img-loaded", "opacity-100");
        skeleton.classList.add("skeleton-hidden", "opacity-0");
      };
      requestAnimationFrame(finalize);
      skeleton.addEventListener(
        "transitionend",
        (e) => {
          if (e.propertyName === "opacity") skeleton.remove();
        },
        { once: true }
      );

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

import { preloadImages, PLACEHOLDER, sanitize } from "/js/utils.js";

/**
 * Рендер сетки похожих котов со скелетоном и предзагрузкой.
 * @param {Object} opts
 * @param {Array} opts.data - массив котов ({ id, breed_name, description, image_url, count })
 */
export default async function renderSimilarGrid({
  data = [],
  pageData,
  skipSkeleton = false,
} = {}) {
  const skeletonContent = document.getElementById("skeleton-content");
  const resultsContent = document.getElementById("results-content");
  if (!resultsContent || !skeletonContent) return { cards: [] };

  if (!Array.isArray(data) || data.length === 0) {
    skeletonContent.style.display = "none";
    resultsContent.style.display = "none";
    const noResults = document.getElementById("no-results");
    if (noResults) noResults.style.display = "block";
    return { cards: [] };
  }

  const renderSet = Array.isArray(pageData) ? pageData : data;

  const preloadResult = await preloadImages(
    renderSet.map((c) => c.image_url),
    3000
  );
  const hasTimeout = preloadResult.length === 0;

  resultsContent.innerHTML = "";

  const cards = renderSet.map((cat, idx) => {
    const card = document.createElement("div");
    card.className = "cat-card overflow-hidden shadow-lg";

    const preloaded =
      !hasTimeout && Array.isArray(preloadResult)
        ? preloadResult.find((r) => r.index === idx && r.success)
        : null;

    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container overflow-hidden";
    imgContainer.style.aspectRatio = "3/2";

    const skeleton = document.createElement("div");
    skeleton.className = "skeleton bg-gray-700 animate-pulse";
    skeleton.style.width = "100%";
    skeleton.style.height = "100%";

    const img = document.createElement("img");
    img.className = "cat-image w-full img-preload";
    img.alt = cat.breed_name || "Cat";
    img.src =
      preloaded && preloaded.img
        ? preloaded.img.src
        : cat.image_url || PLACEHOLDER.MEDIUM;

    img.onload = () =>
      requestAnimationFrame(() => {
        img.classList.add("img-loaded");
        skeleton.classList.add("skeleton-hidden");
      });
    img.onerror = () => {
      img.src = PLACEHOLDER.MEDIUM;
      requestAnimationFrame(() => {
        img.classList.add("img-loaded");
        skeleton.classList.add("skeleton-hidden");
      });
    };

    if (preloaded && preloaded.img) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          img.classList.add("img-loaded");
          skeleton.classList.add("skeleton-hidden");
        }, 50);
      });
    }

    imgContainer.appendChild(skeleton);
    imgContainer.appendChild(img);

    const info = document.createElement("div");
    info.className = "p-5";
    info.innerHTML = `
      <h3 class="text-xl font-bold mb-2">${sanitize(
        cat.breed_name || "Unknown"
      )}</h3>
      <p class="text-gray-400 text-sm mb-4 line-clamp-2">${sanitize(
        cat.description || "Нет описания"
      )}</p>
      <div class="flex justify-between items-center">
        <span class="cat-likes"><i class="fas fa-heart text-red-500 mr-2"></i> ${
          cat.count || 0
        }</span>
        <a href="/catDetails?id=${encodeURIComponent(
          cat.id
        )}" class="text-indigo-400 hover:text-indigo-300">
          <i class="fas fa-info-circle mr-1"></i> Подробнее
        </a>
      </div>`;

    card.appendChild(imgContainer);
    card.appendChild(info);
    resultsContent.appendChild(card);
    return card;
  });

  resultsContent.style.display = "grid";
  if (!skipSkeleton) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        skeletonContent.style.opacity = "0";
        resultsContent.style.opacity = "1";
        setTimeout(() => {
          skeletonContent.style.display = "none";
        }, 500);
      }, 50);
    });
  }

  return { cards };
}

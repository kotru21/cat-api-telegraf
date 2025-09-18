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
    skeleton.className = [
      "skeleton",
      "w-full h-full rounded-none",
      "bg-gray-800",
      "[background-size:1400px_100%]",
      "bg-[linear-gradient(110deg,#374151_8%,#4b5563_18%,#374151_33%)]",
      "animate-shimmer",
      "opacity-100 transition-opacity duration-300",
    ].join(" ");

    const img = document.createElement("img");
    img.className = "cat-image w-full img-preload";
    img.alt = cat.breed_name || "Cat";
    img.src =
      preloaded && preloaded.img
        ? preloaded.img.src
        : cat.image_url || PLACEHOLDER.MEDIUM;

    const finalize = () => {
      img.classList.add("img-loaded");
      skeleton.classList.add("skeleton-hidden", "opacity-0");
    };
    skeleton.addEventListener(
      "transitionend",
      (e) => {
        if (
          e.propertyName === "opacity" &&
          skeleton.classList.contains("skeleton-hidden")
        ) {
          skeleton.remove();
        }
      },
      { once: true }
    );
    img.onload = () => requestAnimationFrame(finalize);
    img.onerror = () => {
      img.src = PLACEHOLDER.MEDIUM;
      requestAnimationFrame(finalize);
    };

    if (preloaded && preloaded.img) {
      requestAnimationFrame(finalize);
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

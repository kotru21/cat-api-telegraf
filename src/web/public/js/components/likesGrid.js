import { preloadImages, sanitize, PLACEHOLDER } from "/js/utils.js";

// Renders liked cats grid
export async function renderLikesGrid({
  data = [],
  containerSelector = "#user-likes",
  skeletonSelector = "#likes-skeleton",
  noLikesSelector = "#no-likes",
} = {}) {
  const container = document.querySelector(containerSelector);
  const skeleton =
    document.getElementById(skeletonSelector.replace("#", "")) ||
    document.querySelector(skeletonSelector);
  const noLikes = document.querySelector(noLikesSelector);
  if (!container) return { cards: [] };

  if (data.length === 0) {
    if (skeleton) skeleton.style.opacity = "0";
    setTimeout(() => {
      if (skeleton) skeleton.style.display = "none";
      if (noLikes) noLikes.style.display = "block";
    }, 500);
    return { cards: [] };
  }

  const preload = await preloadImages(data.map((c) => c.image_url));
  const hasTimeout = preload.length === 0;
  container.style.display = "grid";

  const created = [];

  data.forEach((cat, dataIndex) => {
    const catId = cat.cat_id || cat.id;
    const breedName = cat.breed_name || "Unknown";
    const likesCount = cat.likes_count || cat.count || 0;

    const preloadedImage =
      !hasTimeout && Array.isArray(preload)
        ? preload.find((r) => r.index === dataIndex && r.success)
        : null;

    const card = document.createElement("div");
    card.className = "cat-card fade-in";

    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container relative overflow-hidden";
    imgContainer.style.height = "200px";

    const sk = document.createElement("div");
    sk.className = [
      "skeleton",
      "w-full h-full",
      "bg-gray-800",
      "[background-size:1400px_100%]",
      "bg-[linear-gradient(110deg,#374151_8%,#4b5563_18%,#374151_33%)]",
      "animate-shimmer",
      "opacity-100 transition-opacity duration-300",
    ].join(" ");

    const img = document.createElement("img");
    img.alt = breedName;
    img.className = "cat-image w-full img-preload";
    img.src = preloadedImage?.img?.src || cat.image_url || PLACEHOLDER.MEDIUM;

    const finalize = () => {
      img.classList.add("img-loaded");
      sk.classList.add("skeleton-hidden", "opacity-0");
    };
    sk.addEventListener(
      "transitionend",
      (e) => {
        if (
          e.propertyName === "opacity" &&
          sk.classList.contains("skeleton-hidden")
        ) {
          sk.remove();
        }
      },
      { once: true }
    );
    img.onload = () => requestAnimationFrame(finalize);
    img.onerror = () => {
      img.src = PLACEHOLDER.MEDIUM;
      requestAnimationFrame(finalize);
    };

    if (preloadedImage && preloadedImage.img) {
      requestAnimationFrame(finalize);
    }

    const likeBadge = document.createElement("div");
    likeBadge.className = "absolute top-2 right-2";
    likeBadge.innerHTML = `
      <span class="likes-badge px-3 py-1 bg-indigo-900 bg-opacity-80 text-white rounded-full inline-flex items-center backdrop-blur-sm">
        <i class="fas fa-heart text-red-500 mr-1.5"></i> ${likesCount}
      </span>`;

    imgContainer.appendChild(sk);
    imgContainer.appendChild(img);
    imgContainer.appendChild(likeBadge);

    const infoDiv = document.createElement("div");
    infoDiv.className = "p-5";
    infoDiv.innerHTML = `
      <h3 class="text-xl font-bold mb-3">${sanitize(breedName)}</h3>
      <div class="flex flex-col space-y-3">
        <a href="/catDetails?id=${encodeURIComponent(catId)}" 
           class="text-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          <i class="fas fa-info-circle mr-1"></i> Подробнее
        </a>
        <button class="remove-like-btn text-center py-2 px-4 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg flex items-center justify-center gap-2" 
                data-cat-id="${sanitize(catId)}" data-breed-name="${sanitize(
      breedName
    )}">
          <i class="fas fa-heart-broken"></i> Удалить лайк
        </button>
      </div>`;

    card.appendChild(imgContainer);
    card.appendChild(infoDiv);
    container.appendChild(card);
    created.push(card);
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      if (skeleton) skeleton.style.opacity = "0";
      container.style.opacity = "1";
      setTimeout(() => {
        if (skeleton) skeleton.style.display = "none";
      }, 500);
    }, 50);
  });

  return { cards: created };
}

export default renderLikesGrid;

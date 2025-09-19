import { preloadImages, sanitize, PLACEHOLDER } from "/js/utils.js";
import { overlayImageWithSkeleton } from "/js/components/overlayImage.js";

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

  // Ensure container starts exactly at skeleton position to avoid jump
  if (skeleton) {
    const rect = skeleton.getBoundingClientRect();
    const h = rect.height;
    if (h > 0) {
      //  spacer
      if (!skeleton.__spacerCreated) {
        const spacer = document.createElement("div");
        spacer.style.height = h + "px";
        spacer.setAttribute("data-skeleton-spacer", "true");
        skeleton.parentNode.insertBefore(spacer, skeleton.nextSibling);
        skeleton.__spacerCreated = spacer;
      }
    }
  }

  if (data.length === 0) {
    if (skeleton) skeleton.style.opacity = "0";
    setTimeout(() => {
      if (skeleton) {
        skeleton.style.display = "none";
        if (skeleton.__spacerCreated)
          skeleton.__spacerCreated.style.display = "none";
      }
      if (noLikes) noLikes.style.display = "block";
    }, 500);
    return { cards: [] };
  }

  const preload = await preloadImages(data.map((c) => c.image_url));
  const hasTimeout = preload.length === 0;

  // Абсолютное позиционирование нового контейнера поверх skeleton во время fade
  if (skeleton && !container.__positioned) {
    const skeletonRect = skeleton.getBoundingClientRect();
    const parent = skeleton.parentElement;
    parent.style.position = parent.style.position || "relative";
    container.style.position = "absolute";
    container.style.top = skeleton.offsetTop + "px";
    container.style.left = skeleton.offsetLeft + "px";
    container.style.width = skeletonRect.width + "px";
    container.style.opacity = "0";
    container.__positioned = true;
  }

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

    const { wrapper: overlayWrap } = overlayImageWithSkeleton({
      src: preloadedImage?.img?.src || cat.image_url || PLACEHOLDER.MEDIUM,
      alt: breedName,
      width: "100%",
      height: "100%",
      shape: "rect",
      wrapperClass: "w-full h-full",
      placeholder: PLACEHOLDER.MEDIUM,
      alreadyLoaded: !!(preloadedImage && preloadedImage.img),
      borderClass: "",
    });

    const likeBadge = document.createElement("div");
    likeBadge.className = "absolute top-2 right-2";
    likeBadge.innerHTML = `
      <span class="likes-badge px-3 py-1 bg-indigo-900 bg-opacity-80 text-white rounded-full inline-flex items-center backdrop-blur-sm">
        <i class="fas fa-heart text-red-500 mr-1.5"></i> ${likesCount}
      </span>`;
    overlayWrap.appendChild(likeBadge);
    imgContainer.appendChild(overlayWrap);

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
      container.style.opacity = "1";
      if (skeleton) skeleton.style.opacity = "0";
      setTimeout(() => {
        if (skeleton) {
          skeleton.style.display = "none";
          if (skeleton.__spacerCreated)
            skeleton.__spacerCreated.style.display = "none";
        }
        if (container.__positioned) {
          container.style.position = "relative";
          container.style.top = "0";
          container.style.left = "0";
          container.style.width = "100%";
        }
      }, 450);
    }, 50);
  });

  return { cards: created };
}

export default renderLikesGrid;

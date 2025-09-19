import { sanitize, preloadImages } from "/js/utils.js";
import store, { subscribe } from "/js/core/state/store.js";
import { loadCatDetails } from "/js/core/services/CatDetailsService.js";
import {
  applyCatDetails,
  revealContent,
  showErrorState,
} from "/js/core/ui/catDetails.js";
import { notifyError } from "/js/core/errors/notify.js";
import { registerCleanup } from "/js/core/state/lifecycle.js";

// Simple like state (no backend mutation yet) to avoid double increments quickly
let likeLocked = false;

function navigateSimilar(feature, rawValue) {
  let cleanValue = rawValue;
  if (feature === "weight_metric") {
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
  } else if (feature === "temperament") {
    cleanValue = rawValue.split(",")[0].trim();
  }
  const url = `/similar?feature=${encodeURIComponent(
    feature
  )}&value=${encodeURIComponent(cleanValue)}`;
  window.location.href = url;
}

async function runCatDetails(catId) {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  if (catContent) catContent.setAttribute("aria-busy", "true");
  const startTime = Date.now();
  try {
    const data = await loadCatDetails(catId);
    if (data && data.breed_name) {
      document.title = `${sanitize(data.breed_name)} | Cat Details`;
    }
    // Preload image independently; UI renderer will decide what to show
    const targetUrl = (data && data.image_url) || null;
    let preloadResult = null;
    if (targetUrl) {
      const preload = await preloadImages([targetUrl], 3000);
      if (preload && preload[0]) preloadResult = preload[0];
    }
    // When store updates subscription will apply details. We just ensure reveal timing.
    revealContent({ startTime });
  } catch (err) {
    notifyError(err, { prefix: "Детали кота" });
    showErrorState();
  }
}

function initFeatureNavigation() {
  document.querySelectorAll(".stat-card").forEach((card) => {
    if (card.id === "wiki-link") return;
    card.addEventListener("click", function () {
      const featureType = this.dataset.feature || "";
      const valueElement = this.querySelector("p");
      if (valueElement && featureType) {
        navigateSimilar(featureType, valueElement.textContent);
      }
    });
  });
}

function initLikeButton() {
  const likeBtn = document.getElementById("likeBtn");
  const likesEl = document.getElementById("likes-count");
  if (!likeBtn) return;
  likeBtn.addEventListener("click", () => {
    if (likeLocked) return;
    likeLocked = true;
    const current = parseInt(likesEl.textContent) || 0;
    likesEl.textContent = current + 1; // TODO integrate real like POST
    likeBtn.classList.add("scale-110");
    setTimeout(() => likeBtn.classList.remove("scale-110"), 200);
    setTimeout(() => {
      likeLocked = false;
    }, 400);
  });
}

function showMissingId() {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  document.getElementById("breed-name").textContent = "ID кота не указан";
  skeletonContent.classList.add("hidden");
  catContent.classList.remove("hidden", "opacity-0");
  catContent.classList.add("opacity-100");
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const catId = params.get("id");
  // Bind image error fallback (CSP-safe instead of inline onerror)
  const img = document.getElementById("cat-image");
  if (img && !img.dataset.errorBound) {
    img.addEventListener("error", () => {
      const fallback = img.getAttribute("data-fallback");
      if (fallback && img.src !== fallback) {
        img.src = fallback;
      }
    });
    img.dataset.errorBound = "1";
  }
  if (!catId) {
    showMissingId();
    return;
  }
  initFeatureNavigation();
  initLikeButton();

  // Subscribe once to catDetails state
  const unsub = subscribe(
    (s) => ({
      data: s.catDetails,
      loading: s.loading.catDetails,
      error: s.errors.catDetails,
    }),
    ({ data, loading, error }) => {
      if (data) {
        applyCatDetails({ data });
      }
    }
  );
  registerCleanup(unsub);

  runCatDetails(catId);
}

document.addEventListener("DOMContentLoaded", init);

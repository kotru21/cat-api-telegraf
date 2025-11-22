import { sanitize, preloadImages } from "../utils";
import store, { subscribe } from "../core/state/store";
import { loadCatDetails } from "../core/services/CatDetailsService";
import {
  applyCatDetails,
  revealContent,
  showErrorState,
} from "../core/ui/catDetails";
import { notifyError } from "../core/errors/notify";
import { registerCleanup } from "../core/state/lifecycle";

// Simple like state (no backend mutation yet) to avoid double increments quickly
let likeLocked = false;

function navigateSimilar(feature: string, rawValue: string) {
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

async function runCatDetails(catId: string) {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  if (catContent) catContent.setAttribute("aria-busy", "true");
  const startTime = Date.now();
  try {
    const data: any = await loadCatDetails(catId);
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
    card.addEventListener("click", function (this: HTMLElement) {
      const featureType = this.dataset.feature || "";
      const valueElement = this.querySelector("p");
      if (valueElement && featureType) {
        navigateSimilar(featureType, valueElement.textContent || "");
      }
    });
  });
}

function initLikeButton() {
  const likeBtn = document.getElementById("likeBtn");
  const likesEl = document.getElementById("likes-count");
  if (!likeBtn || !likesEl) return;
  likeBtn.addEventListener("click", () => {
    if (likeLocked) return;
    likeLocked = true;
    const current = parseInt(likesEl.textContent || "0") || 0;
    likesEl.textContent = String(current + 1); // TODO integrate real like POST
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
  const breedName = document.getElementById("breed-name");
  if (breedName) breedName.textContent = "ID кота не указан";
  if (skeletonContent) skeletonContent.classList.add("hidden");
  if (catContent) {
    catContent.classList.remove("hidden", "opacity-0");
    catContent.classList.add("opacity-100");
  }
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const catId = params.get("id");
  // Bind image error fallback (CSP-safe instead of inline onerror)
  const img = document.getElementById("cat-image") as HTMLImageElement;
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

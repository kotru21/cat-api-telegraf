import { getCatDetails } from "/js/api.js";
import { sanitize, PLACEHOLDER, preloadImages } from "/js/utils.js";

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

async function loadCatDetails(catId) {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  const minLoadTime = 800;
  const startTime = Date.now();

  try {
    const data = await getCatDetails(catId);
    document.title = `${sanitize(data.breed_name)} | Cat Details`;

    const breedNameEl = document.getElementById("breed-name");
    const descEl = document.getElementById("description");
    const likesEl = document.getElementById("likes-count");
    const wikiLink = document.getElementById("wiki-link");
    const originEl = document.getElementById("origin");
    const temperamentEl = document.getElementById("temperament");
    const lifeSpanEl = document.getElementById("life-span");
    const weightEl = document.getElementById("weight");

    breedNameEl.textContent = data.breed_name || "Unknown";
    descEl.textContent = data.description || "—";
    likesEl.textContent = data.count ?? 0;
    if (data.wikipedia_url) {
      wikiLink.href = data.wikipedia_url;
      wikiLink.rel = "noopener noreferrer";
    }
    originEl.textContent = data.origin || "—";
    temperamentEl.textContent = data.temperament || "—";
    lifeSpanEl.textContent = data.life_span || "—";
    weightEl.textContent = `${data.weight_imperial || "?"} фунтов (${
      data.weight_metric || "?"
    } кг)`;

    // Preload single image with graceful timeout fallback
    const targetUrl = data.image_url || PLACEHOLDER.LARGE;
    const preload = await preloadImages([targetUrl], 3000);
    const success = preload && preload[0] && preload[0].success;
    const imgElement = document.getElementById("cat-image");
    imgElement.src = success ? preload[0].img.src : targetUrl;

    const elapsed = Date.now() - startTime;
    const remain = Math.max(0, minLoadTime - elapsed);
    setTimeout(() => {
      skeletonContent.classList.add("hidden");
      catContent.classList.remove("hidden");
      requestAnimationFrame(() => {
        catContent.classList.remove("opacity-0");
        catContent.classList.add("opacity-100");
      });
    }, remain);
  } catch (err) {
    console.error("Cat details load error:", err);
    document.getElementById("breed-name").textContent =
      "Ошибка загрузки информации о коте";
    skeletonContent.classList.add("hidden");
    catContent.classList.remove("hidden", "opacity-0");
    catContent.classList.add("opacity-100");
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
  if (!catId) {
    showMissingId();
    return;
  }
  initFeatureNavigation();
  initLikeButton();
  loadCatDetails(catId);
}

document.addEventListener("DOMContentLoaded", init);

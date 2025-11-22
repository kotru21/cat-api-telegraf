import { getSimilarCats } from "../api";
import renderSimilarGrid from "../components/similarGrid";
import { sanitize } from "../utils";
import initPagination from "../components/pagination";

const FEATURE_NAMES = {
  origin: "происхождению",
  temperament: "темпераменту",
  life_span: "продолжительности жизни",
  weight_metric: "весу",
};

function showNoResults(
  message = "К сожалению, мы не нашли котов с похожими характеристиками"
) {
  const resultsContent = document.getElementById("results-content");
  const skeletonContent = document.getElementById("skeleton-content");
  const noResults = document.getElementById("no-results");
  const searchHeader = document.getElementById("search-header");
  if (resultsContent) resultsContent.style.display = "none";
  if (skeletonContent) skeletonContent.style.display = "none";
  if (noResults) {
    noResults.querySelector("p").textContent = message;
    noResults.style.display = "block";
  }
  if (searchHeader) searchHeader.style.display = "none";
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const feature = params.get("feature");
  const value = params.get("value");
  const header = document.getElementById("search-header");

  if (!feature || !value) {
    showNoResults("Не указаны параметры поиска");
    return;
  }

  const featureName = FEATURE_NAMES[feature] || feature;
  if (header) {
    const h1 = header.querySelector("h1");
    const p = header.querySelector("p");
    if (h1) h1.textContent = `Поиск по ${featureName}: ${sanitize(value)}`;
    if (p) p.textContent = "Загрузка результатов...";
  }
  document.title = `Поиск по ${featureName}: ${value} | CatBot`;

  try {
    const data = await getSimilarCats(feature, value);
    if (!Array.isArray(data) || data.length === 0) {
      showNoResults();
      return;
    }
    if (header) {
      const p = header.querySelector("p");
      if (p) p.textContent = `Найдено: ${data.length} пород`;
    }
    const pagination = initPagination({
      totalItems: data.length,
      pageSize: 9,
      mount: "#pagination-controls",
      onPageChange: (page) => {
        const start = (page - 1) * 9;
        const slice = data.slice(start, start + 9);
        renderSimilarGrid({ data, pageData: slice, skipSkeleton: page !== 1 });
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
    if (!pagination) {
      await renderSimilarGrid({ data });
    }
  } catch (e) {
    console.error("similar load error", e);
    showNoResults("Произошла ошибка при загрузке данных");
  }
}

document.addEventListener("DOMContentLoaded", init);

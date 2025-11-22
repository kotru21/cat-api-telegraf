import { PLACEHOLDER } from "../../utils";

interface CatDetailsData {
  breedName: string;
  description: string;
  likes: number;
  wikipediaUrl?: string;
  origin: string;
  temperament: string;
  lifeSpan: string;
  weightMetric: string;
  weightImperial: string;
  imageUrl?: string;
}

interface ApplyCatDetailsOptions {
  data: CatDetailsData;
  container?: Document | HTMLElement;
  preloadResult?: any;
}

export function applyCatDetails({
  data,
  container = document,
  preloadResult,
}: ApplyCatDetailsOptions) {
  if (!data) return;
  const {
    breedName,
    description,
    likes,
    wikipediaUrl,
    origin,
    temperament,
    lifeSpan,
    weightMetric,
    weightImperial,
    imageUrl,
  } = data;

  const titleEl = container.querySelector("#breed-name");
  if (titleEl) titleEl.textContent = breedName;
  const descEl = container.querySelector("#description");
  if (descEl) descEl.textContent = description;
  const likesEl = container.querySelector("#likes-count");
  if (likesEl) likesEl.textContent = String(likes);
  const wikiLink = container.querySelector("#wiki-link") as HTMLAnchorElement;
  if (wikiLink && wikipediaUrl) {
    wikiLink.href = wikipediaUrl;
    wikiLink.rel = "noopener noreferrer";
  }
  const originEl = container.querySelector("#origin");
  if (originEl) originEl.textContent = origin;
  const temperamentEl = container.querySelector("#temperament");
  if (temperamentEl) temperamentEl.textContent = temperament;
  const lifeSpanEl = container.querySelector("#life-span");
  if (lifeSpanEl) lifeSpanEl.textContent = lifeSpan;
  const weightEl = container.querySelector("#weight");
  if (weightEl)
    weightEl.textContent = `${weightImperial} фунтов (${weightMetric} кг)`;

  const imgElement = container.querySelector("#cat-image") as HTMLImageElement;
  if (imgElement) {
    const target = imageUrl || PLACEHOLDER.LARGE;
    if (preloadResult && preloadResult.success && preloadResult.img) {
      imgElement.src = preloadResult.img.src;
    } else {
      imgElement.src = target;
    }
  }
}

export function revealContent({
  skeletonId = "skeleton-content",
  contentId = "cat-content",
  minLoadTime = 800,
  startTime,
}: {
  skeletonId?: string;
  contentId?: string;
  minLoadTime?: number;
  startTime: number;
}) {
  const skeletonContent = document.getElementById(skeletonId);
  const catContent = document.getElementById(contentId);
  const elapsed = Date.now() - startTime;
  const remain = Math.max(0, minLoadTime - elapsed);
  setTimeout(() => {
    if (skeletonContent) skeletonContent.classList.add("hidden");
    if (catContent) {
      catContent.classList.remove("hidden");
      catContent.classList.remove("opacity-0");
      catContent.classList.add("opacity-100");
      catContent.setAttribute("aria-busy", "false");
    }
  }, remain);
}

export function showErrorState(message = "Ошибка загрузки информации о коте") {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  const titleEl = document.getElementById("breed-name");
  if (titleEl) titleEl.textContent = message;
  if (skeletonContent) skeletonContent.classList.add("hidden");
  if (catContent) {
    catContent.classList.remove("hidden", "opacity-0");
    catContent.classList.add("opacity-100");
    catContent.setAttribute("aria-busy", "false");
  }
}

export default { applyCatDetails, revealContent, showErrorState };

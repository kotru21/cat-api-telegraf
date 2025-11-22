// src/web/public/js/api.ts
var API_CACHE = new Map;
var DEFAULT_TTL = 15000;
function setCache(key, data, ttl = DEFAULT_TTL) {
  API_CACHE.set(key, { ts: Date.now(), ttl, data });
}
function getCache(key) {
  const entry = API_CACHE.get(key);
  if (!entry)
    return null;
  if (Date.now() - entry.ts > entry.ttl) {
    API_CACHE.delete(key);
    return null;
  }
  return entry.data;
}
async function fetchJSON(path, {
  method = "GET",
  headers = {},
  body,
  cache = false,
  ttl,
  credentials = "include"
} = {}) {
  const cacheKey = cache ? `${method}:${path}:${body ? JSON.stringify(body) : ""}` : null;
  if (cache && cacheKey) {
    const cached = getCache(cacheKey);
    if (cached)
      return cached;
  }
  const init = {
    method,
    headers: { Accept: "application/json", ...headers },
    credentials
  };
  if (body) {
    init.headers["Content-Type"] = "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(path, init);
  } catch (networkError) {
    throw new Error(`NETWORK_ERROR:${networkError.message}`);
  }
  if (!response.ok) {
    let errPayload = null;
    try {
      errPayload = await response.json();
    } catch (_) {}
    const msg = errPayload?.error || errPayload?.message || `HTTP ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    error.payload = errPayload;
    throw error;
  }
  if (response.status === 204)
    return null;
  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new Error(`INVALID_JSON_RESPONSE:${parseError.message}`);
  }
  if (cache && cacheKey)
    setCache(cacheKey, data, ttl ?? DEFAULT_TTL);
  return data;
}
var getLeaderboard = () => fetchJSON("/api/leaderboard", { cache: true });
var getRandomImages = (count = 3) => fetchJSON(`/api/random-images?count=${count}`, { cache: false });
var getProfile = () => fetchJSON("/api/profile", { cache: false });
var getUserLikes = () => fetchJSON("/api/mylikes", { cache: false });
var getUserLikesCount = () => fetchJSON("/api/user/likes/count", { cache: false });
var deleteLike = (catId) => fetchJSON("/api/like", { method: "DELETE", body: { catId } });
var getCatDetails = (id) => fetchJSON(`/api/cat/${encodeURIComponent(id)}`, { cache: true, ttl: 60000 });
var getSimilarCats = (feature, value) => fetchJSON(`/api/similar?feature=${encodeURIComponent(feature)}&value=${encodeURIComponent(value)}`, { cache: false });
function buildWsUrl(path = "/wss") {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}

// src/web/public/js/utils.ts
function sanitize(text) {
  if (text == null)
    return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function debounce(fn, delay = 200) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}
async function preloadImages(urls = [], timeoutMs = 3000) {
  if (!Array.isArray(urls) || urls.length === 0)
    return [];
  const controller = { timedOut: false };
  const timeout = new Promise((resolve) => {
    setTimeout(() => {
      controller.timedOut = true;
      resolve([]);
    }, timeoutMs);
  });
  const loads = Promise.all(urls.map((url, index) => new Promise((resolve) => {
    if (!url)
      return resolve({ success: false, url, index });
    const img = new Image;
    img.onload = () => resolve({ success: true, url, index, img });
    img.onerror = () => resolve({ success: false, url, index });
    img.src = url;
    if (img.complete) {
      resolve({ success: true, url, index, img });
    }
  })));
  const result = await Promise.race([loads, timeout]);
  return controller.timedOut ? [] : result;
}
var PLACEHOLDER = Object.freeze({
  SMALL: "https://placehold.co/96x96/1F2937/4F46E5?text=No+Img",
  MEDIUM: "https://placehold.co/300x200/1F2937/4F46E5?text=No+Image",
  LARGE: "https://placehold.co/800x600/1F2937/4F46E5?text=No+Image"
});
function createEl(tag, { classes = [], attrs = {}, text } = {}) {
  const el = document.createElement(tag);
  if (classes.length)
    el.className = classes.join(" ");
  Object.entries(attrs).forEach(([k, v]) => {
    if (v != null)
      el.setAttribute(k, v);
  });
  if (text != null)
    el.textContent = text;
  return el;
}
function formatUptime(startDate) {
  const currentDate = new Date;
  const timeDifference = currentDate - startDate;
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(timeDifference / (1000 * 60 * 60) % 24);
  const minutes = Math.floor(timeDifference / (1000 * 60) % 60);
  const seconds = Math.floor(timeDifference / 1000 % 60);
  return {
    days: { value: days, label: "дн." },
    hours: { value: hours, label: "ч." },
    minutes: { value: minutes, label: "мин." },
    seconds: { value: seconds, label: "сек." }
  };
}

// src/web/public/js/components/overlayImage.ts
function overlayImageWithSkeleton({
  src,
  alt = "",
  width,
  height,
  shape = "rect",
  wrapperClass = "",
  imgClass = "",
  skeletonClass = "",
  borderClass = "",
  placeholder = PLACEHOLDER.MEDIUM,
  alreadyLoaded = false,
  lazy = true,
  delay = 50
} = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = `relative inline-block overflow-hidden ${wrapperClass}`.trim();
  if (width != null)
    wrapper.style.width = typeof width === "number" ? width + "px" : width;
  if (height != null)
    wrapper.style.height = typeof height === "number" ? height + "px" : height;
  const sharedRadius = shape === "circle" ? "rounded-full" : "rounded-lg";
  const skeleton = document.createElement("div");
  skeleton.className = `absolute inset-0 ${sharedRadius} bg-gray-700 animate-pulse opacity-100 transition-opacity duration-300 ${borderClass} ${skeletonClass}`.trim();
  const img = document.createElement("img");
  img.alt = alt;
  img.decoding = "async";
  if (lazy)
    img.loading = "lazy";
  img.className = `absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 ${sharedRadius} ${borderClass} ${imgClass}`.trim();
  img.src = src || placeholder;
  const finalize = () => {
    requestAnimationFrame(() => {
      img.classList.add("opacity-100");
      skeleton.classList.add("opacity-0");
      setTimeout(() => skeleton.remove(), 350);
    });
  };
  img.onload = finalize;
  img.onerror = () => {
    if (img.src !== placeholder)
      img.src = placeholder;
    finalize();
  };
  if (alreadyLoaded) {
    requestAnimationFrame(() => setTimeout(finalize, delay));
  }
  wrapper.appendChild(img);
  wrapper.appendChild(skeleton);
  return { wrapper, img, skeleton };
}
var overlayImage_default = overlayImageWithSkeleton;

// src/web/public/js/components/similarGrid.ts
async function renderSimilarGrid({
  data = [],
  pageData,
  skipSkeleton = false
} = {}) {
  const skeletonContent = document.getElementById("skeleton-content");
  const resultsContent = document.getElementById("results-content");
  if (!resultsContent || !skeletonContent)
    return { cards: [] };
  if (!Array.isArray(data) || data.length === 0) {
    skeletonContent.style.display = "none";
    resultsContent.style.display = "none";
    const noResults = document.getElementById("no-results");
    if (noResults)
      noResults.style.display = "block";
    return { cards: [] };
  }
  const renderSet = Array.isArray(pageData) ? pageData : data;
  const preloadResult = await preloadImages(renderSet.map((c) => c.image_url), 3000);
  const hasTimeout = preloadResult.length === 0;
  resultsContent.innerHTML = "";
  const cards = renderSet.map((cat, idx) => {
    const card = document.createElement("div");
    card.className = "cat-card overflow-hidden shadow-lg";
    const preloaded = !hasTimeout && Array.isArray(preloadResult) ? preloadResult.find((r) => r.index === idx && r.success) : null;
    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container overflow-hidden";
    imgContainer.style.aspectRatio = "3/2";
    const { wrapper: overlayWrap } = overlayImage_default({
      src: preloaded && preloaded.img ? preloaded.img.src : cat.image_url || PLACEHOLDER.MEDIUM,
      alt: cat.breed_name || "Cat",
      width: "100%",
      height: "100%",
      shape: "rect",
      wrapperClass: "w-full h-full",
      placeholder: PLACEHOLDER.MEDIUM,
      alreadyLoaded: !!(preloaded && preloaded.img)
    });
    imgContainer.appendChild(overlayWrap);
    const info = document.createElement("div");
    info.className = "p-5";
    info.innerHTML = `
      <h3 class="text-xl font-bold mb-2">${sanitize(cat.breed_name || "Unknown")}</h3>
      <p class="text-gray-400 text-sm mb-4 line-clamp-2">${sanitize(cat.description || "Нет описания")}</p>
      <div class="flex justify-between items-center">
        <span class="cat-likes"><i class="fas fa-heart text-red-500 mr-2"></i> ${cat.count || 0}</span>
        <a href="/catDetails?id=${encodeURIComponent(cat.id)}" class="text-indigo-400 hover:text-indigo-300">
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

// src/web/public/js/components/pagination.ts
function initPagination({
  totalItems,
  pageSize = 9,
  onPageChange,
  mount
}) {
  const mountEl = typeof mount === "string" ? document.querySelector(mount) : mount;
  if (!mountEl)
    return null;
  if (totalItems <= pageSize) {
    mountEl.innerHTML = "";
    return null;
  }
  let currentPage = 1;
  const totalPages = Math.ceil(totalItems / pageSize);
  function buildButton(label, page, disabled = false, active = false) {
    const btn = createEl("button", {
      classes: [
        "px-3",
        "py-2",
        "mx-1",
        "rounded",
        "text-sm",
        "transition-colors",
        "border",
        "border-gray-600"
      ]
    });
    btn.textContent = label;
    if (active) {
      btn.classList.add("bg-indigo-600", "text-white", "border-indigo-500");
    } else {
      btn.classList.add("bg-gray-800", "text-gray-300", "hover:bg-gray-700");
    }
    if (disabled) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      btn.addEventListener("click", () => setPage(page));
    }
    return btn;
  }
  function renderControls() {
    mountEl.innerHTML = "";
    const container = createEl("div", {
      classes: ["flex", "items-center", "flex-wrap", "justify-center"]
    });
    container.appendChild(buildButton("«", currentPage - 1, currentPage === 1));
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }
    if (start > 1) {
      container.appendChild(buildButton("1", 1, false, currentPage === 1));
      if (start > 2) {
        const dots = createEl("span", {
          classes: ["mx-1", "text-gray-400", "select-none"],
          text: "…"
        });
        container.appendChild(dots);
      }
    }
    for (let p = start;p <= end; p++) {
      container.appendChild(buildButton(String(p), p, false, p === currentPage));
    }
    if (end < totalPages) {
      if (end < totalPages - 1) {
        const dots2 = createEl("span", {
          classes: ["mx-1", "text-gray-400", "select-none"],
          text: "…"
        });
        container.appendChild(dots2);
      }
      container.appendChild(buildButton(String(totalPages), totalPages, false, currentPage === totalPages));
    }
    container.appendChild(buildButton("»", currentPage + 1, currentPage === totalPages));
    mountEl.appendChild(container);
  }
  function sliceData(data) {
    const startIdx = (currentPage - 1) * pageSize;
    return data.slice(startIdx, startIdx + pageSize);
  }
  function setPage(p) {
    if (p < 1 || p > totalPages || p === currentPage)
      return;
    currentPage = p;
    renderControls();
    if (typeof onPageChange === "function")
      onPageChange(currentPage);
  }
  renderControls();
  if (typeof onPageChange === "function")
    onPageChange(currentPage);
  return {
    setPage,
    getPage: () => currentPage,
    getTotalPages: () => totalPages,
    pageSize,
    sliceData
  };
}

// src/web/public/js/pages/similarPage.ts
var FEATURE_NAMES = {
  origin: "происхождению",
  temperament: "темпераменту",
  life_span: "продолжительности жизни",
  weight_metric: "весу"
};
function showNoResults(message = "К сожалению, мы не нашли котов с похожими характеристиками") {
  const resultsContent = document.getElementById("results-content");
  const skeletonContent = document.getElementById("skeleton-content");
  const noResults = document.getElementById("no-results");
  const searchHeader = document.getElementById("search-header");
  if (resultsContent)
    resultsContent.style.display = "none";
  if (skeletonContent)
    skeletonContent.style.display = "none";
  if (noResults) {
    noResults.querySelector("p").textContent = message;
    noResults.style.display = "block";
  }
  if (searchHeader)
    searchHeader.style.display = "none";
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
    if (h1)
      h1.textContent = `Поиск по ${featureName}: ${sanitize(value)}`;
    if (p)
      p.textContent = "Загрузка результатов...";
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
      if (p)
        p.textContent = `Найдено: ${data.length} пород`;
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
      }
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

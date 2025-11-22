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

// src/web/public/js/core/state/store.ts
var listeners = new Set;
var eventMap = new Map;
var state = {
  leaderboard: [],
  likes: [],
  profile: null,
  likesCount: 0,
  loading: { leaderboard: false, likes: false, profile: false },
  errors: { leaderboard: null, likes: null, profile: null },
  meta: {}
};
function shallowEqual(a, b) {
  if (Object.is(a, b))
    return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b)
    return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length)
    return false;
  for (const k of ka)
    if (!Object.is(a[k], b[k]))
      return false;
  return true;
}
function getState() {
  return state;
}
function setState(patch) {
  const prev = { ...state };
  Object.entries(patch).forEach(([k, v]) => {
    if (v && typeof v === "object" && !Array.isArray(v) && state[k]) {
      state[k] = { ...state[k], ...v };
    } else {
      state[k] = v;
    }
  });
  listeners.forEach((entry) => {
    try {
      const nextSel = entry.selector(state);
      if (!shallowEqual(entry.lastValue, nextSel)) {
        entry.lastValue = Array.isArray(nextSel) ? [...nextSel] : nextSel && typeof nextSel === "object" ? { ...nextSel } : nextSel;
        entry.cb(nextSel, prev);
      }
    } catch (e) {
      console.error("Store subscriber error", e);
    }
  });
}
function subscribe(selector, cb) {
  const entry = { selector, cb, lastValue: selector(state) };
  listeners.add(entry);
  return () => listeners.delete(entry);
}
function on(eventName, handler) {
  if (!eventMap.has(eventName))
    eventMap.set(eventName, new Set);
  eventMap.get(eventName).add(handler);
  return () => off(eventName, handler);
}
function off(eventName, handler) {
  const set = eventMap.get(eventName);
  if (set)
    set.delete(handler);
}
function emit(eventName, payload) {
  const set = eventMap.get(eventName);
  if (set) {
    set.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error("Event handler error", e);
      }
    });
  }
}
var store = { getState, setState, subscribe, on, off, emit };
var store_default = store;

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

// src/web/public/js/core/services/CatDetailsService.ts
var cache = new Map;
var TTL = 30 * 1000;
function normalizeCatDetails(raw) {
  if (!raw)
    return null;
  return {
    id: raw.id,
    breedName: raw.breed_name || "Unknown",
    description: raw.description || "—",
    likes: raw.count ?? 0,
    wikipediaUrl: raw.wikipedia_url || null,
    origin: raw.origin || "—",
    temperament: raw.temperament || "—",
    lifeSpan: raw.life_span || "—",
    weightMetric: raw.weight_metric || "?",
    weightImperial: raw.weight_imperial || "?",
    imageUrl: raw.image_url || null
  };
}
async function loadCatDetails(catId, { force = false } = {}) {
  if (!catId)
    return;
  const now = Date.now();
  const cached = cache.get(catId);
  if (!force && cached && now - cached.ts < TTL) {
    store_default.setState({
      catDetails: normalizeCatDetails(cached.data),
      loading: { ...store_default.getState().loading, catDetails: false }
    });
    emit("catDetails:loaded");
    return cached.data;
  }
  store_default.setState({
    loading: { ...store_default.getState().loading, catDetails: true },
    errors: { ...store_default.getState().errors, catDetails: null }
  });
  emit("catDetails:loading");
  try {
    const data = await getCatDetails(catId);
    cache.set(catId, { data, ts: now });
    store_default.setState({
      catDetails: normalizeCatDetails(data),
      loading: { ...store_default.getState().loading, catDetails: false }
    });
    emit("catDetails:loaded");
    return data;
  } catch (err) {
    store_default.setState({
      errors: { ...store_default.getState().errors, catDetails: err },
      loading: { ...store_default.getState().loading, catDetails: false }
    });
    emit("catDetails:error");
    throw err;
  }
}

// src/web/public/js/core/ui/catDetails.ts
function applyCatDetails({ data, container = document, preloadResult }) {
  if (!data)
    return;
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
    imageUrl
  } = data;
  const titleEl = container.getElementById("breed-name");
  if (titleEl)
    titleEl.textContent = breedName;
  const descEl = container.getElementById("description");
  if (descEl)
    descEl.textContent = description;
  const likesEl = container.getElementById("likes-count");
  if (likesEl)
    likesEl.textContent = likes;
  const wikiLink = container.getElementById("wiki-link");
  if (wikiLink && wikipediaUrl) {
    wikiLink.href = wikipediaUrl;
    wikiLink.rel = "noopener noreferrer";
  }
  const originEl = container.getElementById("origin");
  if (originEl)
    originEl.textContent = origin;
  const temperamentEl = container.getElementById("temperament");
  if (temperamentEl)
    temperamentEl.textContent = temperament;
  const lifeSpanEl = container.getElementById("life-span");
  if (lifeSpanEl)
    lifeSpanEl.textContent = lifeSpan;
  const weightEl = container.getElementById("weight");
  if (weightEl)
    weightEl.textContent = `${weightImperial} фунтов (${weightMetric} кг)`;
  const imgElement = container.getElementById("cat-image");
  if (imgElement) {
    const target = imageUrl || PLACEHOLDER.LARGE;
    if (preloadResult && preloadResult.success && preloadResult.img) {
      imgElement.src = preloadResult.img.src;
    } else {
      imgElement.src = target;
    }
  }
}
function revealContent({
  skeletonId = "skeleton-content",
  contentId = "cat-content",
  minLoadTime = 800,
  startTime
}) {
  const skeletonContent = document.getElementById(skeletonId);
  const catContent = document.getElementById(contentId);
  const elapsed = Date.now() - startTime;
  const remain = Math.max(0, minLoadTime - elapsed);
  setTimeout(() => {
    if (skeletonContent)
      skeletonContent.classList.add("hidden");
    if (catContent) {
      catContent.classList.remove("hidden");
      catContent.classList.remove("opacity-0");
      catContent.classList.add("opacity-100");
      catContent.setAttribute("aria-busy", "false");
    }
  }, remain);
}
function showErrorState(message = "Ошибка загрузки информации о коте") {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  const titleEl = document.getElementById("breed-name");
  if (titleEl)
    titleEl.textContent = message;
  if (skeletonContent)
    skeletonContent.classList.add("hidden");
  if (catContent) {
    catContent.classList.remove("hidden", "opacity-0");
    catContent.classList.add("opacity-100");
    catContent.setAttribute("aria-busy", "false");
  }
}

// src/web/public/js/toast.ts
function showToast(message, type = "info", { timeoutMs = 3500 } = {}) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.top = "1rem";
    container.style.right = "1rem";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "0.75rem";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 fade-in";
  toast.style.backdropFilter = "blur(6px)";
  toast.style.border = "1px solid rgba(255,255,255,0.1)";
  toast.style.transition = "all .3s ease";
  const palette = {
    success: {
      bg: "bg-green-800",
      icon: "check-circle",
      color: "text-green-400"
    },
    error: {
      bg: "bg-red-800",
      icon: "exclamation-circle",
      color: "text-red-400"
    },
    info: { bg: "bg-gray-800", icon: "info-circle", color: "text-blue-400" }
  };
  const p = palette[type] || palette.info;
  toast.classList.add(p.bg);
  toast.innerHTML = `
    <i class="fas fa-${p.icon} ${p.color}"></i>
    <span>${sanitize(message)}</span>
    <button aria-label="Close" class="ml-2 text-sm opacity-70 hover:opacity-100 transition" style="line-height:1">✕</button>
  `;
  const closeBtn = toast.querySelector("button");
  closeBtn.addEventListener("click", () => dismiss());
  function dismiss() {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    setTimeout(() => toast.remove(), 250);
  }
  container.appendChild(toast);
  setTimeout(dismiss, timeoutMs);
  return dismiss;
}
var toast_default = showToast;

// src/web/public/js/core/errors/errorMapper.ts
function mapError(err) {
  if (!err)
    return "Неизвестная ошибка";
  if (err.status === 401)
    return "Необходима авторизация";
  if (err.status === 404)
    return "Не найдено";
  if (String(err.message || "").startsWith("NETWORK_ERROR"))
    return "Проблемы с сетью";
  return err.message || "Ошибка";
}

// src/web/public/js/core/errors/notify.ts
var lastMsg = null;
var lastTs = 0;
var DEDUP_WINDOW = 1500;
function notifyError(err, { prefix } = {}) {
  const msg = mapError(err);
  const full = prefix ? `${prefix}: ${msg}` : msg;
  const now = Date.now();
  if (full === lastMsg && now - lastTs < DEDUP_WINDOW)
    return;
  lastMsg = full;
  lastTs = now;
  toast_default(full, "error");
}
function notifySuccess(message, { dedup = false } = {}) {
  const now = Date.now();
  if (dedup && message === lastMsg && now - lastTs < 1000)
    return;
  lastMsg = message;
  lastTs = now;
  toast_default(message, "success");
}

// src/web/public/js/core/state/lifecycle.ts
var cleanups = new Set;
function registerCleanup(fn) {
  if (typeof fn !== "function")
    return () => {};
  cleanups.add(fn);
  return () => cleanups.delete(fn);
}

// src/web/public/js/pages/catDetailsPage.ts
var likeLocked = false;
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
  const url = `/similar?feature=${encodeURIComponent(feature)}&value=${encodeURIComponent(cleanValue)}`;
  window.location.href = url;
}
async function runCatDetails(catId) {
  const skeletonContent = document.getElementById("skeleton-content");
  const catContent = document.getElementById("cat-content");
  if (catContent)
    catContent.setAttribute("aria-busy", "true");
  const startTime = Date.now();
  try {
    const data = await loadCatDetails(catId);
    if (data && data.breed_name) {
      document.title = `${sanitize(data.breed_name)} | Cat Details`;
    }
    const targetUrl = data && data.image_url || null;
    let preloadResult = null;
    if (targetUrl) {
      const preload = await preloadImages([targetUrl], 3000);
      if (preload && preload[0])
        preloadResult = preload[0];
    }
    revealContent({ startTime });
  } catch (err) {
    notifyError(err, { prefix: "Детали кота" });
    showErrorState();
  }
}
function initFeatureNavigation() {
  document.querySelectorAll(".stat-card").forEach((card) => {
    if (card.id === "wiki-link")
      return;
    card.addEventListener("click", function() {
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
  if (!likeBtn)
    return;
  likeBtn.addEventListener("click", () => {
    if (likeLocked)
      return;
    likeLocked = true;
    const current = parseInt(likesEl.textContent) || 0;
    likesEl.textContent = current + 1;
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
  const unsub = subscribe((s) => ({
    data: s.catDetails,
    loading: s.loading.catDetails,
    error: s.errors.catDetails
  }), ({ data, loading, error }) => {
    if (data) {
      applyCatDetails({ data });
    }
  });
  registerCleanup(unsub);
  runCatDetails(catId);
}
document.addEventListener("DOMContentLoaded", init);

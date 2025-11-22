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

// src/web/public/js/components/heroAvatars.ts
async function initHeroAvatars({
  containerSelector = "#hero-cats-container",
  count = 3
} = {}) {
  const container = document.querySelector(containerSelector);
  if (!container)
    return;
  const skeletonHTML = container.innerHTML;
  try {
    const images = await getRandomImages(count);
    const preloadPromises = images.map((img, index) => new Promise((resolve) => {
      const pre = new Image;
      pre.onload = () => resolve({ loaded: true, index, data: img, src: pre.src });
      pre.onerror = () => resolve({ loaded: false, index, data: img });
      pre.src = img.image_url;
      if (pre.complete)
        resolve({ loaded: true, index, data: img, src: pre.src });
    }));
    const results = await Promise.all(preloadPromises);
    results.sort((a, b) => a.index - b.index);
    container.innerHTML = "";
    results.forEach((result) => {
      const { wrapper } = overlayImage_default({
        src: result.loaded ? result.src : PLACEHOLDER.SMALL,
        alt: "Cat",
        width: 40,
        height: 40,
        shape: "circle",
        borderClass: "border-2 border-indigo-600",
        wrapperClass: "mr-[-0.5rem] first:ml-0",
        alreadyLoaded: result.loaded,
        placeholder: PLACEHOLDER.SMALL
      });
      container.appendChild(wrapper);
    });
  } catch (err) {
    console.error("Ошибка при загрузке аватаров котов:", err);
    container.innerHTML = skeletonHTML;
  }
}
var heroAvatars_default = initHeroAvatars;

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

// src/web/public/js/core/services/LeaderboardService.ts
function normalizeRow(row, index = 0) {
  const catId = row.id || row.breed_id || row.cat_id || undefined;
  if (!catId && process?.env?.NODE_ENV !== "production") {
    console.warn("normalizeRow: missing id field in leaderboard row", row);
  }
  return {
    position: row.rank != null ? row.rank : index + 1,
    catId,
    breedName: row.breed_name || "Unknown Breed",
    likes: row.likes != null ? row.likes : row.count != null ? row.count : undefined,
    change: 0,
    imageUrl: row.image_url || ""
  };
}
var lastLoadTs = 0;
var CACHE_TTL = 15000;
async function loadLeaderboard({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastLoadTs < CACHE_TTL && getState().leaderboard.length) {
    return getState().leaderboard;
  }
  emit("leaderboard:loading");
  setState({ loading: { leaderboard: true }, errors: { leaderboard: null } });
  try {
    const raw = await getLeaderboard();
    const data = Array.isArray(raw) ? raw.map((r, i) => normalizeRow(r, i)) : [];
    lastLoadTs = Date.now();
    setState({ leaderboard: data, loading: { leaderboard: false } });
    emit("leaderboard:loaded", data);
    return data;
  } catch (err) {
    console.error("Leaderboard load failed", err);
    setState({ loading: { leaderboard: false }, errors: { leaderboard: err } });
    emit("leaderboard:error", err);
    throw err;
  }
}

// src/web/public/js/core/ui/leaderboard.ts
function createLeaderboardRow(row, index) {
  const tr = document.createElement("tr");
  tr.className = "relative overflow-hidden";
  const rank = document.createElement("td");
  rank.className = "px-4 py-4 border-b border-gray-800 bg-gray-800/40 text-left align-middle";
  rank.innerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3 ? "bg-indigo-600 text-white" : "bg-indigo-900 text-indigo-200"}">${index + 1}</div>`;
  const imgCell = document.createElement("td");
  imgCell.className = "px-4 py-4 border-b border-gray-800 bg-gray-800/30 text-center align-middle";
  const imgWrap = document.createElement("div");
  imgWrap.className = "mx-auto w-24 h-24 rounded-lg overflow-hidden bg-gray-800/40";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = row.breedName;
  img.className = "w-24 h-24 object-cover rounded-lg opacity-0 transition-opacity duration-300";
  img.src = row.imageUrl || PLACEHOLDER.SMALL;
  img.onload = () => requestAnimationFrame(() => img.classList.add("opacity-100"));
  img.onerror = () => {
    if (img.src !== PLACEHOLDER.SMALL)
      img.src = PLACEHOLDER.SMALL;
    img.classList.add("opacity-100");
  };
  imgWrap.appendChild(img);
  imgCell.appendChild(imgWrap);
  const name = document.createElement("td");
  name.className = "px-4 py-4 border-b border-gray-800 bg-gray-800/40 text-left align-middle";
  const safeName = row.breedName.replace(/</g, "&lt;");
  if (row.catId) {
    name.innerHTML = `<a href="/catDetails?id=${encodeURIComponent(row.catId)}" class="text-indigo-400 hover:text-indigo-300 transition-colors">${safeName}</a>`;
  } else {
    name.innerHTML = `<span class="text-gray-400" title="ID недоступен">${safeName}</span>`;
  }
  const likes = document.createElement("td");
  likes.className = "px-4 py-4 border-b border-gray-800 bg-gray-800/30 text-center align-middle";
  likes.innerHTML = `<div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300"><i class="fas fa-heart text-red-500 mr-1.5"></i> ${row.likes}</div>`;
  tr.appendChild(rank);
  tr.appendChild(imgCell);
  tr.appendChild(name);
  tr.appendChild(likes);
  return tr;
}
function renderLeaderboard({ tableBody, data }) {
  if (!tableBody)
    return;
  const frag = document.createDocumentFragment();
  data.forEach((row, i) => frag.appendChild(createLeaderboardRow(row, i)));
  tableBody.innerHTML = "";
  tableBody.appendChild(frag);
}

// src/web/public/js/core/ui/skeleton.ts
function mountTableSkeleton({ tableBody, template, count = 5 }) {
  if (!tableBody || !template)
    return () => {};
  tableBody.innerHTML = "";
  for (let i = 0;i < count; i++) {
    const clone = document.importNode(template.content, true);
    Array.from(clone.querySelectorAll("*")).forEach((el) => el.setAttribute("aria-hidden", "true"));
    tableBody.appendChild(clone);
  }
  return () => tableBody.innerHTML = "";
}
function renderFallbackRow(tableBody, { text, colspan = 4, classes = "" }) {
  if (!tableBody)
    return;
  tableBody.innerHTML = `<tr><td colspan="${colspan}" class="${classes} text-center py-8 text-gray-400">${text}</td></tr>`;
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

// src/web/public/js/pages/indexPage.ts
function initStatsWebSocket({
  messageSelector = "#messageOutput",
  timeSelector = "#timeOutput",
  messageLoader = "#messageLoader",
  timeLoader = "#timeLoader"
} = {}) {
  const msgEl = document.querySelector(messageSelector);
  const timeEl = document.querySelector(timeSelector);
  const msgLoader = document.querySelector(messageLoader);
  const timeLoaderEl = document.querySelector(timeLoader);
  if (!msgEl || !timeEl)
    return;
  let dataReceived = false;
  const ws = new WebSocket(buildWsUrl());
  function showContent() {
    [msgLoader, timeLoaderEl].forEach((l) => {
      if (l)
        l.classList.add("hidden");
    });
    msgEl.classList.remove("hidden");
    timeEl.classList.remove("hidden");
  }
  ws.onopen = () => {};
  ws.onmessage = (event) => {
    dataReceived = true;
    try {
      const { messageCount, uptimeDateObject } = JSON.parse(event.data);
      if (messageCount != null) {
        msgEl.textContent = messageCount;
      }
      if (uptimeDateObject) {
        const startDate = new Date(uptimeDateObject);
        const updateCounter = () => {
          const uptimeData = formatUptime(startDate);
          const daysEl = document.getElementById("uptime-days");
          const hoursEl = document.getElementById("uptime-hours");
          const minutesEl = document.getElementById("uptime-minutes");
          const secondsEl = document.getElementById("uptime-seconds");
          if (daysEl)
            daysEl.textContent = uptimeData.days.value;
          if (hoursEl)
            hoursEl.textContent = uptimeData.hours.value;
          if (minutesEl)
            minutesEl.textContent = uptimeData.minutes.value;
          if (secondsEl)
            secondsEl.textContent = uptimeData.seconds.value;
        };
        updateCounter();
        setInterval(updateCounter, 1000);
      }
      setTimeout(showContent, 500);
    } catch (e) {
      console.error("Invalid WS payload", e);
    }
  };
  setTimeout(() => {
    if (dataReceived)
      showContent();
  }, 1500);
  ws.onerror = () => {
    showContent();
    msgEl.textContent = "Ошибка подключения";
    timeEl.textContent = "Ошибка подключения";
  };
  ws.onclose = () => {
    showContent();
  };
}
function initLeaderboardController() {
  const tableBody = document.querySelector("#leaderboard-table tbody");
  const table = document.getElementById("leaderboard-table");
  const skeletonTemplate = document.querySelector("#skeleton-row");
  let clearSkeleton = null;
  if (tableBody && skeletonTemplate) {
    clearSkeleton = mountTableSkeleton({
      tableBody,
      template: skeletonTemplate,
      count: 5
    });
  }
  if (table)
    table.setAttribute("aria-busy", "true");
  const unsub = subscribe((s) => ({
    data: s.leaderboard,
    loading: s.loading.leaderboard,
    error: s.errors.leaderboard
  }), ({ data, loading, error }) => {
    if (!tableBody)
      return;
    if (loading)
      return;
    if (error) {
      if (clearSkeleton)
        clearSkeleton();
      renderFallbackRow(tableBody, {
        text: "Ошибка загрузки. Попробуйте позже."
      });
      notifyError(error, { prefix: "Лидерборд" });
      if (table)
        table.setAttribute("aria-busy", "false");
      return;
    }
    if (!data || data.length === 0) {
      if (clearSkeleton)
        clearSkeleton();
      renderFallbackRow(tableBody, { text: "Нет данных для отображения." });
      if (table)
        table.setAttribute("aria-busy", "false");
      return;
    }
    if (clearSkeleton)
      clearSkeleton();
    renderLeaderboard({ tableBody, data });
    if (table)
      table.setAttribute("aria-busy", "false");
  });
  registerCleanup(unsub);
  loadLeaderboard().catch(() => {});
}
async function init() {
  await heroAvatars_default({});
  initLeaderboardController();
  initStatsWebSocket({});
}
document.addEventListener("DOMContentLoaded", init);

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

// src/web/public/js/components/searchAndSort.ts
function initSearchAndSort({
  searchInputSelector = "#search-input",
  sortSelectSelector = "#sort-select",
  containerSelector = "#user-likes",
  resultsBlockSelector = "#search-results",
  resultsCountSelector = "#results-count",
  emptyClass = "empty-state"
} = {}) {
  const searchInput = document.querySelector(searchInputSelector);
  const sortSelect = document.querySelector(sortSelectSelector);
  const container = document.querySelector(containerSelector);
  const resultsBlock = document.querySelector(resultsBlockSelector);
  const resultsCount = document.querySelector(resultsCountSelector);
  if (!searchInput || !sortSelect || !container)
    return {};
  let allCats = [];
  function snapshot() {
    const cards = Array.from(container.children).filter((el) => el.classList.contains("cat-card"));
    allCats = cards.map((card) => ({
      element: card,
      breedName: card.querySelector("h3")?.textContent.toLowerCase() || "",
      likesCount: parseInt(card.querySelector(".likes-badge")?.textContent.split(" ")[0]) || 0
    }));
    console.log(`Snapshot: found ${allCats.length} cats`);
  }
  function filterCats(items, term) {
    if (!term)
      return items;
    return items.filter((c) => c.breedName.includes(term));
  }
  function sortCats(items, sortBy) {
    if (sortBy === "name")
      return [...items].sort((a, b) => a.breedName.localeCompare(b.breedName));
    if (sortBy === "likes")
      return [...items].sort((a, b) => b.likesCount - a.likesCount);
    return items;
  }
  function render(list, term) {
    container.innerHTML = "";
    list.forEach((c) => container.appendChild(c.element));
    if ((term || sortSelect.value !== "latest") && resultsBlock && resultsCount) {
      resultsBlock.style.display = "block";
      resultsCount.textContent = list.length;
    } else if (resultsBlock) {
      resultsBlock.style.display = "none";
    }
    if (list.length === 0 && allCats.length > 0) {
      const noResults = document.createElement("div");
      noResults.className = `${emptyClass} text-center py-10 rounded-2xl col-span-full`;
      noResults.innerHTML = `
        <i class="fas fa-search text-3xl text-gray-600 mb-4"></i>
        <h3 class="text-xl font-semibold mb-2">Ничего не найдено</h3>
        <p class="text-gray-400">Попробуйте изменить параметры поиска</p>`;
      container.appendChild(noResults);
    }
  }
  function apply() {
    const term = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;
    let list = filterCats(allCats, term);
    list = sortCats(list, sortBy);
    render(list, term);
  }
  const debounced = debounce(apply, 200);
  searchInput.addEventListener("input", debounced);
  sortSelect.addEventListener("change", apply);
  function refresh() {
    snapshot();
    apply();
  }
  snapshot();
  return { refresh };
}
var searchAndSort_default = initSearchAndSort;

// src/web/public/js/components/confirmationModal.ts
function initConfirmationModal({
  modalSelector = "#confirmation-modal",
  breedNameSelector = "#modal-breed-name",
  cancelSelector = "#modal-cancel",
  confirmSelector = "#modal-confirm"
} = {}) {
  const modal = document.querySelector(modalSelector);
  const breedNameEl = document.querySelector(breedNameSelector);
  const cancelBtn = document.querySelector(cancelSelector);
  const confirmBtn = document.querySelector(confirmSelector);
  if (!modal || !breedNameEl || !cancelBtn || !confirmBtn)
    return { show: () => {} };
  function show(breedName, onConfirm) {
    breedNameEl.textContent = breedName;
    modal.style.display = "flex";
    const handleCancel = () => cleanup();
    const handleConfirm = () => {
      if (onConfirm)
        onConfirm();
      cleanup();
    };
    function cleanup() {
      modal.style.display = "none";
      cancelBtn.removeEventListener("click", handleCancel);
      confirmBtn.removeEventListener("click", handleConfirm);
    }
    cancelBtn.addEventListener("click", handleCancel);
    confirmBtn.addEventListener("click", handleConfirm);
  }
  return { show };
}
var confirmationModal_default = initConfirmationModal;

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

// src/web/public/js/core/services/LikesService.ts
function normalizeLike(row) {
  return {
    catId: row.cat_id,
    breedName: row.breed_name || "Unknown",
    imageUrl: row.image_url || row.imageUrl || "",
    likes: row.likes_count || row.count || 0
  };
}
var lastLikesTs = 0;
var LIKES_TTL = 1e4;
async function loadLikes({ force = false } = {}) {
  const now = Date.now();
  const st = getState();
  if (!force && now - lastLikesTs < LIKES_TTL && st.likes.length)
    return st.likes;
  emit("likes:loading");
  setState({ loading: { likes: true }, errors: { likes: null } });
  try {
    const raw = await getUserLikes();
    const data = Array.isArray(raw) ? raw.map(normalizeLike) : [];
    lastLikesTs = Date.now();
    setState({ likes: data, loading: { likes: false } });
    emit("likes:updated", data);
    try {
      const { count } = await getUserLikesCount();
      setState({ likesCount: count });
      emit("likes:count", count);
    } catch (_) {}
    return data;
  } catch (err) {
    console.error("Load likes failed", err);
    setState({ loading: { likes: false }, errors: { likes: err } });
    emit("likes:error", err);
    throw err;
  }
}
async function removeLike(catId) {
  const prev = getState().likes;
  const next = prev.filter((l) => String(l.catId) !== String(catId));
  setState({ likes: next, likesCount: Math.max(0, getState().likesCount - 1) });
  emit("like:removed", { catId });
  try {
    await deleteLike(catId);
    emit("likes:updated", getState().likes);
  } catch (err) {
    console.error("Remove like failed, rolling back", err);
    setState({ likes: prev, likesCount: prev.length });
    emit("likes:error", err);
    throw err;
  }
}

// src/web/public/js/core/services/ProfileService.ts
var lastProfileTs = 0;
var PROFILE_TTL = 30000;
async function loadProfile({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastProfileTs < PROFILE_TTL)
    return;
  emit("profile:loading");
  setState({ loading: { profile: true }, errors: { profile: null } });
  try {
    const profile = await getProfile();
    lastProfileTs = Date.now();
    setState({ profile, loading: { profile: false } });
    emit("profile:loaded", profile);
    try {
      const { count } = await getUserLikesCount();
      setState({ likesCount: count });
      emit("likes:count", count);
    } catch (_) {}
    return profile;
  } catch (err) {
    setState({ loading: { profile: false }, errors: { profile: err } });
    emit("profile:error", err);
    throw err;
  }
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

// src/web/public/js/core/ui/likes.ts
function createLikeCard(like, { onRemove } = {}) {
  const card = document.createElement("div");
  card.className = "cat-card";
  const imgContainer = document.createElement("div");
  imgContainer.className = "relative overflow-hidden rounded-2xl";
  imgContainer.style.height = "200px";
  const { wrapper } = overlayImage_default({
    src: like.imageUrl || PLACEHOLDER.MEDIUM,
    alt: like.breedName,
    width: "100%",
    height: "100%",
    shape: "rect",
    wrapperClass: "w-full h-full",
    placeholder: PLACEHOLDER.MEDIUM,
    alreadyLoaded: false
  });
  const badge = document.createElement("div");
  badge.className = "absolute top-2 right-2";
  badge.innerHTML = `<span class="likes-badge px-3 py-1 bg-indigo-900 bg-opacity-80 text-white rounded-full inline-flex items-center backdrop-blur-sm" role="status" aria-label="Лайков: ${like.likes}"><i class="fas fa-heart text-red-500 mr-1.5" aria-hidden="true"></i> ${like.likes}</span>`;
  wrapper.appendChild(badge);
  imgContainer.appendChild(wrapper);
  const info = document.createElement("div");
  info.className = "p-5";
  info.innerHTML = `
    <h3 class="text-xl font-bold mb-3">${sanitize(like.breedName)}</h3>
    <div class="flex flex-col space-y-3">
      <a href="/catDetails?id=${encodeURIComponent(like.catId)}" class="text-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
        <i class="fas fa-info-circle mr-1"></i> Подробнее
      </a>
      <button class="remove-like-btn text-center py-2 px-4 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg flex items-center justify-center gap-2" data-cat-id="${sanitize(like.catId)}" data-breed-name="${sanitize(like.breedName)}" aria-label="Удалить лайк породы ${sanitize(like.breedName)}">
        <i class="fas fa-heart-broken" aria-hidden="true"></i> Удалить лайк
      </button>
    </div>`;
  card.setAttribute("role", "listitem");
  card.appendChild(imgContainer);
  card.appendChild(info);
  if (onRemove) {
    card.querySelector(".remove-like-btn")?.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      onRemove({
        catId: btn.getAttribute("data-cat-id"),
        breedName: btn.getAttribute("data-breed-name"),
        card
      });
    });
  }
  return card;
}
function renderLikes({ container, data, onRemove }) {
  if (!container)
    return [];
  const frag = document.createDocumentFragment();
  const cards = data.map((l) => {
    const card = createLikeCard(l, { onRemove });
    frag.appendChild(card);
    return card;
  });
  container.innerHTML = "";
  container.appendChild(frag);
  return cards;
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

// src/web/public/js/pages/profilePage.ts
function applyProfile(profileData) {
  if (!profileData)
    return;
  const avatar = document.getElementById("user-avatar");
  if (!avatar.dataset.bound) {
    avatar.addEventListener("error", function() {
      this.src = this.getAttribute("data-fallback");
    });
    avatar.dataset.bound = "1";
  }
  document.getElementById("user-name").textContent = sanitize((profileData.first_name || "") + (profileData.last_name ? " " + profileData.last_name : ""));
  document.getElementById("user-username").textContent = "@" + sanitize(profileData.username);
  if (profileData.photo_url && profileData.photo_url.trim() !== "") {
    avatar.src = profileData.photo_url;
  } else {
    avatar.src = avatar.getAttribute("data-fallback");
  }
  const lastActive = document.getElementById("last-active");
  if (lastActive)
    lastActive.textContent = "Сегодня";
}
function handleRemove(modal, searchModule) {
  return ({ catId, breedName, card }) => {
    modal.show(breedName, async () => {
      try {
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        card.style.transition = "all 0.25s ease";
        await removeLike(catId);
        setTimeout(() => {
          card.remove();
          notifySuccess("Лайк успешно удален");
          if (searchModule && searchModule.refresh)
            searchModule.refresh();
          if (store_default.getState().likes.length === 0) {
            document.getElementById("user-likes").style.display = "none";
            const noLikes = document.getElementById("no-likes");
            if (noLikes)
              noLikes.style.display = "block";
          }
        }, 240);
      } catch (err) {
        console.error("Ошибка при удалении лайка", err);
        notifyError(err, { prefix: "Удаление лайка" });
        card.style.opacity = "1";
        card.style.transform = "none";
      }
    });
  };
}
function initScrollHeader() {
  window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");
    if (!nav)
      return;
    if (window.scrollY > 10) {
      nav.classList.add("shadow-md", "bg-gray-900");
      nav.classList.remove("bg-none");
    } else {
      nav.classList.remove("shadow-md", "bg-gray-900");
      nav.classList.add("bg-none");
    }
  });
}
async function init() {
  initScrollHeader();
  const modal = confirmationModal_default({});
  let searchModule = null;
  const unsubProfile = subscribe((s) => ({
    profile: s.profile,
    pLoading: s.loading.profile,
    error: s.errors.profile
  }), ({ profile, pLoading, error }) => {
    if (profile)
      applyProfile(profile);
    if (error)
      notifyError(error, { prefix: "Профиль" });
  });
  registerCleanup(unsubProfile);
  const unsubLikes = subscribe((s) => ({
    likes: s.likes,
    loading: s.loading.likes,
    error: s.errors.likes,
    count: s.likesCount
  }), ({ likes, loading, error, count }) => {
    const skeleton = document.getElementById("likes-skeleton");
    const container = document.getElementById("user-likes");
    const noLikes = document.getElementById("no-likes");
    if (container) {
      container.setAttribute("role", "list");
      container.setAttribute("aria-busy", loading ? "true" : "false");
    }
    if (loading) {
      if (skeleton) {
        skeleton.style.display = "grid";
        skeleton.style.opacity = "1";
      }
      if (container) {
        container.style.opacity = "0";
      }
      return;
    }
    if (skeleton) {
      skeleton.style.opacity = "0";
      setTimeout(() => skeleton.style.display = "none", 350);
    }
    if (error) {
      notifyError(error, { prefix: "Лайки" });
      if (noLikes)
        noLikes.style.display = "block";
      return;
    }
    if (!likes || likes.length === 0) {
      container.style.display = "none";
      if (noLikes)
        noLikes.style.display = "block";
      return;
    }
    if (noLikes)
      noLikes.style.display = "none";
    container.style.display = "grid";
    renderLikes({
      container,
      data: likes,
      onRemove: handleRemove(modal, searchModule)
    });
    container.style.opacity = "1";
    document.getElementById("likes-count").textContent = count;
    if (!searchModule) {
      searchModule = searchAndSort_default({});
    } else {
      searchModule.refresh();
    }
  });
  registerCleanup(unsubLikes);
  try {
    await loadProfile();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
      return;
    }
  }
  try {
    await loadLikes({});
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
    }
  }
}
document.addEventListener("DOMContentLoaded", init);

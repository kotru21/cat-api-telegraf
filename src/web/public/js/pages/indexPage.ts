import initHeroAvatars from "../components/heroAvatars";
import store, { subscribe } from "../core/state/store";
import { loadLeaderboard } from "../core/services/LeaderboardService";
import { renderLeaderboard } from "../core/ui/leaderboard";
import { mountTableSkeleton, renderFallbackRow } from "../core/ui/skeleton";
import { buildWsUrl } from "../api";
import { formatUptime } from "../utils";
import { notifyError } from "../core/errors/notify";
import { registerCleanup } from "../core/state/lifecycle";

// Single WebSocket for uptime + message count + potential future signals
function initStatsWebSocket({
  messageSelector = "#messageOutput",
  timeSelector = "#timeOutput",
  messageLoader = "#messageLoader",
  timeLoader = "#timeLoader",
} = {}) {
  const msgEl = document.querySelector(messageSelector);
  const timeEl = document.querySelector(timeSelector);
  const msgLoader = document.querySelector(messageLoader);
  const timeLoaderEl = document.querySelector(timeLoader);
  if (!msgEl || !timeEl) return;

  let dataReceived = false;
  const ws = new WebSocket(buildWsUrl());

  function showContent() {
    [msgLoader, timeLoaderEl].forEach((l) => {
      if (l) l.classList.add("hidden");
    });
    msgEl.classList.remove("hidden");
    timeEl.classList.remove("hidden");
  }

  ws.onopen = () => {
    // console.log('WebSocket connected');
  };

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

          if (daysEl) daysEl.textContent = uptimeData.days.value;
          if (hoursEl) hoursEl.textContent = uptimeData.hours.value;
          if (minutesEl) minutesEl.textContent = uptimeData.minutes.value;
          if (secondsEl) secondsEl.textContent = uptimeData.seconds.value;
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
    if (dataReceived) showContent();
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
      count: 5,
    });
  }
  if (table) table.setAttribute("aria-busy", "true");

  const unsub = subscribe(
    (s) => ({
      data: s.leaderboard,
      loading: s.loading.leaderboard,
      error: s.errors.leaderboard,
    }),
    ({ data, loading, error }) => {
      if (!tableBody) return;
      if (loading) return; // skeleton уже показан
      if (error) {
        if (clearSkeleton) clearSkeleton();
        renderFallbackRow(tableBody, {
          text: "Ошибка загрузки. Попробуйте позже.",
        });
        notifyError(error, { prefix: "Лидерборд" });
        if (table) table.setAttribute("aria-busy", "false");
        return;
      }
      if (!data || data.length === 0) {
        if (clearSkeleton) clearSkeleton();
        renderFallbackRow(tableBody, { text: "Нет данных для отображения." });
        if (table) table.setAttribute("aria-busy", "false");
        return;
      }
      if (clearSkeleton) clearSkeleton();
      renderLeaderboard({ tableBody, data });
      if (table) table.setAttribute("aria-busy", "false");
    }
  );
  registerCleanup(unsub);

  loadLeaderboard().catch(() => {});
}

async function init() {
  await initHeroAvatars({});
  initLeaderboardController();
  initStatsWebSocket({});
}

document.addEventListener("DOMContentLoaded", init);

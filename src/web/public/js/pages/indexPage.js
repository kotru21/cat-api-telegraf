import initLeaderboard from "/js/components/leaderboard.js";
import initHeroAvatars from "/js/components/heroAvatars.js";
import { buildWsUrl } from "/js/api.js";
import { formatUptime } from "/js/utils.js";

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
      if (l) l.style.display = "none";
    });
    msgEl.style.display = "block";
    timeEl.style.display = "block";
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

async function init() {
  await Promise.all([initHeroAvatars({}), initLeaderboard({})]);
  initStatsWebSocket({});
}

document.addEventListener("DOMContentLoaded", init);

// Theme management script
// Strategy: Tailwind dark mode with class 'dark' on <html>. Persist in localStorage under 'theme'.
(function () {
  const STORAGE_KEY = "theme";
  const root = document.documentElement; // <html>

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // fallback to media query
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    return mq.matches ? "dark" : "light";
  }

  function applyTheme(theme, { skipIconUpdate = false } = {}) {
    const isDark = theme === "dark";
    root.classList.toggle("dark", isDark);
    if (!skipIconUpdate) updateToggleIcons(theme);
  }

  function toggleTheme() {
    const current = root.classList.contains("dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  function updateToggleIcons(theme) {
    const isDark = theme === "dark";
    const toggles = document.querySelectorAll(
      "#themeToggle, #themeToggleMobile"
    );
    toggles.forEach((btn) => {
      const sun = btn.querySelector('[data-icon="sun"]');
      const moon = btn.querySelector('[data-icon="moon"]');
      if (!sun || !moon) return;
      if (isDark) {
        sun.classList.remove("hidden");
        moon.classList.add("hidden");
      } else {
        sun.classList.add("hidden");
        moon.classList.remove("hidden");
      }
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute(
        "aria-label",
        isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"
      );
    });
  }

  // Initialize early after DOM ready (script loaded defer at end typical)
  document.addEventListener("DOMContentLoaded", () => {
    // Первичное применение темы без мерцаний иконок (они обновятся один раз)
    applyTheme(getPreferredTheme(), { skipIconUpdate: true });
    updateToggleIcons(root.classList.contains("dark") ? "dark" : "light");
    const toggleDesktop = document.getElementById("themeToggle");
    const toggleMobile = document.getElementById("themeToggleMobile");
    [toggleDesktop, toggleMobile].forEach(
      (el) => el && el.addEventListener("click", toggleTheme)
    );

    // Listen for system changes and adapt if user hasn't forced a preference
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", (e) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "dark" && stored !== "light") {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  });
})();

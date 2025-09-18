function initThemeToggle() {
  const currentTheme = localStorage.getItem("theme") || "dark";

  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  window.toggleTheme = function () {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");

    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    updateThemeIcon();
  };

  function updateThemeIcon() {
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      const icon = themeBtn.querySelector("i");
      if (icon) {
        const isDark = document.documentElement.classList.contains("dark");
        icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
      }
    }
  }

  updateThemeIcon();

  window.addEventListener("storage", function (e) {
    if (e.key === "theme") {
      const newTheme = e.newValue;
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      updateThemeIcon();
    }
  });
}

document.addEventListener("DOMContentLoaded", initThemeToggle);

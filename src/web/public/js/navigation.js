// Проверяем, был ли уже инициализирован скрипт навигации
if (window.navigationInitialized) {
  console.log(
    "Навигация уже инициализирована, пропускаем повторную инициализацию"
  );
} else {
  window.navigationInitialized = true;

  // Анимация хедера при скролле
  window.addEventListener("scroll", function () {
    const nav = document.querySelector("nav");
    if (nav) {
      if (window.scrollY > 10) {
        nav.classList.add("shadow-md", "bg-gray-900");
        nav.classList.remove("bg-none");
      } else {
        nav.classList.remove("shadow-md", "bg-gray-900");
        nav.classList.add("bg-none");
      }
    }
  });

  // Мобильное меню
  document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.getElementById("menuButton");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!menuButton || !mobileMenu) {
      console.error("Элементы меню не найдены");
      return;
    }

    let menuOpen = false;

    menuButton.addEventListener("click", function (event) {
      event.stopPropagation();

      menuOpen = !menuOpen;

      if (menuOpen) {
        mobileMenu.classList.remove("hidden");
        menuButton.innerHTML = '<i class="fas fa-times text-xl"></i>';
      } else {
        mobileMenu.classList.add("hidden");
        menuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
      }
    });

    // Закрытие меню при клике по пунктам меню
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", function () {
        mobileMenu.classList.add("hidden");
        menuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
        menuOpen = false;
      });
    });

    // Закрытие меню при клике вне меню
    document.addEventListener("click", function (event) {
      if (
        !menuButton.contains(event.target) &&
        !mobileMenu.contains(event.target) &&
        menuOpen
      ) {
        mobileMenu.classList.add("hidden");
        menuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
        menuOpen = false;
      }
    });

    if (!window.authChecked) {
      window.authChecked = true;
      checkAuth();
    }
  });
}

// Проверка авторизации
async function checkAuth() {
  try {
    const profileResponse = await fetch("/api/profile");
    const authLinks = document.querySelectorAll(".user-auth-link");

    if (profileResponse.ok) {
      // Пользователь авторизован
      authLinks.forEach((link) => {
        link.style.display = "inline-flex";
      });

      // Устанавливаем имя пользователя, если он авторизован
      const profileData = await profileResponse.json();
      const profileLinks = document.querySelectorAll('a[href="/profile"]');
      profileLinks.forEach((link) => {
        const icon = link.querySelector("i");
        link.innerHTML = "";
        link.appendChild(icon);
        link.innerHTML += ` ${profileData.first_name || "Профиль"}`;
      });
    } else {
      // Пользователь не авторизован
      authLinks.forEach((link) => {
        link.style.display = "none";
      });

      // Добавляем ссылку "Войти"
      const desktopMenu = document.querySelector(
        ".hidden.md\\:flex.items-center.space-x-4"
      );
      const mobileMenu = document.querySelector("#mobileMenu .px-2.pt-2.pb-3");

      if (desktopMenu && !desktopMenu.querySelector('a[href="/login"]')) {
        const loginLink = document.createElement("a");
        loginLink.href = "/login";
        loginLink.className =
          "text-gray-300 hover:text-white transition-colors";
        loginLink.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i> Войти';

        const botButton = desktopMenu.querySelector('a[href^="https://t.me/"]');
        desktopMenu.insertBefore(loginLink, botButton);
      }

      if (mobileMenu && !mobileMenu.querySelector('a[href="/login"]')) {
        const mobileLoginLink = document.createElement("a");
        mobileLoginLink.href = "/login";
        mobileLoginLink.className =
          "block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700";
        mobileLoginLink.innerHTML =
          '<i class="fas fa-sign-in-alt mr-1"></i> Войти';

        const mobileBotButton = mobileMenu.querySelector(
          'a[href^="https://t.me/"]'
        );
        mobileMenu.insertBefore(mobileLoginLink, mobileBotButton);
      }
    }
  } catch (error) {
    console.error("Ошибка проверки авторизации:", error);
  }
}

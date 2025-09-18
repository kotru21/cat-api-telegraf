import {
  getProfile,
  getUserLikesCount,
  getUserLikes,
  deleteLike,
} from "/js/api.js";
import { sanitize } from "/js/utils.js";
import showToast from "/js/toast.js";
import initSearchAndSort from "/js/components/searchAndSort.js";
import initConfirmationModal from "/js/components/confirmationModal.js";
import renderLikesGrid from "/js/components/likesGrid.js";

async function loadProfile() {
  let profileData;
  try {
    profileData = await getProfile();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
      return null;
    }
    throw err;
  }
  const avatar = document.getElementById("user-avatar");
  avatar.addEventListener("error", function () {
    this.src = this.getAttribute("data-fallback");
  });

  document.getElementById("user-name").textContent = sanitize(
    (profileData.first_name || "") +
      (profileData.last_name ? " " + profileData.last_name : "")
  );
  document.getElementById("user-username").textContent =
    "@" + sanitize(profileData.username);
  if (profileData.photo_url && profileData.photo_url.trim() !== "") {
    avatar.src = profileData.photo_url;
  } else {
    avatar.src = avatar.getAttribute("data-fallback");
  }
  const lastActive = document.getElementById("last-active");
  if (lastActive) lastActive.textContent = "Сегодня";
  return profileData;
}

async function loadCounts() {
  try {
    const { count } = await getUserLikesCount();
    document.getElementById("likes-count").textContent = count;
  } catch (_) {}
}

async function loadLikes(modal, searchModule) {
  const likesData = await getUserLikes();
  const { cards } = await renderLikesGrid({ data: likesData });
  attachRemoveHandlers(cards, modal, searchModule);
}

function attachRemoveHandlers(cards, modal, searchModule) {
  cards.forEach((card) => {
    const btn = card.querySelector(".remove-like-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const catId = btn.dataset.catId;
      const breedName = btn.dataset.breedName;
      modal.show(breedName, async () => {
        try {
          try {
            await deleteLike(catId);
          } catch (err) {
            if (err.status) {
              showToast(err.message || "Ошибка удаления", "error");
              return;
            }
            throw err;
          }
          card.style.opacity = "0";
          card.style.transform = "scale(0.9)";
          card.style.transition = "all 0.3s ease";
          setTimeout(() => {
            card.remove();
            const likesCountElement = document.getElementById("likes-count");
            if (likesCountElement) {
              const current = parseInt(likesCountElement.textContent) || 0;
              likesCountElement.textContent = Math.max(0, current - 1);
            }
            const container = document.getElementById("user-likes");
            if (container && container.children.length === 0) {
              container.style.display = "none";
              const noLikes = document.getElementById("no-likes");
              if (noLikes) noLikes.style.display = "block";
            } else if (searchModule && searchModule.refresh) {
              searchModule.refresh();
            }
            showToast("Лайк успешно удален", "success");
          }, 300);
        } catch (e) {
          console.error("Ошибка при удалении лайка:", e);
          showToast("Произошла ошибка при удалении лайка", "error");
        }
      });
    });
  });
}

function initScrollHeader() {
  window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");
    if (!nav) return;
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
  const profile = await loadProfile();
  if (!profile) return; // redirected
  await loadCounts();
  const searchModule = initSearchAndSort({});
  const modal = initConfirmationModal({});
  await loadLikes(modal, searchModule);
}

document.addEventListener("DOMContentLoaded", init);

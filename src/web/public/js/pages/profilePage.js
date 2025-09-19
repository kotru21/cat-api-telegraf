import { sanitize } from "/js/utils.js";
import initSearchAndSort from "/js/components/searchAndSort.js";
import initConfirmationModal from "/js/components/confirmationModal.js";
import store, { subscribe } from "/js/core/state/store.js";
import { loadLikes, removeLike } from "/js/core/services/LikesService.js";
import { loadProfile } from "/js/core/services/ProfileService.js";
import { renderLikes } from "/js/core/ui/likes.js";
import { notifyError, notifySuccess } from "/js/core/errors/notify.js";
import { registerCleanup } from "/js/core/state/lifecycle.js";

function applyProfile(profileData) {
  if (!profileData) return;
  const avatar = document.getElementById("user-avatar");
  if (!avatar.dataset.bound) {
    avatar.addEventListener("error", function () {
      this.src = this.getAttribute("data-fallback");
    });
    avatar.dataset.bound = "1";
  }
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
          if (searchModule && searchModule.refresh) searchModule.refresh();
          if (store.getState().likes.length === 0) {
            document.getElementById("user-likes").style.display = "none";
            const noLikes = document.getElementById("no-likes");
            if (noLikes) noLikes.style.display = "block";
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
  const modal = initConfirmationModal({});
  let searchModule = null;

  // Subscriptions
  const unsubProfile = subscribe(
    (s) => ({
      profile: s.profile,
      pLoading: s.loading.profile,
      error: s.errors.profile,
    }),
    ({ profile, pLoading, error }) => {
      if (profile) applyProfile(profile);
      if (error) notifyError(error, { prefix: "Профиль" });
    }
  );
  registerCleanup(unsubProfile);

  const unsubLikes = subscribe(
    (s) => ({
      likes: s.likes,
      loading: s.loading.likes,
      error: s.errors.likes,
      count: s.likesCount,
    }),
    ({ likes, loading, error, count }) => {
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
        setTimeout(() => (skeleton.style.display = "none"), 350);
      }
      if (error) {
        notifyError(error, { prefix: "Лайки" });
        if (noLikes) noLikes.style.display = "block";
        return;
      }
      if (!likes || likes.length === 0) {
        container.style.display = "none";
        if (noLikes) noLikes.style.display = "block";
        return;
      }
      if (noLikes) noLikes.style.display = "none";
      container.style.display = "grid";
      renderLikes({
        container,
        data: likes,
        onRemove: handleRemove(modal, searchModule),
      });
      container.style.opacity = "1";
      document.getElementById("likes-count").textContent = count;
      if (!searchModule) {
        searchModule = initSearchAndSort({});
      } else {
        searchModule.refresh();
      }
    }
  );
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

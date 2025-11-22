import { sanitize } from "../utils";
import initSearchAndSort from "../components/searchAndSort";
import initConfirmationModal from "../components/confirmationModal";
import store, { subscribe } from "../core/state/store";
import { loadLikes, removeLike } from "../core/services/LikesService";
import { loadProfile } from "../core/services/ProfileService";
import { renderLikes } from "../core/ui/likes";
import { notifyError, notifySuccess } from "../core/errors/notify";
import { registerCleanup } from "../core/state/lifecycle";

interface ProfileData {
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

function applyProfile(profileData: ProfileData) {
  if (!profileData) return;
  const avatar = document.getElementById("user-avatar") as HTMLImageElement;
  if (!avatar.dataset.bound) {
    avatar.addEventListener("error", function (this: HTMLImageElement) {
      this.src = this.getAttribute("data-fallback") || "";
    });
    avatar.dataset.bound = "1";
  }
  document.getElementById("user-name")!.textContent = sanitize(
    (profileData.first_name || "") +
      (profileData.last_name ? " " + profileData.last_name : "")
  );
  document.getElementById("user-username")!.textContent =
    "@" + sanitize(profileData.username || "");
  if (profileData.photo_url && profileData.photo_url.trim() !== "") {
    avatar.src = profileData.photo_url;
  } else {
    avatar.src = avatar.getAttribute("data-fallback") || "";
  }
  const lastActive = document.getElementById("last-active");
  if (lastActive) lastActive.textContent = "Сегодня";
}

function handleRemove(modal: any, searchModule: any) {
  return ({
    catId,
    breedName,
    card,
  }: {
    catId: string;
    breedName: string;
    card: HTMLElement;
  }) => {
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
            document.getElementById("user-likes")!.style.display = "none";
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
  let searchModule: any = null;

  // Subscriptions
  const unsubProfile = subscribe(
    (s: any) => ({
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
    (s: any) => ({
      likes: s.likes,
      loading: s.loading.likes,
      error: s.errors.likes,
      count: s.likesCount,
    }),
    ({ likes, loading, error, count }) => {
      const skeleton = document.getElementById("likes-skeleton");
      const container = document.getElementById("user-likes");
      const noLikes = document.getElementById("no-likes");
      if (!container) return;

      container.setAttribute("role", "list");
      container.setAttribute("aria-busy", loading ? "true" : "false");

      if (loading) {
        if (skeleton) {
          skeleton.style.display = "grid";
          skeleton.style.opacity = "1";
        }
        container.style.opacity = "0";
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
      const likesCountEl = document.getElementById("likes-count");
      if (likesCountEl) likesCountEl.textContent = String(count);
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
  } catch (err: any) {
    if (err.status === 401) {
      window.location.href = "/login";
      return;
    }
  }
  try {
    await loadLikes({});
  } catch (err: any) {
    if (err.status === 401) {
      window.location.href = "/login";
    }
  }
}

document.addEventListener("DOMContentLoaded", init);

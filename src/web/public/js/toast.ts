import { sanitize } from "./utils";

// Toast notification system
// Usage: showToast('Message', 'success' | 'error' | 'info')
// Automatically dismisses after timeoutMs (default 3500)
export function showToast(message, type = "info", { timeoutMs = 3500 } = {}) {
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
  toast.className =
    "px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 fade-in";
  toast.style.backdropFilter = "blur(6px)";
  toast.style.border = "1px solid rgba(255,255,255,0.1)";
  toast.style.transition = "all .3s ease";

  const palette = {
    success: {
      bg: "bg-green-800",
      icon: "check-circle",
      color: "text-green-400",
    },
    error: {
      bg: "bg-red-800",
      icon: "exclamation-circle",
      color: "text-red-400",
    },
    info: { bg: "bg-gray-800", icon: "info-circle", color: "text-blue-400" },
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

export default showToast;

import { createEl } from "/js/utils.js";

/**
 * Инициализация пагинации.
 * @param {Object} opts
 * @param {number} opts.totalItems
 * @param {number} [opts.pageSize=9]
 * @param {function(page:number, slice:Array):void} opts.onPageChange
 * @param {HTMLElement|string} opts.mount
 */
export default function initPagination({
  totalItems,
  pageSize = 9,
  onPageChange,
  mount,
}) {
  const mountEl =
    typeof mount === "string" ? document.querySelector(mount) : mount;
  if (!mountEl) return null;
  if (totalItems <= pageSize) {
    mountEl.innerHTML = "";
    return null; // пагинация не нужна
  }
  let currentPage = 1;
  const totalPages = Math.ceil(totalItems / pageSize);

  function buildButton(label, page, disabled = false, active = false) {
    const btn = createEl("button", {
      classes: [
        "px-3",
        "py-2",
        "mx-1",
        "rounded",
        "text-sm",
        "transition-colors",
        "border",
        "border-gray-600",
      ],
    });
    btn.textContent = label;
    if (active) {
      btn.classList.add("bg-indigo-600", "text-white", "border-indigo-500");
    } else {
      btn.classList.add("bg-gray-800", "text-gray-300", "hover:bg-gray-700");
    }
    if (disabled) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      btn.addEventListener("click", () => setPage(page));
    }
    return btn;
  }

  function renderControls() {
    mountEl.innerHTML = "";
    const container = createEl("div", {
      classes: ["flex", "items-center", "flex-wrap", "justify-center"],
    });
    container.appendChild(buildButton("«", currentPage - 1, currentPage === 1));

    // Простая стратегия: показывать до 5 страниц вокруг текущей
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    if (start > 1) {
      container.appendChild(buildButton("1", 1, false, currentPage === 1));
      if (start > 2) {
        const dots = createEl("span", {
          classes: ["mx-1", "text-gray-400", "select-none"],
          text: "…",
        });
        container.appendChild(dots);
      }
    }

    for (let p = start; p <= end; p++) {
      container.appendChild(
        buildButton(String(p), p, false, p === currentPage)
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        const dots2 = createEl("span", {
          classes: ["mx-1", "text-gray-400", "select-none"],
          text: "…",
        });
        container.appendChild(dots2);
      }
      container.appendChild(
        buildButton(
          String(totalPages),
          totalPages,
          false,
          currentPage === totalPages
        )
      );
    }

    container.appendChild(
      buildButton("»", currentPage + 1, currentPage === totalPages)
    );
    mountEl.appendChild(container);
  }

  function sliceData(data) {
    const startIdx = (currentPage - 1) * pageSize;
    return data.slice(startIdx, startIdx + pageSize);
  }

  function setPage(p) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    currentPage = p;
    renderControls();
    if (typeof onPageChange === "function") onPageChange(currentPage);
  }

  // init
  renderControls();
  if (typeof onPageChange === "function") onPageChange(currentPage);

  return {
    setPage,
    getPage: () => currentPage,
    getTotalPages: () => totalPages,
    pageSize,
    sliceData,
  };
}

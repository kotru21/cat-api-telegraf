import { debounce } from "../utils";

// Initializes search & sort functionality on likes grid
export function initSearchAndSort({
  searchInputSelector = "#search-input",
  sortSelectSelector = "#sort-select",
  containerSelector = "#user-likes",
  resultsBlockSelector = "#search-results",
  resultsCountSelector = "#results-count",
  emptyClass = "empty-state",
} = {}) {
  const searchInput = document.querySelector(searchInputSelector);
  const sortSelect = document.querySelector(sortSelectSelector);
  const container = document.querySelector(containerSelector);
  const resultsBlock = document.querySelector(resultsBlockSelector);
  const resultsCount = document.querySelector(resultsCountSelector);
  if (!searchInput || !sortSelect || !container) return {};

  let allCats = [];

  function snapshot() {
    const cards = Array.from(container.children).filter((el) =>
      el.classList.contains("cat-card")
    );
    allCats = cards.map((card) => ({
      element: card,
      breedName: card.querySelector("h3")?.textContent.toLowerCase() || "",
      likesCount:
        parseInt(
          card.querySelector(".likes-badge")?.textContent.split(" ")[0]
        ) || 0,
    }));
    console.log(`Snapshot: found ${allCats.length} cats`); // для отладки
  }

  function filterCats(items, term) {
    if (!term) return items;
    return items.filter((c) => c.breedName.includes(term));
  }
  function sortCats(items, sortBy) {
    if (sortBy === "name")
      return [...items].sort((a, b) => a.breedName.localeCompare(b.breedName));
    if (sortBy === "likes")
      return [...items].sort((a, b) => b.likesCount - a.likesCount);
    return items; // latest = исходный порядок
  }

  function render(list, term) {
    container.innerHTML = "";
    list.forEach((c) => container.appendChild(c.element));
    if (
      (term || sortSelect.value !== "latest") &&
      resultsBlock &&
      resultsCount
    ) {
      resultsBlock.style.display = "block";
      resultsCount.textContent = list.length;
    } else if (resultsBlock) {
      resultsBlock.style.display = "none";
    }
    if (list.length === 0 && allCats.length > 0) {
      const noResults = document.createElement("div");
      noResults.className = `${emptyClass} text-center py-10 rounded-2xl col-span-full`;
      noResults.innerHTML = `
        <i class="fas fa-search text-3xl text-gray-600 mb-4"></i>
        <h3 class="text-xl font-semibold mb-2">Ничего не найдено</h3>
        <p class="text-gray-400">Попробуйте изменить параметры поиска</p>`;
      container.appendChild(noResults);
    }
  }

  function apply() {
    const term = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;
    let list = filterCats(allCats, term);
    list = sortCats(list, sortBy);
    render(list, term);
  }

  const debounced = debounce(apply, 200);
  searchInput.addEventListener("input", debounced);
  sortSelect.addEventListener("change", apply);

  function refresh() {
    snapshot();
    apply();
  }

  snapshot();
  return { refresh };
}

export default initSearchAndSort;

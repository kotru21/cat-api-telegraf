import { getLeaderboard } from "/js/api.js";
import { preloadImages, PLACEHOLDER } from "/js/utils.js";

// Initialize leaderboard rendering
// containerSelector: table body parent (#leaderboard-table tbody)
export async function initLeaderboard({
  tableBodySelector = "#leaderboard-table tbody",
  skeletonTemplateSelector = "#skeleton-row",
  skeletonCount = 5,
} = {}) {
  const tableBody = document.querySelector(tableBodySelector);
  const skeletonTemplate = document.querySelector(skeletonTemplateSelector);
  if (!tableBody || !skeletonTemplate) return;

  function showSkeletons(count = skeletonCount) {
    tableBody.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const clone = document.importNode(skeletonTemplate.content, true);
      tableBody.appendChild(clone);
    }
  }

  showSkeletons();

  async function load() {
    try {
      const leaderboard = await getLeaderboard();
      if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="4" class="text-center py-8 text-gray-400">Нет данных для отображения</td></tr>';
        return;
      }

      let preloadResults = [];
      let hasTimeout = false;
      try {
        const results = await preloadImages(
          leaderboard.map((r) => r.image_url)
        );
        if (results.length === 0) {
          hasTimeout = true;
        } else {
          preloadResults = results.map((r) => ({
            ...r,
            row: leaderboard[r.index],
          }));
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error("Ошибка предзагрузки изображений:", err);
      }

      tableBody.innerHTML = "";

      if (hasTimeout && preloadResults.length < leaderboard.length) {
        leaderboard.forEach((row, index) => {
          createRow(row, index, false, null);
        });
      } else {
        preloadResults.sort((a, b) => a.index - b.index);
        preloadResults.forEach((result) => {
          createRow(result.row, result.index, result.success, result.img);
        });
      }
    } catch (err) {
      console.error("Ошибка загрузки данных лидерборда:", err);
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center py-8 text-gray-400">Ошибка загрузки. Пожалуйста, попробуйте позже.</td></tr>';
    }
  }

  function createRow(row, index, imageLoaded = false, preloadedImg = null) {
    const tr = document.createElement("tr");

    const rankCell = document.createElement("td");
    rankCell.className = "text-left";
    rankCell.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center font-bold ${
        index < 3 ? "bg-indigo-600" : ""
      }">
        ${index + 1}
      </div>
    `;

    const imgCell = document.createElement("td");
    imgCell.className = "text-center";

    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container mx-auto";
    imgContainer.style.width = "96px";
    imgContainer.style.height = "96px";

    const skeleton = document.createElement("div");
    skeleton.className = "skeleton bg-gray-700 animate-pulse rounded-lg";
    skeleton.style.width = "100%";
    skeleton.style.height = "100%";

    const img = document.createElement("img");
    img.className = "w-24 h-24 object-cover rounded-lg mx-auto img-preload";
    img.alt = row.breed_name || "Cat breed";
    if (imageLoaded && preloadedImg) img.src = preloadedImg.src;
    else img.src = row.image_url || "";
    img.setAttribute("loading", "lazy");

    img.onload = () => {
      requestAnimationFrame(() => {
        img.classList.add("img-loaded");
        skeleton.classList.add("skeleton-hidden");
      });
    };
    img.onerror = () => {
      img.src = PLACEHOLDER.SMALL;
      requestAnimationFrame(() => {
        img.classList.add("img-loaded");
        skeleton.classList.add("skeleton-hidden");
      });
    };

    if (imageLoaded && preloadedImg) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          img.classList.add("img-loaded");
          skeleton.classList.add("skeleton-hidden");
        }, 50);
      });
    }

    imgContainer.appendChild(skeleton);
    imgContainer.appendChild(img);
    imgCell.appendChild(imgContainer);

    const nameCell = document.createElement("td");
    nameCell.className = "text-left";
    const safeName = (row.breed_name || "Unknown Breed").replace(/</g, "&lt;");
    nameCell.innerHTML = `
      <a href="${"/catDetails?id=" + encodeURIComponent(row.id)}" 
         class="text-indigo-400 hover:text-indigo-300 transition-colors">
        ${safeName}
      </a>
    `;

    const likesCell = document.createElement("td");
    likesCell.innerHTML = `
      <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300">
        <i class="fas fa-heart text-red-500 mr-1.5"></i> ${row.count || 0}
      </div>
    `;

    tr.appendChild(rankCell);
    tr.appendChild(imgCell);
    tr.appendChild(nameCell);
    tr.appendChild(likesCell);

    tableBody.appendChild(tr);
  }

  await load();

  return { reload: load };
}

export default initLeaderboard;

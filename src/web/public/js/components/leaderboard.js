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
    skeleton.className = [
      "skeleton",
      "rounded-lg w-full h-full opacity-100 transition-opacity duration-300",
      "bg-gray-800",
      "[background-size:1400px_100%]",
      "bg-[linear-gradient(110deg,#374151_8%,#4b5563_18%,#374151_33%)]",
      "animate-shimmer",
    ].join(" ");

    const img = document.createElement("img");
    img.className =
      "w-24 h-24 object-cover rounded-lg mx-auto img-preload opacity-0 transition-opacity duration-300";
    img.alt = row.breed_name || "Cat breed";
    if (imageLoaded && preloadedImg) img.src = preloadedImg.src;
    else img.src = row.image_url || "";
    img.setAttribute("loading", "lazy");

    const finalize = () => {
      img.classList.add("img-loaded", "opacity-100");
      skeleton.classList.add("skeleton-hidden", "opacity-0");
    };
    skeleton.addEventListener(
      "transitionend",
      (e) => {
        if (
          e.propertyName === "opacity" &&
          skeleton.classList.contains("skeleton-hidden")
        ) {
          skeleton.remove();
        }
      },
      { once: true }
    );

    img.onload = () => requestAnimationFrame(finalize);
    img.onerror = () => {
      img.src = PLACEHOLDER.SMALL;
      requestAnimationFrame(finalize);
    };

    if (imageLoaded && preloadedImg) {
      requestAnimationFrame(finalize);
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

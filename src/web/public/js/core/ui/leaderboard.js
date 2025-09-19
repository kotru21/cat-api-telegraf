import { PLACEHOLDER } from "/js/utils.js";

export function createLeaderboardRow(row, index) {
  const tr = document.createElement("tr");
  tr.className = "relative overflow-hidden";

  const rank = document.createElement("td");
  rank.className =
    "px-4 py-4 border-b border-gray-800 bg-gray-800/40 text-left align-middle";
  rank.innerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
    index < 3 ? "bg-indigo-600 text-white" : "bg-indigo-900 text-indigo-200"
  }">${index + 1}</div>`;

  const imgCell = document.createElement("td");
  imgCell.className =
    "px-4 py-4 border-b border-gray-800 bg-gray-800/30 text-center align-middle";
  const imgWrap = document.createElement("div");
  imgWrap.className =
    "mx-auto w-24 h-24 rounded-lg overflow-hidden bg-gray-800/40";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = row.breedName;
  img.className =
    "w-24 h-24 object-cover rounded-lg opacity-0 transition-opacity duration-300";
  img.src = row.imageUrl || PLACEHOLDER.SMALL;
  img.onload = () =>
    requestAnimationFrame(() => img.classList.add("opacity-100"));
  img.onerror = () => {
    if (img.src !== PLACEHOLDER.SMALL) img.src = PLACEHOLDER.SMALL;
    img.classList.add("opacity-100");
  };
  imgWrap.appendChild(img);
  imgCell.appendChild(imgWrap);

  const name = document.createElement("td");
  name.className =
    "px-4 py-4 border-b border-gray-800 bg-gray-800/40 text-left align-middle";
  const safeName = row.breedName.replace(/</g, "&lt;");
  if (row.catId) {
    name.innerHTML = `<a href="/catDetails?id=${encodeURIComponent(
      row.catId
    )}" class="text-indigo-400 hover:text-indigo-300 transition-colors">${safeName}</a>`;
  } else {
    name.innerHTML = `<span class="text-gray-400" title="ID недоступен">${safeName}</span>`;
  }

  const likes = document.createElement("td");
  likes.className =
    "px-4 py-4 border-b border-gray-800 bg-gray-800/30 text-center align-middle";
  likes.innerHTML = `<div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300"><i class="fas fa-heart text-red-500 mr-1.5"></i> ${row.likes}</div>`;

  tr.appendChild(rank);
  tr.appendChild(imgCell);
  tr.appendChild(name);
  tr.appendChild(likes);
  return tr;
}

export function renderLeaderboard({ tableBody, data }) {
  if (!tableBody) return;
  const frag = document.createDocumentFragment();
  data.forEach((row, i) => frag.appendChild(createLeaderboardRow(row, i)));
  tableBody.innerHTML = "";
  tableBody.appendChild(frag);
}

export default { renderLeaderboard, createLeaderboardRow };

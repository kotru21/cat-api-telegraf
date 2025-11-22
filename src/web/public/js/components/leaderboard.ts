import { getLeaderboard } from '../api';
import { preloadImages, PLACEHOLDER } from '../utils';
import { LeaderboardEntry } from '../types';

// Initialize leaderboard rendering
// containerSelector: table body parent (#leaderboard-table tbody)
export async function initLeaderboard({
  tableBodySelector = '#leaderboard-table tbody',
  skeletonTemplateSelector = '#skeleton-row',
  skeletonCount = 5,
} = {}) {
  const tableBody = document.querySelector(tableBodySelector) as HTMLElement;
  const skeletonTemplate = document.querySelector(skeletonTemplateSelector) as HTMLTemplateElement;
  if (!tableBody || !skeletonTemplate) return;

  function showSkeletons(count = skeletonCount) {
    tableBody.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const clone = document.importNode(skeletonTemplate.content, true);
      tableBody.appendChild(clone);
    }
  }

  showSkeletons();

  async function load() {
    try {
      const leaderboard: LeaderboardEntry[] = await getLeaderboard();
      if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="4" class="text-center py-8 text-gray-400">Нет данных для отображения</td></tr>';
        return;
      }

      let preloadResults: any[] = [];
      let hasTimeout = false;
      try {
        const results = await preloadImages(leaderboard.map((r) => r.url));
        if (results.length === 0) {
          hasTimeout = true;
        } else {
          preloadResults = results.map((r: any) => ({
            ...r,
            row: leaderboard[r.index],
          }));
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error('Ошибка предзагрузки изображений:', err);
      }

      tableBody.innerHTML = '';

      if (hasTimeout && preloadResults.length < leaderboard.length) {
        leaderboard.forEach((row, index) => {
          createRow(row, index, false, null);
        });
      } else {
        preloadResults.sort((a: any, b: any) => a.index - b.index);
        preloadResults.forEach((result: any) => {
          createRow(result.row, result.index, result.success, result.img);
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки данных лидерборда:', err);
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center py-8 text-gray-400">Ошибка загрузки. Пожалуйста, попробуйте позже.</td></tr>';
    }
  }

  function createRow(
    row: LeaderboardEntry,
    index: number,
    imageLoaded = false,
    preloadedImg: HTMLImageElement | null = null,
  ) {
    const tr = document.createElement('tr');
    tr.className = 'relative overflow-hidden';

    const rankCell = document.createElement('td');
    rankCell.className = 'px-4 py-4 border-b border-gray-800 bg-gray-800/40 text-left align-middle';
    rankCell.innerHTML = `
      <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
        index < 3 ? 'bg-indigo-600 text-white' : 'bg-indigo-900 text-indigo-200'
      }">${index + 1}</div>
    `;

    const imgCell = document.createElement('td');
    imgCell.className =
      'px-4 py-4 border-b border-gray-800 bg-gray-800/30 text-center align-middle';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'img-container mx-auto';
    imgContainer.style.width = '96px';
    imgContainer.style.height = '96px';

    const skeleton = document.createElement('div');
    skeleton.className =
      'skeleton bg-gray-700 animate-pulse rounded-lg w-full h-full opacity-100 transition-opacity duration-300';

    const img = document.createElement('img');
    img.className =
      'w-24 h-24 object-cover rounded-lg mx-auto img-preload opacity-0 transition-opacity duration-300';
    img.alt = row.breed_name || 'Cat breed';
    if (imageLoaded && preloadedImg) img.src = preloadedImg.src;
    else img.src = row.url || '';
    img.setAttribute('loading', 'lazy');

    img.onload = () => {
      requestAnimationFrame(() => {
        img.classList.add('img-loaded', 'opacity-100');
        skeleton.classList.add('skeleton-hidden', 'opacity-0');
        setTimeout(() => skeleton.remove(), 400);
      });
    };
    img.onerror = () => {
      img.src = PLACEHOLDER.SMALL;
      requestAnimationFrame(() => {
        img.classList.add('img-loaded', 'opacity-100');
        skeleton.classList.add('skeleton-hidden', 'opacity-0');
        setTimeout(() => skeleton.remove(), 400);
      });
    };

    if (imageLoaded && preloadedImg) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          img.classList.add('img-loaded', 'opacity-100');
          skeleton.classList.add('skeleton-hidden', 'opacity-0');
          setTimeout(() => skeleton.remove(), 400);
        }, 50);
      });
    }

    imgContainer.appendChild(skeleton);
    imgContainer.appendChild(img);
    imgCell.appendChild(imgContainer);

    const nameCell = document.createElement('td');
    nameCell.className = 'px-4 py-4 border-b border-gray-800 bg-gray-800/40 text-left align-middle';
    const safeName = (row.breed_name || 'Unknown Breed').replace(/</g, '&lt;');
    nameCell.innerHTML = `
      <a href="${'/catDetails?id=' + encodeURIComponent(row.catId)}" 
         class="text-indigo-400 hover:text-indigo-300 transition-colors">
        ${safeName}
      </a>
    `;

    const likesCell = document.createElement('td');
    likesCell.className =
      'px-4 py-4 border-b border-gray-800 bg-gray-800/30 text-center align-middle';
    likesCell.innerHTML = `
      <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300">
        <i class="fas fa-heart text-red-500 mr-1.5"></i> ${row.likes || 0}
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

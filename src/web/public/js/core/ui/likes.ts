import { PLACEHOLDER, sanitize } from '../../utils';
import overlayImageWithSkeleton from '../../components/overlayImage';

interface LikeData {
  imageUrl?: string;
  breedName: string;
  likes: number;
  catId: string;
}

interface CreateLikeCardOptions {
  onRemove?: (args: { catId: string; breedName: string; card: HTMLElement }) => void;
}

export function createLikeCard(like: LikeData, { onRemove }: CreateLikeCardOptions = {}) {
  const card = document.createElement('div');
  card.className = 'cat-card';
  const imgContainer = document.createElement('div');
  imgContainer.className = 'relative overflow-hidden rounded-2xl';
  imgContainer.style.height = '200px';
  const { wrapper } = overlayImageWithSkeleton({
    src: like.imageUrl || PLACEHOLDER.MEDIUM,
    alt: like.breedName,
    width: '100%',
    height: '100%',
    shape: 'rect',
    wrapperClass: 'w-full h-full',
    placeholder: PLACEHOLDER.MEDIUM,
    alreadyLoaded: false,
  });
  const badge = document.createElement('div');
  badge.className = 'absolute top-2 right-2';
  badge.innerHTML = `<span class="likes-badge px-3 py-1 bg-indigo-900 bg-opacity-80 text-white rounded-full inline-flex items-center backdrop-blur-sm" role="status" aria-label="Лайков: ${like.likes}"><i class="fas fa-heart text-red-500 mr-1.5" aria-hidden="true"></i> ${like.likes}</span>`;
  wrapper.appendChild(badge);
  imgContainer.appendChild(wrapper);

  const info = document.createElement('div');
  info.className = 'p-5';
  info.innerHTML = `
    <h3 class="text-xl font-bold mb-3">${sanitize(like.breedName)}</h3>
    <div class="flex flex-col space-y-3">
      <a href="/catDetails?id=${encodeURIComponent(
        like.catId,
      )}" class="text-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
        <i class="fas fa-info-circle mr-1"></i> Подробнее
      </a>
      <button class="remove-like-btn text-center py-2 px-4 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg flex items-center justify-center gap-2" data-cat-id="${sanitize(
        like.catId,
      )}" data-breed-name="${sanitize(
        like.breedName,
      )}" aria-label="Удалить лайк породы ${sanitize(like.breedName)}">
        <i class="fas fa-heart-broken" aria-hidden="true"></i> Удалить лайк
      </button>
    </div>`;

  card.setAttribute('role', 'listitem');
  card.appendChild(imgContainer);
  card.appendChild(info);

  if (onRemove) {
    card.querySelector('.remove-like-btn')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      onRemove({
        catId: btn.getAttribute('data-cat-id') || '',
        breedName: btn.getAttribute('data-breed-name') || '',
        card,
      });
    });
  }
  return card;
}

export function renderLikes({
  container,
  data,
  onRemove,
}: {
  container: HTMLElement;
  data: LikeData[];
  onRemove?: any;
}) {
  if (!container) return [];
  const frag = document.createDocumentFragment();
  const cards = data.map((l) => {
    const card = createLikeCard(l, { onRemove });
    frag.appendChild(card);
    return card;
  });
  container.innerHTML = '';
  container.appendChild(frag);
  return cards;
}

export default { renderLikes, createLikeCard };

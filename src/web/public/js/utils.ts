// Generic frontend utilities

export function sanitize(text: string | null | undefined): string {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function debounce(fn: Function, delay = 200) {
  let t: any;
  return function (this: any, ...args: any[]) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

export async function preloadImages(urls: string[] = [], timeoutMs = 3000) {
  if (!Array.isArray(urls) || urls.length === 0) return [];

  const controller = { timedOut: false };

  const timeout = new Promise<any[]>((resolve) => {
    setTimeout(() => {
      controller.timedOut = true;
      resolve([]);
    }, timeoutMs);
  });

  const loads = Promise.all(
    urls.map(
      (url, index) =>
        new Promise((resolve) => {
          if (!url) return resolve({ success: false, url, index });
          const img = new Image();
          img.onload = () => resolve({ success: true, url, index, img });
          img.onerror = () => resolve({ success: false, url, index });
          img.src = url;
          if (img.complete) {
            // If cached by browser already
            resolve({ success: true, url, index, img });
          }
        })
    )
  );

  const result = await Promise.race([loads, timeout]);
  return controller.timedOut ? [] : result;
}

export const PLACEHOLDER = Object.freeze({
  SMALL: "https://placehold.co/96x96/1F2937/4F46E5?text=No+Img",
  MEDIUM: "https://placehold.co/300x200/1F2937/4F46E5?text=No+Image",
  LARGE: "https://placehold.co/800x600/1F2937/4F46E5?text=No+Image",
});

interface CreateElOptions {
  classes?: string[];
  attrs?: Record<string, string>;
  text?: string;
}

export function createEl(
  tag: string,
  { classes = [], attrs = {}, text }: CreateElOptions = {}
) {
  const el = document.createElement(tag);
  if (classes.length) el.className = classes.join(" ");
  Object.entries(attrs).forEach(([k, v]) => {
    if (v != null) el.setAttribute(k, v);
  });
  if (text != null) el.textContent = text;
  return el;
}

export function formatUptime(startDate: Date) {
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - startDate.getTime();
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
  const seconds = Math.floor((timeDifference / 1000) % 60);

  return {
    days: { value: String(days), label: "дн." },
    hours: { value: String(hours), label: "ч." },
    minutes: { value: String(minutes), label: "мин." },
    seconds: { value: String(seconds), label: "сек." },
  };
}

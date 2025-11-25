## Локальная интеграция Tailwind CSS (без CDN)

Вместо вставки `<script src="https://cdn.tailwindcss.com"></script>` проект теперь компилирует Tailwind локально и отдаёт собранный `tailwind.css` из `/static/css/tailwind.css`.

Ключевые изменения:

- Добавлен входной файл `src/web/public/css/tailwind.input.css` с директивами `@tailwind base;`, `@tailwind components;` и `@tailwind utilities;`.
- Добавлен `postcss.config.cjs` с подключением `tailwindcss` и `autoprefixer`.
- В `package.json` добавлены скрипты `css:build` и `css:watch`.
- `npm start` теперь запускает сбор Tailwind перед запуском сервера.

Как работать локально:

1) Установите dev-зависимости (Bun) — Tailwind v4 + Vite-плагин:

```bash
bun install -d tailwindcss @tailwindcss/vite postcss autoprefixer
```

2) Собрать проект (Vite) — при этом Vite сгенерирует CSS (tailwind) и JS в `src/web/public/dist`:

```bash
bun run build
```

3) Для разработки используйте Vite (dev server) — это запустит обработку Tailwind и HMR для фронтенда:

```bash
bun run dev
```

(Если вам нужно отдельно запустить сервер API + фронтенд dev server, запустите оба в разных терминалах — сервер из `bun src/index.ts`, а Vite dev сервер через `bun run dev`.)

4) Запустите сервер (фронтенд соберётся при старте через `bun run build` в `start`):

```bash
bun start
```

Примечание: В проектах на Vite рекомендуется использовать плагин `@tailwindcss/vite` — он обрабатывает директивы Tailwind на этапе сборки Vite и упрощает интеграцию. В этом репозитории плагин подключён к `vite.config.ts`, а также оставлен отдельный CLI-рарный входный CSS (`src/web/public/css/tailwind.input.css`) для случаев, когда нужно иметь фиксированный конечный файл `static/css/tailwind.css`.

Источник и документация (последняя версия): Tailwind CSS — https://tailwindcss.com/docs/installation (полный гайд доступен в официальной документации). Для генерации CSS CLI и PostCSS-интеграции смотрите раздел "Tailwind CLI" и "Using PostCSS".

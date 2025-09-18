# 🐱 Cat API Telegram Bot & Web Platform

Современное приложение с Telegram ботом и веб-интерфейсом для просмотра и взаимодействия с фотографиями котов через The Cat API.

## 📋 Содержание

- [🚀 Особенности](#-особенности)
- [💻 Технологический стек](#-технологический-стек)
- [🔧 Установка](#-установка)
- [⚙️ Конфигурация](#️-конфигурация)
- [🗄️ База данных](#️-база-данных)
- [📊 API Документация](#-api-документация)
- [🤖 Telegram Bot](#-telegram-bot)
- [🚀 Развертывание](#-развертывание)

## � Особенности

- 🎲 **Случайные коты** с детальной информацией о породах
- ❤️ **Система лайков** с персонализацией для пользователей
- 🏆 **Лидерборд** самых популярных пород
- 🔍 **Умный поиск** по характеристикам породы
- 📱 **Dual Interface**: Telegram бот + веб-интерфейс
- 🔄 **Real-time обновления** через WebSocket
- 👤 **Telegram авторизация** в веб-интерфейсе

## � Технологический стек

**Backend:**

- Node.js v18.18.0+ с ES модулями
- Express.js v4.18.2 - веб-сервер
- Telegraf.js v4.11.2 - Telegram Bot Framework
- Prisma ORM v6.16.2 - типобезопасная работа с БД
- Awilix v12.0.0 - Dependency Injection

**База данных:**

- PostgreSQL (продакшен) / SQLite (dev) через Prisma
- Redis v5.8.2 - сессии в продакшене

**Безопасность:**

- Helmet v8.1.0 - HTTP заголовки безопасности
- CORS v2.8.5 - Cross-Origin Resource Sharing
- express-rate-limit v7.5.0 - ограничение запросов

**Frontend:**

- Tailwind CSS v3 - стилизация
- Vanilla JavaScript - интерактивность
- WebSocket - real-time обновления

## 🔧 Установка

### Локальная установка

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/kotru21/cat-api-telegraf.git
   cd cat-api-telegraf
   ```

2. **Установите зависимости:**

   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**

   Создайте файл `.env` в корне проекта:

   ```env
   # Обязательные
   CATAPI_KEY=your-cat-api-key-from-thecatapi.com

   # Опциональные (значения по умолчанию)
   PORT=5200
   WEBSITE_URL=http://localhost
   WEB_ENABLED=true
   BOT_ENABLED=true
   BOT_TOKEN=your-telegram-bot-token
   SESSION_SECRET=your-secret-key-here
   NODE_ENV=development
   DATABASE_URL=file:./prisma/main.db
   ```

4. **Настройте базу данных:**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate:dev
   ```

5. **Запустите приложение:**

   ```bash
   npm start
   ```

### Получение API ключей

1. **The Cat API ключ:**

   - Зарегистрируйтесь на [thecatapi.com](https://thecatapi.com/)
   - Получите бесплатный API ключ
   - Добавьте в `.env` как `CATAPI_KEY`

2. **Telegram Bot Token:**
   - Напишите [@BotFather](https://t.me/botfather) в Telegram
   - Создайте нового бота командой `/newbot`
   - Получите токен и добавьте в `.env` как `BOT_TOKEN`

## ⚙️ Конфигурация

### Переменные окружения

| Переменная       | Тип     | По умолчанию            | Описание                    |
| ---------------- | ------- | ----------------------- | --------------------------- |
| `CATAPI_KEY`     | string  | **обязательно**         | API ключ The Cat API        |
| `PORT`           | number  | `5200`                  | Порт HTTP/WebSocket сервера |
| `WEBSITE_URL`    | string  | `http://localhost`      | Базовый URL приложения      |
| `WEB_ENABLED`    | boolean | `true`                  | Включить веб-сервер         |
| `BOT_ENABLED`    | boolean | `true`                  | Включить Telegram бота      |
| `BOT_TOKEN`      | string  | опционально\*           | Токен Telegram бота         |
| `SESSION_SECRET` | string  | `your-secret-key-here`  | Секрет для сессий           |
| `NODE_ENV`       | enum    | `development`           | Окружение                   |
| `DATABASE_URL`   | string  | `file:./prisma/main.db` | Строка подключения к БД     |
| `REDIS_URL`      | string  | опционально\*\*         | URL Redis для сессий        |

\* Обязательно, если `BOT_ENABLED=true`  
\*\* Обязательно в продакшене

## 🗄️ База данных

Приложение использует **Prisma ORM** с PostgreSQL в продакшене и SQLite для разработки.

### Команды Prisma

```bash
# Генерация клиента после изменения схемы
npm run prisma:generate

# Создание и применение миграций
npm run prisma:migrate:dev

# Запуск Prisma Studio (GUI для БД)
npm run prisma:studio
```

## � API Документация

### Основные endpoints

```http
GET /api/cat/:id              # Получить кота по ID
GET /api/leaderboard          # Лидерборд популярных пород
GET /api/similar              # Поиск по характеристикам
POST /api/like                # Поставить лайк (требует авторизации)
DELETE /api/like              # Убрать лайк (требует авторизации)
GET /api/profile              # Профиль пользователя (требует авторизации)
POST /api/auth/telegram       # Telegram авторизация
```

### Health checks

```http
GET /healthz                  # Проверка состояния
GET /readyz                   # Проверка готовности
```

## 🤖 Telegram Bot

### Доступные команды

| Команда    | Описание                    |
| ---------- | --------------------------- |
| `/start`   | Приветствие и главное меню  |
| `/fact`    | Случайный кот с информацией |
| `/mylikes` | Список лайкнутых котов      |
| `/top`     | Лидерборд популярных пород  |

### Интерактивные действия

- ❤️ **Лайк** - поставить/убрать лайк коту
- 🔍 **Похожие** - найти котов с похожими характеристиками
- 📊 **Лидерборд** - посмотреть популярные породы
- 🎲 **Еще кот** - получить еще одного случайного кота

## 🚀 Развертывание

### Production Requirements

````env
# Обязательные для продакшена
NODE_ENV=production
CATAPI_KEY=your-cat-api-key
SESSION_SECRET=complex-random-string-min-32-chars
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@host:5432/db

# Telegram (если нужен бот)
BOT_TOKEN=your-production-bot-token

# Безопасность
WEBSITE_URL=https://yourdomain.com

## Frontend Modular Structure (Refactor 2025-09)

В рамках последнего рефакторинга инлайновые скрипты из HTML вынесены в ES-модули. Это упростит переиспользование, тестирование и будущую сборку (через Vite/Webpack/Rollup при необходимости).

Структура (`src/web/public/js`):

```text
js/
   api.js            # Централизованный доступ к REST эндпоинтам + кэш
   utils.js          # Общие утилиты: sanitize, debounce, preloadImages, placeholders, форматирование
   toast.js          # Показывает уведомления (toast)
   navigation.js     # Поведение навигации/хедера
   components/       # Изолированные UI/поведенческие куски без знания страницы
      leaderboard.js
      heroAvatars.js
      searchAndSort.js
      confirmationModal.js
      likesGrid.js
   pages/            # Оркестраторы конкретных страниц (инициализация компонентов + поток данных)
      indexPage.js
      profilePage.js
      catDetailsPage.js
````

Принципы:

1. pages/_ импортируют components/_, core (api/utils/toast), но не наоборот.
2. components не делают прямых fetch вызовов — принимают данные или функции загрузки извне.
3. Никакого инлайнового JS в HTML (кроме минимального fallback возможно в будущем). Подключение через `<script type="module" src="/js/pages/...">`.
4. Именование: `Page.js` (суффикс Page) для страниц, существительные в camelCase для компонентов.

Как добавить новую страницу:

1. Создать `pages/newFeaturePage.js`.
2. Внутри: функция `init()` (слушатель DOMContentLoaded) или мгновенный вызов, подключить нужные компоненты.
3. В HTML добавить импорт: `<script type="module" src="/js/pages/newFeaturePage.js"></script>` после core модулей.

Компонентный шаблон (минимум):

```js
// components/exampleWidget.js
export function initExampleWidget(rootEl, options = {}) {
  // подготовка DOM / подписка на события
  return {
    update(newData) {},
    destroy() {},
  };
}
```

Страница (пример):

```js
// pages/samplePage.js
import { getProfile } from "/js/api.js";
import { initExampleWidget } from "/js/components/exampleWidget.js";

async function init() {
  const data = await getProfile();
  const widget = initExampleWidget(document.getElementById("widget-root"));
  widget.update(data);
}

document.addEventListener("DOMContentLoaded", init);
```

Будущие улучшения:

- Автоматическая регистрация страниц по data-атрибуту вместо прямых `<script>`.
- Сборка/оптимизация (код-сплиттинг, minify, cache busting).
- Ленивая загрузка тяжёлых компонентов (напр. leaderboard) через динамические import().
- Типизация через JSDoc/TypeScript.

Если добавляется функционал лайка (POST), логично вынести логику из `catDetailsPage.js` в отдельный `likeButton.js` компонент (пока не внедрено, отметка TODO присутствует).

````

### Heroku Deployment

```bash
# Подготовка
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Переменные окружения
heroku config:set NODE_ENV=production
heroku config:set CATAPI_KEY=your-key
heroku config:set SESSION_SECRET=your-secret
heroku config:set BOT_TOKEN=your-bot-token

# Деплой
git push heroku main
````

---

## 🔗 Links

- **GitHub Repository**: [kotru21/cat-api-telegraf](https://github.com/kotru21/cat-api-telegraf)
- **The Cat API**: [thecatapi.com](https://thecatapi.com/)
- **Telegram Bot API**: [core.telegram.org/bots](https://core.telegram.org/bots)

---

⭐ **Если проект был полезен, поставьте звездочку на GitHub!** ⭐

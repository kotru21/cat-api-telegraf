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

## 🚀 Особенности

- 🎲 **Случайные коты** с детальной информацией о породах
- ❤️ **Система лайков** с персонализацией для пользователей
- 🏆 **Лидерборд** самых популярных пород
- 🔍 **Умный поиск** по характеристикам породы
- 📱 **Dual Interface**: Telegram бот + веб-интерфейс
- 🔄 **Real-time обновления** через WebSocket
- 👤 **Telegram авторизация** в веб-интерфейсе

## 🧱 Технологический стек

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

## 📊 API Документация

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

## 🧩 Frontend Architecture (2025 Refactor)

Фронтенд разделён на прозрачные слои (Clean-ish layering):

```
src/web/public/js/
   api.js                // HTTP helper + caching
   utils.js              // Утилиты и константы (PLACEHOLDER, sanitize, preloadImages)
   core/
      state/
         store.js          // Pub/sub store + event bus
         lifecycle.js      // registerCleanup / runCleanups
      services/           // ONLY: fetch -> normalize -> update store (+ TTL кэш)
         LeaderboardService.js
         LikesService.js
         ProfileService.js
         CatDetailsService.js
      ui/                 // Чистый DOM (render / create... без fetch)
         leaderboard.js
         likes.js
         catDetails.js
         skeleton.js
      errors/
         errorMapper.js
         notify.js         // notifyError / notifySuccess (toast + dedupe)
   components/           // Отдельные переиспользуемые "виджеты"
      searchAndSort.js
      heroAvatars.js
   pages/                // Оркестрация: подписка + вызов сервисов + lifecycle
      indexPage.js
      profilePage.js
      catDetailsPage.js
```

Guidelines / Правила слоя:
1. pages → orchestration only (никакой логики трансформации данных, минимум DOM).
2. services → обращение к `api.js`, нормализация формата, TTL-кэш (Map / timestamps), обновление store.
3. ui → функции create*/render* без сетевых запросов; получают уже нормализованные данные.
4. errors → централизованный mapping + уведомления; исключает дублирование try/catch.
5. a11y → `aria-busy` на контейнерах, `role=list/listitem`, скрытие skeleton через `aria-hidden` (частично внедрено).
6. Никаких inline event handlers в HTML (CSP friendly) — см. раздел Security/CSP.

### Data Model (кратко)
Полное описание: `docs/data-model.md` (создано для синхронизации фронт/бэк). Ниже краткая выжимка:

| Entity            | Поля (нормализованные)                                                                                  |
|-------------------|----------------------------------------------------------------------------------------------------------|
| LeaderboardRow    | `position`, `catId`, `breedName`, `likes`, `change` (резерв), `imageUrl`                                 |
| Like              | `catId`, `breedName`, `imageUrl`, `likes`                                                                |
| CatDetails        | `id`, `breedName`, `description`, `likes`, `wikipediaUrl`, `origin`, `temperament`, `lifeSpan`, `weightMetric`, `weightImperial`, `imageUrl` |
| Profile           | Телеграм данные пользователя (`first_name`, `last_name`, `username`, `photo_url`)                       |

`catId` — единый публичный идентификатор. В переходный период сервис `normalizeRow` имеет fallback цепочку `id || breed_id || cat_id` и выводит предупреждение в dev, если идентификатора нет. План: удалить fallback после выравнивания схемы БД.

### Кэширование (TTL)
- Leaderboard: 15s
- Likes: 10s + отдельный fetch count
- Profile: 30s (см. ProfileService — если будет добавлен TTL)
- CatDetails: 30s (Map cache)

### Тестирование
`jest` + `jsdom` для юнитов (store, нормализация, UI компонентов). Запуск:
```
npm test
```
Покрытие можно расширить тестами на optimistic update (удаление лайка) и поведение skeleton.

### Security / CSP
- Убраны inline обработчики (`onerror`, `onclick`) — заменены на JS привязку.
- Используется Helmet + строгий `script-src-attr 'none'`.
- Fallback изображений через `data-fallback` + JS `error` listener.

### Roadmap / Next
- [ ] Удалить fallback цепочку `breed_id` / `cat_id` → оставить только `id`.
- [ ] Дополнить a11y: скрывать skeleton через `aria-hidden="true"`, live region для обновления лайков.
- [ ] Интегрировать реальный POST лайка на странице деталей (сейчас кнопка локально инкрементирует число).
- [ ] Расширить тесты (optimistic rollback, WebSocket stats stub).
- [ ] Вынести image preloading в общий модуль с абстракцией cancellation.

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
```

---

## 🔗 Links

- **GitHub Repository**: [kotru21/cat-api-telegraf](https://github.com/kotru21/cat-api-telegraf)
- **The Cat API**: [thecatapi.com](https://thecatapi.com/)
- **Telegram Bot API**: [core.telegram.org/bots](https://core.telegram.org/bots)

---

⭐ **Если проект был полезен, поставьте звездочку на GitHub!** ⭐

---

### Changelog (Frontend Refactor Summary)

2025-09: Полный рефактор фронтенда (слои services/state/ui, удалены legacy компоненты, введены тесты, устранены inline handlers, консолидация идентификатора `catId`).

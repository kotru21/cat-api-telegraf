# 🐱 Cat API Telegram Bot & Web Platform

Современное приложение с Telegram ботом и веб-интерфейсом для просмотра и взаимодействия с фотографиями котов через The Cat API. Реализовано с использованием **Clean Architecture**, **Dependency Injection** и современных практик разработки.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/kotru21/cat-api-telegraf)
[![Run on Replit](https://replit.com/badge/github//kotru21/cat-api-telegraf)](https://replit.com/new/github/kotru21/cat-api-telegraf)

## 📋 Содержание

- [🔧 Архитектура](#-архитектура)
- [🚀 Особенности](#-особенности)
- [💻 Технологический стек](#-технологический-стек)
- [📁 Структура проекта](#-структура-проекта)
- [🔧 Установка](#-установка)
- [⚙️ Конфигурация](#️-конфигурация)
- [🗄️ База данных](#️-база-данных)
- [🛡️ Безопасность](#️-безопасность)
- [📊 API Документация](#-api-документация)
- [🤖 Telegram Bot](#-telegram-bot)
- [🌐 Web Interface](#-web-interface)
- [🚀 Развертывание](#-развертывание)
- [🧪 Тестирование](#-тестирование)

## 🔧 Архитектура

Проект построен на основе **Clean Architecture** с четким разделением слоев:

### Архитектурные слои:

- **Presentation Layer**: Веб-контроллеры, Telegram команды
- **Application Layer**: Use Cases, бизнес-логика
- **Domain Layer**: Сервисы, интерфейсы репозиториев
- **Infrastructure Layer**: Репозитории, внешние API, база данных

### Ключевые паттерны:

- **Dependency Injection** (Awilix) с PROXY режимом
- **Repository Pattern** для доступа к данным
- **Use Case Pattern** для бизнес-логики
- **Singleton Pattern** для Prisma клиента
- **Event-Driven Architecture** для real-time обновлений

## 🚀 Особенности

### Функциональные возможности:

- 🎲 **Случайные коты** с детальной информацией о породах
- ❤️ **Система лайков** с персонализацией для пользователей
- 🏆 **Лидерборд** самых популярных пород
- 🔍 **Умный поиск** по характеристикам (происхождение, темперамент, вес, продолжительность жизни)
- 📱 **Dual Interface**: Telegram бот + современный веб-интерфейс
- 🔄 **Real-time обновления** через WebSocket
- 👤 **Telegram авторизация** в веб-интерфейсе

### Технические особенности:

- 🛡️ **Комплексная безопасность**: CSP, CORS, Rate Limiting, HELMET
- ⚡ **Высокая производительность**: Connection pooling, singleton services
- 📊 **Мониторинг**: Структурированные логи (Pino), метрики
- 🔧 **Конфигурируемость**: Отдельное включение/выключение бота и веба
- 🚀 **Production-ready**: Graceful shutdown, health checks, error handling

## � Технологический стек

### Backend:

- **Node.js** v18.18.0+ с ES модулями
- **Express.js** v4.18.2 - веб-сервер
- **Telegraf.js** v4.11.2 - Telegram Bot Framework
- **Prisma ORM** v6.16.2 - типобезопасная работа с БД
- **Awilix** v12.0.0 - Dependency Injection контейнер

### База данных:

- **SQLite** (по умолчанию) / **PostgreSQL** / **MySQL** через Prisma
- **Redis** v5.8.2 - сессии и кэширование (продакшен)

### Безопасность:

- **Helmet** v8.1.0 - HTTP заголовки безопасности
- **CORS** v2.8.5 - Cross-Origin Resource Sharing
- **express-rate-limit** v7.5.0 - ограничение запросов
- **express-session** v1.18.1 - управление сессиями

### Real-time & Мониторинг:

- **WebSocket** (ws v8.13.0) - real-time обновления
- **Pino** v9.3.2 - структурированное логирование
- **Zod** v3.23.8 - валидация схем и переменных окружения

### Frontend:

- **Tailwind CSS** v3 - утилитарный CSS фреймворк
- **Font Awesome** - иконки
- **Vanilla JavaScript** - интерактивность без фреймворков

## 📁 Структура проекта

```
cat-api-telegraf/
├── src/
│   ├── index.js                    # Точка входа приложения
│   ├── config/                     # Конфигурация приложения
│   │   ├── index.js               # Основная конфигурация
│   │   └── schema.js              # Zod схемы валидации env
│   ├── application/               # Application Layer (Clean Architecture)
│   │   ├── context.js            # DI контекст и executeUseCase
│   │   ├── errors.js             # Кастомные ошибки приложения
│   │   ├── events.js             # Event emitter для real-time
│   │   └── use-cases/           # Бизнес-логика (Use Cases)
│   │       ├── getCatDetails.js
│   │       ├── getRandomCat.js
│   │       ├── likeCat.js
│   │       └── index.js
│   ├── services/                 # Domain Services
│   │   ├── CatService.js        # Агрегатор сервисов котов
│   │   ├── CatInfoService.js    # Информация о котах
│   │   ├── LikeService.js       # Система лайков
│   │   └── LeaderboardService.js # Лидерборд пород
│   ├── database/                # Infrastructure Layer
│   │   ├── prisma/
│   │   │   └── PrismaClient.js  # Singleton Prisma клиент
│   │   ├── CatRepository.js     # Репозиторий котов
│   │   └── LikesRepository.js   # Репозиторий лайков
│   ├── api/                     # External API клиенты
│   │   └── CatApiClient.js      # The Cat API клиент
│   ├── bot/                     # Telegram Bot
│   │   ├── BotService.js        # Основной сервис бота
│   │   ├── commands/            # Команды бота
│   │   │   ├── BaseCommand.js   # Базовый класс команд
│   │   │   ├── FactCommand.js   # /fact команда
│   │   │   └── MenuCommand.js   # /menu команда
│   │   └── actions/             # Inline действия
│   │       └── LikeAction.js    # Действие лайка
│   ├── web/                     # Web Interface
│   │   ├── WebServer.js         # Express сервер
│   │   ├── ApiRoutes.js         # API маршрутизация
│   │   ├── WebSocketServer.js   # WebSocket сервер
│   │   ├── controllers/         # HTTP контроллеры
│   │   │   └── AuthController.js # Telegram авторизация
│   │   ├── middleware/          # Express middleware
│   │   │   ├── security.js      # Helmet, CORS настройки
│   │   │   ├── rateLimiters.js  # Rate limiting
│   │   │   ├── session.js       # Сессии
│   │   │   └── authMiddleware.js # Авторизация
│   │   ├── routes/              # API маршруты
│   │   │   ├── catRoutes.js     # Маршруты котов
│   │   │   ├── userRoutes.js    # Пользовательские маршруты
│   │   │   ├── authRoutes.js    # Авторизация
│   │   │   └── debugRoutes.js   # Отладочные маршруты
│   │   ├── views/               # HTML шаблоны
│   │   │   ├── index.html       # Главная страница
│   │   │   ├── catDetails.html  # Детали кота
│   │   │   ├── similar.html     # Поиск похожих
│   │   │   ├── profile.html     # Профиль пользователя
│   │   │   └── partials/        # Переиспользуемые части
│   │   └── public/              # Статические файлы
│   │       ├── js/navigation.js # Клиентский JS
│   │       └── media/           # Медиафайлы
│   ├── di/                      # Dependency Injection
│   │   └── container.js         # Awilix контейнер
│   └── utils/                   # Утилиты
│       ├── logger.js            # Pino logger
│       └── messageCounter.js    # Счетчик сообщений
├── prisma/                      # Prisma ORM
│   ├── schema.prisma           # Схема БД
│   └── migrations/             # Миграции БД
├── scripts/                    # Вспомогательные скрипты
│   ├── smoke.js               # Smoke тесты
│   └── check-prisma.js        # Проверка Prisma
├── public/                    # Публичные ресурсы
└── package.json              # Node.js зависимости
```

## �🔧 Установка

### Локальная установка

1. **Клонируйте репозиторий:**

   ```powershell
   git clone https://github.com/kotru21/cat-api-telegraf.git
   cd cat-api-telegraf
   ```

2. **Установите зависимости:**

   ```powershell
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

   ```powershell
   npm run prisma:generate
   npm run prisma:migrate:dev
   ```

5. **Запустите приложение:**
   ```powershell
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

Приложение использует **Zod** для типобезопасной валидации конфигурации:

### Переменные окружения

| Переменная       | Тип     | По умолчанию            | Описание                               |
| ---------------- | ------- | ----------------------- | -------------------------------------- |
| `CATAPI_KEY`     | string  | **обязательно**         | API ключ The Cat API                   |
| `PORT`           | number  | `5200`                  | Порт HTTP/WebSocket сервера            |
| `WEBSITE_URL`    | string  | `http://localhost`      | Базовый URL приложения                 |
| `WEB_ENABLED`    | boolean | `true`                  | Включить веб-сервер                    |
| `BOT_ENABLED`    | boolean | `true`                  | Включить Telegram бота                 |
| `BOT_TOKEN`      | string  | опционально\*           | Токен Telegram бота                    |
| `SESSION_SECRET` | string  | `your-secret-key-here`  | Секрет для сессий                      |
| `NODE_ENV`       | enum    | `development`           | Окружение: development/test/production |
| `DATABASE_URL`   | string  | `file:./prisma/main.db` | Строка подключения к БД                |
| `REDIS_URL`      | string  | опционально\*\*         | URL Redis для сессий                   |

**\*** Обязательно, если `BOT_ENABLED=true`  
**\*\*** Обязательно в продакшене

### Режимы работы

```powershell
# Только веб-интерфейс
$env:WEB_ENABLED='true'; $env:BOT_ENABLED='false'; npm start

# Только Telegram бот
$env:WEB_ENABLED='false'; $env:BOT_ENABLED='true'; npm start

# Полнофункциональный режим (по умолчанию)
$env:WEB_ENABLED='true'; $env:BOT_ENABLED='true'; npm start
```

## 🗄️ База данных

Приложение использует **Prisma ORM** с поддержкой множественных БД:

### Схема данных

```prisma
model msg {
  id              String   @id
  count           Int      @default(0)
  breed_name      String?
  image_url       String?
  description     String?
  wikipedia_url   String?
  breed_id        String?
  temperament     String?
  origin          String?
  life_span       String?
  weight_imperial String?
  weight_metric   String?
  created_at      DateTime @default(now())

  user_likes user_likes[]
  @@index([count], map: "idx_msg_count")
}

model user_likes {
  id      Int    @id @default(autoincrement())
  user_id String
  cat_id  String
  msg     msg    @relation(fields: [cat_id], references: [id])

  @@unique([user_id, cat_id])
}
```

### Команды Prisma

```powershell
# Генерация клиента после изменения схемы
npm run prisma:generate

# Создание и применение миграций
npm run prisma:migrate:dev

# Запуск Prisma Studio (GUI для БД)
npm run prisma:studio

# Проверка подключения к БД
npm run prisma:check
```

### Поддерживаемые БД

- **SQLite** (по умолчанию) - для разработки и тестирования
- **PostgreSQL** - для продакшена
- **MySQL/MariaDB** - альтернатива для продакшена

Пример для PostgreSQL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/catapi?schema=public"
```

## 🛡️ Безопасность

Приложение реализует многоуровневую систему безопасности:

### HTTP Security (Helmet.js)

```javascript
// Content Security Policy
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "cdn.tailwindcss.com", "telegram.org"],
    styleSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
    imgSrc: ["'self'", "data:", "https://*"],
    connectSrc: ["'self'", "ws:", "wss:", "telegram.org"]
  }
}
```

### Rate Limiting

```javascript
// API общий лимит: 100 запросов / 15 минут
// Лидерборд: 30 запросов / 5 минут
// Telegram бот: 3 сообщения / 3 секунды
// WebSocket: 10 сообщений / 5 секунд на клиента
```

### Аутентификация

- **Telegram Login Widget** с HMAC верификацией
- **Express Sessions** с HttpOnly cookies
- **Redis store** для сессий в продакшене
- **CSRF защита** через SameSite cookies

### Валидация данных

```javascript
// Zod схемы для валидации
// Sanitization пользовательского ввода
// Регулярные выражения для ID котов: /^[a-zA-Z0-9_-]+$/
```

## 📊 API Документация

### Базовый URL

```
http://localhost:5200/api
```

### Коты (Cats)

#### Получить кота по ID

```http
GET /api/cat/:id

Response 200:
{
  "id": "abcd1234",
  "breed_name": "British Shorthair",
  "image_url": "https://...",
  "description": "...",
  "temperament": "Calm, Easy Going",
  "origin": "United Kingdom",
  "life_span": "12 - 17",
  "weight_metric": "4 - 8",
  "count": 5
}
```

#### Получить лидерборд

```http
GET /api/leaderboard

Response 200:
[
  {
    "breed_name": "British Shorthair",
    "total_likes": 15,
    "image_url": "https://..."
  }
]
```

#### Поиск по характеристикам

```http
GET /api/similar?feature=origin&value=Russia

Parameters:
- feature: origin|temperament|life_span|weight_metric|weight_imperial
- value: строка для поиска

Response 200:
[
  {
    "id": "xyz789",
    "breed_name": "Russian Blue",
    "image_url": "https://...",
    // ... остальные поля
  }
]
```

#### Случайные изображения

```http
GET /api/random-images?count=3

Response 200:
{
  "images": [
    {
      "id": "img1",
      "url": "https://...",
      "width": 800,
      "height": 600
    }
  ]
}
```

### Лайки (Likes)

#### Поставить лайк (требует авторизации)

```http
POST /api/like
Content-Type: application/json

{
  "catId": "abcd1234"
}

Response 200:
{
  "ok": true,
  "newCount": 6
}
```

#### Убрать лайк (требует авторизации)

```http
DELETE /api/like
Content-Type: application/json

{
  "catId": "abcd1234"
}

Response 200:
{
  "ok": true
}
```

### Пользователи (Users)

#### Профиль пользователя (требует авторизации)

```http
GET /api/profile

Response 200:
{
  "id": "12345",
  "first_name": "John",
  "username": "john_doe",
  "photo_url": "https://..."
}
```

#### Лайки пользователя (требует авторизации)

```http
GET /api/mylikes

Response 200:
[
  {
    "id": "abcd1234",
    "breed_name": "British Shorthair",
    "image_url": "https://..."
  }
]
```

#### Количество лайков (требует авторизации)

```http
GET /api/user/likes/count

Response 200:
{
  "count": 5
}
```

### Авторизация

#### Telegram Login

```http
POST /api/auth/telegram
Content-Type: application/json

{
  "id": "12345",
  "first_name": "John",
  "username": "john_doe",
  "photo_url": "https://...",
  "auth_date": "1634567890",
  "hash": "abc123..."
}

Response 200:
{
  "success": true,
  "redirect": "/profile"
}
```

### Health Checks

```http
GET /healthz   # Проверка состояния
GET /readyz    # Проверка готовности
```

### Error Responses

```json
// 400 Bad Request
{
  "error": "Invalid ID format"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 429 Too Many Requests
{
  "error": "Слишком много запросов, пожалуйста, попробуйте позже"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error"
}
```

## 🤖 Telegram Bot

### Доступные команды

| Команда    | Описание           | Пример                     |
| ---------- | ------------------ | -------------------------- |
| `/start`   | Приветствие и меню | Показывает главное меню    |
| `/menu`    | Главное меню       | Интерактивные кнопки       |
| `/fact`    | Случайный кот      | Фото + информация о породе |
| `/mylikes` | Мои лайки          | Список лайкнутых котов     |
| `/top`     | Лидерборд          | Топ популярных пород       |

### Интерактивные действия

- **❤️ Лайк** - поставить/убрать лайк коту
- **🔍 Похожие** - найти котов с похожими характеристиками
- **📊 Лидерборд** - посмотреть популярные породы
- **🎲 Еще кот** - получить еще одного случайного кота

### Особенности бота

- **Rate Limiting**: максимум 3 команды за 3 секунды
- **Graceful Errors**: понятные сообщения об ошибках
- **Персонализация**: сохранение лайков по user_id
- **Rich Media**: высококачественные изображения + детальная информация

### Архитектура бота

```javascript
// Базовый класс команд с DI
class BaseCommand {
  constructor(name, description) {
    this.container = null; // Awilix DI container
  }

  // Безопасное выполнение use-cases
  async executeUseCase(useCaseFn, params, ctx) {
    const appCtx = this.createAppContext();
    return executeUseCase(useCaseFn, appCtx, params, meta);
  }
}

// Пример команды
class FactCommand extends BaseCommand {
  constructor() {
    super("fact", "Получить случайного кота");
    this.composer.command("fact", this.handleFact.bind(this));
  }
}
```

## 🌐 Web Interface

### Страницы

#### Главная страница (`/`)

- **Real-time статистика** через WebSocket
- **Случайные коты** в hero секции
- **Быстрая навигация** к основным функциям
- **Адаптивный дизайн** для всех устройств

#### Детали кота (`/catDetails?id=:id`)

- **Полная информация** о породе
- **Высококачественное изображение**
- **Интерактивные действия** (лайк, поиск похожих)
- **Ссылка на Wikipedia**

#### Поиск похожих (`/similar?feature=:feature&value=:value`)

- **Умная фильтрация** по характеристикам
- **Сетка котов** с lazy loading
- **Детальные карточки** с быстрым просмотром

#### Профиль пользователя (`/profile`)

- **Telegram авторизация** required
- **Личная статистика** лайков
- **Сохраненные коты**

#### Авторизация (`/login`)

- **Telegram Login Widget**
- **Автоматический редирект** после входа

### Технические особенности веб-интерфейса

#### Real-time обновления

```javascript
// WebSocket подключение для live статистики
const ws = new WebSocket("ws://localhost:5200/wss");

// События:
// - messageCountUpdate: новые сообщения бота
// - leaderboardUpdate: изменения в лидерборде
// - timeUpdate: текущее время сервера
```

#### Responsive Design

- **Mobile-first** подход
- **Tailwind CSS** utility-first
- **Flexbox/Grid** layouts
- **Dark theme** по умолчанию

#### Progressive Enhancement

- **Core functionality** работает без JavaScript
- **Enhanced UX** с JavaScript включенным
- **Graceful degradation** для старых браузеров

#### Performance

- **Lazy loading** изображений
- **Skeleton loaders** во время загрузки
- **Debounced** API calls
- **Connection pooling** для быстрых ответов

## 🚀 Развертывание

### Production Requirements

```env
# Обязательные для продакшена
NODE_ENV=production
SESSION_SECRET=complex-random-string-min-32-chars
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@host:5432/db

# Telegram (если нужен бот)
BOT_TOKEN=your-production-bot-token

# Безопасность
WEBSITE_URL=https://yourdomain.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run prisma:generate
EXPOSE 5200
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/catapi
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    ports:
      - "5200:5200"

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: catapi
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

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

### Health Monitoring

```bash
# Проверка состояния
curl https://yourdomain.com/healthz
curl https://yourdomain.com/readyz

# Мониторинг логов
heroku logs --tail
```

## 🧪 Тестирование

### Smoke Tests

```powershell
# Запуск smoke тестов
npm run smoke

# Проверка Prisma подключения
npm run prisma:check
```

### Manual Testing

```powershell
# Тест веб-интерфейса
Start-Process "http://localhost:5200"

# Тест API endpoints
Invoke-RestMethod -Uri "http://localhost:5200/api/leaderboard" -Method GET

# Тест WebSocket
# Открыть Developer Tools в браузере и проверить WebSocket соединение
```

### Production Validation

```bash
# Health checks
curl -f https://yourdomain.com/healthz || exit 1
curl -f https://yourdomain.com/readyz || exit 1

# Performance test
curl -w "@curl-format.txt" -s -o /dev/null https://yourdomain.com/
```

---

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

## 🔗 Links

- **GitHub Repository**: [kotru21/cat-api-telegraf](https://github.com/kotru21/cat-api-telegraf)
- **The Cat API**: [thecatapi.com](https://thecatapi.com/)
- **Telegram Bot API**: [core.telegram.org/bots](https://core.telegram.org/bots)

---

⭐ **Если проект был полезен, поставьте звездочку на GitHub!** ⭐

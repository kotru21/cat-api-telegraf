# 🐱 Cat Telegram Bot

Telegram бот, созданный с использованием telegraf.js и Cat API для показа случайных изображений котов.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/kotru21/cat-api-telegraf)
[![Run on Replit](https://replit.com/badge/github//kotru21/cat-api-telegraf)](https://replit.com/new/github/kotru21/cat-api-telegraf)

## 📋 Содержание

- [Особенности](#особенности)
- [Установка](#установка)
  - [Локальная установка](#локальная-установка)
  - [Установка на Heroku](#установка-на-heroku)
  - [Установка на Replit](#установка-на-replit)
- [Демонстрация](#демонстрация)
  - [Веб-интерфейс](#веб-интерфейс)
  - [Telegram-интерфейс](#telegram-интерфейс)
- [Технологии](#технологии)

## 🚀 Особенности

- Получение случайных котов с подробным описанием
- возможность лайка котов и просмотра лайков. Возможность просмотра топов.
- Простой и интуитивно понятный интерфейс
- Работает в Telegram, есть и просмотр с личным кабинетом через веб-сервис
- Легкая настройка и развертывание

## 🔧 Установка

### Локальная установка

1. Клонируйте репозиторий

   ```bash
   git clone https://github.com/kotru21/cat-api-telegraf.git
   cd cat-api-telegraf
   ```

2. Установите зависимости

   ```bash
   npm install
   ```

3. Создайте файл `.env` и заполните необходимые переменные
   ```
   BOT_TOKEN=YourTelegramBotTokenHere
   CATAPI_KEY=YourCatApiTokenHere
   FULL_WEBSITE_URL=`https://YourWebsite`
   SESSION_SECRET="SomeHardToCrackSecret"
   ```
4. Запустите бота
   ```bash
   npm start
   ```

### Установка на Heroku

1. Нажмите кнопку "Deploy to Heroku" выше.
2. Заполните необходимые Config Vars в настройках Heroku:
   - `BOT_TOKEN` - ваш токен Telegram бота
   - `CATAPI_KEY` - ваш токен Cat API (опционально, для увеличения лимита запросов)
   - `FULL_WEBSITE_URL` - для сайта. Внимание: Телеграм не работает с localhost
   - `SESSION_SECRET` - для безопасности сессий (вход через веб-панель)

Подробнее о [Config Variables на Heroku](https://devcenter.heroku.com/articles/config-vars).

### Установка на Replit

1. Нажмите кнопку "Run on Replit" выше.
2. Заполните переменные окружения в интерфейсе Replit:

   - `BOT_TOKEN` - ваш токен Telegram бота
   - `CATAPI_KEY` - ваш токен Cat API (опционально)
   - `FULL_WEBSITE_URL` - для сайта. Внимание: Телеграм не работает с localhost
   - `SESSION_SECRET` - для безопасности сессий (вход через веб-панель)

## 📷 Демонстрация

### Веб-интерфейс

Веб-интерфейс бота позволяет получать изображения котов прямо из браузера:

![Главная страница веб-интерфейса](https://github.com/user-attachments/assets/bbbd82ba-6aed-4e83-ac43-0c56ace8453f)

![Пример изображения кота](https://github.com/user-attachments/assets/93c6f150-244c-4e64-a335-4b503621c0d0)

### Telegram-интерфейс

Интерфейс бота в Telegram предоставляет удобный доступ к изображениям котов:

![Пример работы в Telegram](https://github.com/user-attachments/assets/0923e4d9-379a-4198-ad8f-1c22a283fb2d)

## 💻 Технологии

- [Telegraf.js](https://telegraf.js.org/) - фреймворк для создания Telegram ботов
- [Cat API](https://thecatapi.com/) - API для получения изображений котов
- [Node.js](https://nodejs.org/) - среда выполнения JavaScript
- [Express](https://expressjs.com/) - веб-фреймворк для Node.js
- [Sqlite](https://www.sqlite.org/) - в качестве Self Contained бд для лёгкого развёртывания

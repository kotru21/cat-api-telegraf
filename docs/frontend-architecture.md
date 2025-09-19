# Frontend Architecture

## Цели

- Разделение ответственности
- Упрощение тестирования
- Минимизация связей между слоями
- Подготовка к SPA-навигации

## Слои

| Слой     | Папка         | Ответственность                          |
| -------- | ------------- | ---------------------------------------- |
| api      | api.js        | HTTP/WS вызовы, ответной кэш             |
| services | core/services | Доменные операции, нормализация, TTL-кэш |
| state    | core/state    | store (pub-sub), lifecycle               |
| ui       | core/ui       | Чистые функции создания/обновления DOM   |
| errors   | core/errors   | mapError + notify                        |
| pages    | pages         | Контроллеры страниц                      |
| utils    | utils.js      | Общие функции                            |

## Поток Данных

page -> service.load() -> api -> service нормализует -> store.setState -> subscribe callback -> ui.render

## События / Флаги

- loading.\* (leaderboard, likes, profile)
- errors.\*
- likesCount

## Optimistic Updates

Удаление лайка: локально удаляем, отправляем DELETE, на ошибке откатываем.

## Accessibility

- aria-busy на контейнер / таблицу
- skeleton элементы aria-hidden="true"
- role="list" и role="listitem" для коллекций

## Будущее

- TypeScript
- Dynamic import
- JSDOM тесты

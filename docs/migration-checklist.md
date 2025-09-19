# Migration Checklist

## Done

- [x] Store + services (leaderboard, likes, profile)
- [x] UI renderers (leaderboard, likes, skeleton)
- [x] Central error notify
- [x] Lifecycle util

## Pending

- [ ] catDetails refactor
- [ ] heroAvatars migration
- [ ] Tests (jsdom)
- [ ] TypeScript migration
- [ ] Dynamic imports / build step

## Rules

1. Нет fetch в ui/
2. Services нормализуют данные
3. Ошибки → mapError → notify
4. Подписки освобождать через lifecycle при необходимости

## PR Review Checklist

- Слой корректен?
- Нет ли DOM в сервисе?
- Учтены aria-\*?
- Добавлена нормализация?
- Документация обновлена?

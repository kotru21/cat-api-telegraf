# Data Model (Frontend / Normalized Shapes)

Единая точка правды для формата данных, проходящих через слой services → ui.

## LeaderboardRow

```ts
{
  position: number,              // Позиция в таблице (rank или index+1)
  catId: string | undefined,     // Единый ID (fallback: id || breed_id || cat_id). ДОЛЖЕН стать строго id.
  breedName: string,             // Название породы ("Unknown Breed" если отсутствует)
  likes: number | undefined,     // Количество лайков (likes || count)
  change: number,                // Зарезервировано под динамику (сейчас 0)
  imageUrl: string               // URL изображения или "" если нет
}
```

## Like

```ts
{
  catId: string,
  breedName: string,
  imageUrl: string,
  likes: number
}
```

## CatDetails

```ts
{
  id: string,
  breedName: string,
  description: string,           // "—" если нет
  likes: number,                 // count
  wikipediaUrl: string | null,
  origin: string,
  temperament: string,
  lifeSpan: string,              // life_span
  weightMetric: string,          // weight_metric
  weightImperial: string,        // weight_imperial
  imageUrl: string | null
}
```

## Profile

```ts
{
  id?: string,                   // Telegram user id (используется на бэкенде)
  first_name?: string,
  last_name?: string,
  username?: string,
  photo_url?: string
}
```

## Инварианты

- `catId` / `id` не должен быть пустым в production; fallback механизм логирует предупреждение в dev.
- Все нормализации НЕ мутируют входные объекты.
- Services гарантируют: UI никогда не работает с "сырая форма бэкенда".

## Переходный период

- После стабилизации схемы БД (обязательное поле `id` всегда присутствует) удалить fallback цепочку и dev warning в `LeaderboardService.normalizeRow`.

## Тестовое покрытие

- `leaderboardService.test.js` проверяет нормализацию.
- `leaderboardUi.test.js` проверяет корректную генерацию ссылки.
- Дополнительно рекомендуется: тест на отсутствие генерации кликабельной ссылки при отсутствии catId.

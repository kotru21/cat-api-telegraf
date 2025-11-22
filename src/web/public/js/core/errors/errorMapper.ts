// Maps error/status to user-friendly message (expandable)

export function mapError(err: any) {
  if (!err) return "Неизвестная ошибка";
  if (err.status === 401) return "Необходима авторизация";
  if (err.status === 404) return "Не найдено";
  if (String(err.message || "").startsWith("NETWORK_ERROR"))
    return "Проблемы с сетью";
  return err.message || "Ошибка";
}

export default { mapError };

// Maps error/status to user-friendly message (expandable)

export function mapError(err: unknown) {
  if (!err) return 'Неизвестная ошибка';
  const e = err as { status?: number; message?: string };
  if (e.status === 401) return 'Необходима авторизация';
  if (e.status === 404) return 'Не найдено';
  if (String(e.message || '').startsWith('NETWORK_ERROR')) return 'Проблемы с сетью';
  return e.message || 'Ошибка';
}

export default { mapError };

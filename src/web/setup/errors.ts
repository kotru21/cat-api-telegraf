import { Hono, Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError } from '../../application/errors.js';
import logger from '../../utils/logger.js';

export function configureErrorHandling(app: Hono) {
  // Global error handler
  app.onError((err: Error, c: Context) => {
    if (err instanceof AppError) {
      logger.warn({ err }, 'AppError');
      return c.json(
        { error: err.message, code: err.code },
        err.status as 400 | 401 | 403 | 404 | 500,
      );
    }

    if (err instanceof HTTPException) {
      logger.warn({ err }, 'HTTPException');
      return c.json({ error: err.message }, err.status);
    }

    logger.error({ err }, 'Unhandled error');
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  // 404 handler
  app.notFound((c: Context) => {
    return c.json({ error: 'Not Found' }, 404);
  });
}

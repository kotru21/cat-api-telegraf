import { Express, Request, Response, NextFunction } from 'express';
import { AppError } from '../../application/errors.js';
import logger from '../../utils/logger.js';

export function configureErrorHandling(app: Express) {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      logger.warn({ err }, 'AppError');
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal Server Error' });
  });
}

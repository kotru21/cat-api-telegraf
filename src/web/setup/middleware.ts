import { Express } from 'express';
import crypto from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import pinoHttp from 'pino-http';
import logger from '../../utils/logger.js';
import { setupSecurity } from '../middleware/security.js';
import { setupSession } from '../middleware/session.js';
import { Config } from '../../config/types.js';

export function configureMiddleware(app: Express, config: Config) {
  app.set('trust proxy', 1);

  // Security middleware (CSP, CORS, essential headers)
  setupSecurity(app);

  // HTTP request logging
  app.use(
    pinoHttp({
      logger,
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const id = req.headers['x-request-id'];
        if (typeof id === 'string') return id;
        if (Array.isArray(id)) return id[0];
        return crypto.randomUUID();
      },
      customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (err || (res.statusCode && res.statusCode >= 500)) return 'error';
        if (res.statusCode && res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // Session management
  setupSession(app, config);
}

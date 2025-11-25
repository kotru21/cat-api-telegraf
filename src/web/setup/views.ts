import { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureViews(app: Express) {
  app.engine('html', async (filePath, options, callback) => {
    try {
      let content = await Bun.file(filePath).text();

      // Заменяем маркеры на содержимое шаблонов
      if (content.includes('<!-- INCLUDE_NAVIGATION -->')) {
        const navPath = path.join(__dirname, '../views/partials/navigation.html');

        try {
          const navFile = Bun.file(navPath);
          if (await navFile.exists()) {
            const navContent = await navFile.text();
            content = content.replace('<!-- INCLUDE_NAVIGATION -->', navContent);
          } else {
            logger.warn({ navPath }, `Navigation partial not found`);
          }
        } catch (err) {
          logger.error({ err }, `Error reading navigation.html`);
        }
      }

      callback(null, content);
    } catch (err) {
      logger.error({ err, filePath }, `Error reading template file`);
      return callback(err as Error);
    }
  });

  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'html');
}

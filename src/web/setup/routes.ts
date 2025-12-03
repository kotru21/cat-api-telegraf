import { Hono, Context } from 'hono';
import { serveStatic } from 'hono/bun';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';
import { SessionData } from '../../types/hono.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HTML template cache (production only)
const templateCache = new Map<string, string>();
const isProd = process.env.NODE_ENV === 'production';

// Simple HTML template renderer using Bun's file API with caching
async function renderHtml(templatePath: string): Promise<string> {
  // Check cache in production
  if (isProd) {
    const cached = templateCache.get(templatePath);
    if (cached) {
      return cached;
    }
  }

  try {
    let content = await Bun.file(templatePath).text();

    // Include navigation partial if marker exists
    if (content.includes('<!-- INCLUDE_NAVIGATION -->')) {
      const navPath = path.join(__dirname, '../views/partials/navigation.html');

      try {
        const navFile = Bun.file(navPath);
        if (await navFile.exists()) {
          const navContent = await navFile.text();
          content = content.replace('<!-- INCLUDE_NAVIGATION -->', navContent);
        } else {
          logger.warn({ navPath }, 'Navigation partial not found');
        }
      } catch (err) {
        logger.error({ err }, 'Error reading navigation.html');
      }
    }

    // Cache in production
    if (isProd) {
      templateCache.set(templatePath, content);
      logger.debug({ templatePath }, 'Template cached');
    }

    return content;
  } catch (err) {
    logger.error({ err, templatePath }, 'Error reading template file');
    throw err;
  }
}

/**
 * Clear template cache (useful for hot reload in development)
 */
export function clearTemplateCache() {
  templateCache.clear();
  logger.info('Template cache cleared');
}

export function configureRoutes(app: Hono) {
  const publicDir = path.join(__dirname, '../public');
  const viewsDir = path.join(__dirname, '../views');

  // Static files using Bun's native static file serving
  app.get(
    '/static/*',
    serveStatic({ root: publicDir, rewriteRequestPath: (p) => p.replace('/static', '') }),
  );
  app.get(
    '/js/*',
    serveStatic({
      root: path.join(publicDir, 'dist'),
      rewriteRequestPath: (p) => p.replace('/js', ''),
    }),
  );
  app.get(
    '/media/*',
    serveStatic({
      root: path.join(publicDir, 'media'),
      rewriteRequestPath: (p) => p.replace('/media', ''),
    }),
  );

  // HTML views
  app.get('/', async (c: Context) => {
    const html = await renderHtml(path.join(viewsDir, 'index.html'));
    return c.html(html);
  });

  app.get('/catDetails', async (c: Context) => {
    const html = await renderHtml(path.join(viewsDir, 'catDetails.html'));
    return c.html(html);
  });

  app.get('/similar', async (c: Context) => {
    const html = await renderHtml(path.join(viewsDir, 'similar.html'));
    return c.html(html);
  });

  // Health checks
  app.get('/healthz', (c: Context) => c.json({ status: 'ok' }));
  app.get('/readyz', (c: Context) => c.json({ status: 'ready' }));

  // User profile view (requires session)
  app.get('/profile', async (c: Context) => {
    const session = c.get('session') as SessionData | undefined;
    if (!session?.user) {
      return c.redirect('/login');
    }
    const html = await renderHtml(path.join(viewsDir, 'profile.html'));
    return c.html(html);
  });

  // Login page
  app.get('/login', async (c: Context) => {
    const session = c.get('session') as SessionData | undefined;
    if (session?.user) {
      return c.redirect('/profile');
    }
    const html = await renderHtml(path.join(viewsDir, 'login.html'));
    return c.html(html);
  });

  // Logout
  app.get('/logout', (c: Context) => {
    // Clear session by setting empty object
    c.set('session', {} as SessionData);
    return c.redirect('/');
  });
}

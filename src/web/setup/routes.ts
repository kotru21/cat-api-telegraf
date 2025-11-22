import express, { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureRoutes(app: Express) {
  // Static files
  app.use('/static', express.static(path.join(__dirname, '../public')));
  app.use('/js', express.static(path.join(__dirname, '../public/dist')));
  app.use('/media', express.static(path.join(__dirname, '../public/media')));

  // Views
  app.get('/', (req, res) => res.render('index'));
  app.get('/catDetails', (req, res) => res.render('catDetails'));
  app.get('/similar', (req, res) => res.render('similar'));

  // Health checks
  app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/readyz', (req, res) => res.status(200).json({ status: 'ready' }));

  // User profile view (requires session)
  app.get('/profile', (req, res) => {
    if (!(req.session as any).user) {
      return res.redirect('/login');
    }
    res.render('profile');
  });

  // Login page
  app.get('/login', (req, res) => {
    if ((req.session as any).user) {
      return res.redirect('/profile');
    }
    res.render('login');
  });

  // Logout
  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) logger.error({ err }, 'Session destroy error');
      res.redirect('/');
    });
  });
}

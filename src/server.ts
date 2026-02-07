import express from 'express';
import 'express-async-errors';
import type Database from 'better-sqlite3';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export interface AppOptions {
  db: Database.Database;
}

export function createApp(options: AppOptions): express.Application {
  const app = express();

  app.use(express.json());

  // Store db instance on app for access in routes
  app.set('db', options.db);

  // Routes
  app.use(healthRoutes);
  app.use(authRoutes);
  app.use(usersRoutes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

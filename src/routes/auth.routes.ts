import { Router } from 'express';
import type Database from 'better-sqlite3';
import { register, login, refresh } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { ValidationError } from '../middleware/error.middleware.js';

const router = Router();

router.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new ValidationError('Email, password, and name are required');
  }

  const db = req.app.get('db') as Database.Database;
  const result = await register(db, email, password, name);

  res.status(201).json({ success: true, data: result });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const db = req.app.get('db') as Database.Database;
  const result = await login(db, email, password);

  res.json({ success: true, data: result });
});

router.post('/auth/refresh', requireAuth, (req, res) => {
  const token = req.headers.authorization!.slice(7);
  const db = req.app.get('db') as Database.Database;
  const result = refresh(db, token);

  res.json({ success: true, data: result });
});

export default router;

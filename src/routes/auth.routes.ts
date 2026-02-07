import { Router } from 'express';
import type Database from 'better-sqlite3';
import { register, login, refresh } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schemas.js';

const router = Router();

router.post('/auth/register', validateBody(registerSchema), async (req, res) => {
  const { email, password, name } = req.body;
  const db = req.app.get('db') as Database.Database;
  const result = await register(db, email, password, name);

  res.status(201).json({ success: true, data: result });
});

router.post('/auth/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
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

import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth.middleware.js';
import { listUsers, getUserById, getUsersByIds, updateUser } from '../services/user.service.js';
import { ValidationError } from '../middleware/error.middleware.js';

const router = Router();

// All user routes require authentication
router.use('/users', requireAuth);

router.get('/users/batch', (req, res) => {
  const idsParam = req.query.ids as string | undefined;
  if (!idsParam) {
    throw new ValidationError('ids query parameter is required');
  }

  const ids = idsParam.split(',').filter(Boolean);
  if (ids.length === 0) {
    throw new ValidationError('At least one id is required');
  }

  const db = req.app.get('db') as Database.Database;
  const users = getUsersByIds(db, ids);

  res.json({ success: true, data: users });
});

router.get('/users/:id', (req, res) => {
  const db = req.app.get('db') as Database.Database;
  const user = getUserById(db, req.params.id);

  res.json({ success: true, data: user });
});

router.get('/users', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const db = req.app.get('db') as Database.Database;
  const result = listUsers(db, page, pageSize);

  res.json({ success: true, data: result });
});

router.patch('/users/:id', (req, res) => {
  const db = req.app.get('db') as Database.Database;
  const user = updateUser(db, req.params.id, req.user!.userId, req.user!.role, req.body);

  res.json({ success: true, data: user });
});

export default router;

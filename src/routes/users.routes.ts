import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { paginationSchema, updateUserSchema, batchIdsSchema } from '../schemas/user.schemas.js';
import { listUsers, getUserById, getUsersByIds, updateUser } from '../services/user.service.js';

const router = Router();

// All user routes require authentication
router.use('/users', requireAuth);

router.get('/users/batch', validateQuery(batchIdsSchema), (req, res) => {
  const ids = (req.query.ids as string).split(',').filter(Boolean);
  const db = req.app.get('db') as Database.Database;
  const users = getUsersByIds(db, ids);

  res.json({ success: true, data: users });
});

router.get('/users/:id', (req, res) => {
  const db = req.app.get('db') as Database.Database;
  const user = getUserById(db, req.params.id);

  res.json({ success: true, data: user });
});

router.get('/users', validateQuery(paginationSchema), (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;

  const db = req.app.get('db') as Database.Database;
  const result = listUsers(db, page, pageSize);

  res.json({ success: true, data: result });
});

router.patch('/users/:id', validateBody(updateUserSchema), (req, res) => {
  const db = req.app.get('db') as Database.Database;
  const user = updateUser(db, req.params.id, req.user!.userId, req.user!.role, req.body);

  res.json({ success: true, data: user });
});

export default router;

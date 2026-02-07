import type Database from 'better-sqlite3';
import type { UserRow, UserResponse } from './auth.service.js';
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware.js';

function toUserResponse(row: UserRow): UserResponse {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PaginatedUsers {
  items: UserResponse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function listUsers(
  db: Database.Database,
  page = 1,
  pageSize = 20,
): PaginatedUsers {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const offset = (safePage - 1) * safePageSize;

  const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(safePageSize, offset) as UserRow[];

  return {
    items: rows.map(toUserResponse),
    total,
    page: safePage,
    pageSize: safePageSize,
    hasMore: offset + rows.length < total,
  };
}

export function getUserById(db: Database.Database, id: string): UserResponse {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  if (!row) {
    throw new NotFoundError('User not found');
  }
  return toUserResponse(row);
}

export function getUsersByIds(db: Database.Database, ids: string[]): UserResponse[] {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM users WHERE id IN (${placeholders})`).all(...ids) as UserRow[];
  return rows.map(toUserResponse);
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string | null;
}

export function updateUser(
  db: Database.Database,
  id: string,
  requesterId: string,
  requesterRole: string,
  data: UpdateUserData,
): UserResponse {
  if (requesterId !== id && requesterRole !== 'admin') {
    throw new ForbiddenError('You can only update your own profile');
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    values.push(data.avatarUrl);
  }

  if (updates.length === 0) {
    return toUserResponse(existing);
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  return toUserResponse(updated);
}

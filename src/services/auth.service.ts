import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import type Database from 'better-sqlite3';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { AppError, AuthError, ValidationError } from '../middleware/error.middleware.js';

const JWT_SECRET = process.env.NEXUS_JWT_SECRET ?? 'nexus-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

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

function generateToken(user: UserRow): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  );
}

export function register(
  db: Database.Database,
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  return (async () => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new ValidationError('Email already registered');
    }

    const id = nanoid();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, email, name, passwordHash, 'member', now, now);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
    const token = generateToken(user);

    return { token, user: toUserResponse(user) };
  })();
}

export function login(
  db: Database.Database,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return (async () => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new AuthError('Invalid email or password');
    }

    const token = generateToken(user);
    return { token, user: toUserResponse(user) };
  })();
}

export function refresh(db: Database.Database, token: string): AuthResponse {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as UserRow | undefined;

    if (!user) {
      throw new AuthError('User not found');
    }

    const newToken = generateToken(user);
    return { token: newToken, user: toUserResponse(user) };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AuthError('Invalid or expired token');
  }
}

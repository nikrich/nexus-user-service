import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from './error.middleware.js';

const JWT_SECRET = process.env.NEXUS_JWT_SECRET ?? 'nexus-dev-secret-change-in-production';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header');
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

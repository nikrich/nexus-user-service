# Nexus User Service

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-black?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

User authentication and profile management service for the **Nexus** platform. Handles registration, login, JWT tokens, and user CRUD operations.

## Features

- **Authentication** — Register, login, and JWT token refresh
- **User Management** — List, get, batch fetch, and update user profiles
- **Authorization** — Self-edit or admin-only for profile updates
- **Password Security** — bcrypt hashing
- **Zod Validation** — Input validation on all endpoints

## Quick Start

```bash
npm install
npm run dev    # Start with hot reload on port 3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with tsx watch |
| `npm run build` | Build with tsup |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Type-check |

## API Endpoints

### Authentication (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/refresh` | Refresh JWT token |

### Users (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List users (paginated) |
| `GET` | `/users/:id` | Get user by ID |
| `GET` | `/users/batch?ids=a,b,c` | Batch fetch users |
| `PATCH` | `/users/:id` | Update profile (self or admin) |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Service port |
| `NEXUS_JWT_SECRET` | `nexus-dev-secret-change-in-production` | JWT signing secret |
| `DATABASE_PATH` | `./data/users.db` | SQLite database path |

## Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Project Structure

```
src/
├── index.ts              # Entry point (port 3001)
├── server.ts             # Express app factory
├── db/
│   ├── schema.ts         # SQLite schema + migrations
│   └── client.ts         # better-sqlite3 connection
├── routes/
│   ├── auth.routes.ts    # Register, login, refresh
│   ├── users.routes.ts   # User CRUD
│   └── health.routes.ts
├── services/
│   ├── auth.service.ts   # Authentication logic
│   └── user.service.ts   # User CRUD operations
├── middleware/
│   ├── auth.middleware.ts # JWT verification
│   └── error.middleware.ts
└── utils/
    └── password.ts       # bcrypt hash/verify
```

## Part of Nexus Platform

| Service | Port | Repository |
|---------|------|------------|
| API Gateway | 3000 | [nexus-api-gateway](https://github.com/nikrich/nexus-api-gateway) |
| Shared Contracts | — | [nexus-shared-contracts](https://github.com/nikrich/nexus-shared-contracts) |
| **User Service** | **3001** | [nexus-user-service](https://github.com/nikrich/nexus-user-service) |
| Content Service | 3002 | [nexus-content-service](https://github.com/nikrich/nexus-content-service) |
| Notification Service | 3003 | [nexus-notification-service](https://github.com/nikrich/nexus-notification-service) |

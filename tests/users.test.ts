import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../src/server.js';
import { initializeSchema } from '../src/db/schema.js';

describe('User endpoints', () => {
  let app: ReturnType<typeof createApp>;
  let db: Database.Database;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    db = new Database(':memory:');
    initializeSchema(db);
    app = createApp({ db });

    // Register a user to get an auth token
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'user1@example.com', password: 'password123', name: 'User One' });

    authToken = res.body.data.token;
    userId = res.body.data.user.id;
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /users', () => {
    it('should return paginated user list', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pageSize).toBe(20);
      expect(res.body.data.hasMore).toBe(false);
    });

    it('should support custom pagination', async () => {
      // Create additional users
      await request(app)
        .post('/auth/register')
        .send({ email: 'user2@example.com', password: 'password123', name: 'User Two' });
      await request(app)
        .post('/auth/register')
        .send({ email: 'user3@example.com', password: 'password123', name: 'User Three' });

      const res = await request(app)
        .get('/users?page=1&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pageSize).toBe(2);
      expect(res.body.data.hasMore).toBe(true);
    });

    it('should return page 2', async () => {
      const res = await request(app)
        .get('/users?page=2&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.page).toBe(2);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/users');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const res = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(userId);
      expect(res.body.data.email).toBe('user1@example.com');
      expect(res.body.data.name).toBe('User One');
      // Should not expose password
      expect(res.body.data.password_hash).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/users/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get(`/users/${userId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/batch', () => {
    it('should return multiple users by ids', async () => {
      // Get all users to find IDs
      const listRes = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      const ids = listRes.body.data.items.map((u: { id: string }) => u.id);

      const res = await request(app)
        .get(`/users/batch?ids=${ids.join(',')}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(ids.length);
    });

    it('should return empty array for non-existent ids', async () => {
      const res = await request(app)
        .get('/users/batch?ids=fake-id-1,fake-id-2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should reject missing ids parameter', async () => {
      const res = await request(app)
        .get('/users/batch')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should update avatar URL', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatarUrl: 'https://example.com/avatar.png' });

      expect(res.status).toBe(200);
      expect(res.body.data.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('should clear avatar URL with null', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatarUrl: null });

      expect(res.status).toBe(200);
      expect(res.body.data.avatarUrl).toBeUndefined();
    });

    it('should reject updating another user as non-admin', async () => {
      // Register another user
      const otherRes = await request(app)
        .post('/auth/register')
        .send({ email: 'other@example.com', password: 'password123', name: 'Other User' });

      const otherId = otherRes.body.data.user.id;

      const res = await request(app)
        .patch(`/users/${otherId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin to update another user', async () => {
      // Make current user an admin directly in DB
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(userId);

      // Re-login to get token with admin role
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'user1@example.com', password: 'password123' });
      const adminToken = loginRes.body.data.token;

      // Get another user
      const listRes = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
      const otherUser = listRes.body.data.items.find((u: { id: string }) => u.id !== userId);

      const res = await request(app)
        .patch(`/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Admin Updated');

      // Restore role
      db.prepare("UPDATE users SET role = 'member' WHERE id = ?").run(userId);
    });

    it('should return 404 for non-existent user', async () => {
      // Make user admin temporarily to avoid 403
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(userId);
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'user1@example.com', password: 'password123' });
      const adminToken = loginRes.body.data.token;

      const res = await request(app)
        .patch('/users/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);

      db.prepare("UPDATE users SET role = 'member' WHERE id = ?").run(userId);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .send({ name: 'Nope' });

      expect(res.status).toBe(401);
    });
  });
});

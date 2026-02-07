import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../src/server.js';
import { initializeSchema } from '../src/db/schema.js';

describe('Health endpoint', () => {
  let app: ReturnType<typeof createApp>;
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    app = createApp({ db });
  });

  afterAll(() => {
    db.close();
  });

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.service).toBe('user-service');
    expect(res.body.data.timestamp).toBeDefined();
  });
});

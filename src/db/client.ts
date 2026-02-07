import Database from 'better-sqlite3';
import { initializeSchema } from './schema.js';

let db: Database.Database | null = null;

export function getDatabase(dbPath?: string): Database.Database {
  if (!db) {
    const path = dbPath ?? process.env.DB_PATH ?? 'nexus-user-service.db';
    db = new Database(path);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

export function createDatabase(dbPath: string): Database.Database {
  const database = new Database(dbPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  initializeSchema(database);
  return database;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

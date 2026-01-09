import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("eatsafe.db");
  }
  return dbPromise;
}

export async function migrateDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS restaurant_cache (
            id INTEGER PRIMARY KEY NOT NULL,
          siret TEXT NOT NULL UNIQUE,
            public_id TEXT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            sanitary_score REAL,
            lat REAL,
            lng REAL,
            details_json TEXT,
            bookmarked INTEGER NOT NULL DEFAULT 0,
            last_viewed_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_restaurant_cache_siret ON restaurant_cache (siret);
        CREATE INDEX IF NOT EXISTS idx_restaurant_cache_last_viewed ON restaurant_cache (last_viewed_at);
        CREATE INDEX IF NOT EXISTS idx_restaurant_cache_bookmarked ON restaurant_cache (bookmarked);

        CREATE TABLE IF NOT EXISTS bookmarks (
          siret TEXT PRIMARY KEY NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS visited (
          siret TEXT PRIMARY KEY NOT NULL,
          visited_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lists (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          UNIQUE(name)
        );

        CREATE TABLE IF NOT EXISTS list_items (
          list_id INTEGER NOT NULL,
          siret TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (list_id, siret),
          FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_list_items_siret ON list_items (siret);
    `);
}

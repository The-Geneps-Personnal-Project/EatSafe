import { getDb, migrateDb } from "./db";

export type SearchHistoryRow = {
  query: string;
  last_used_at: number;
};

export async function addSearchQuery(query: string): Promise<void> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  await migrateDb();
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO search_history (query, last_used_at) VALUES (?, ?)
     ON CONFLICT(query) DO UPDATE SET last_used_at=excluded.last_used_at`,
    [trimmed, now]
  );

  // Keep the table small.
  await db.runAsync(
    `DELETE FROM search_history
      WHERE query NOT IN (
        SELECT query FROM search_history ORDER BY last_used_at DESC LIMIT 25
      )`
  );
}

export async function listSearchQueries(
  limit = 10
): Promise<SearchHistoryRow[]> {
  await migrateDb();
  const db = await getDb();
  const rows = await db.getAllAsync<SearchHistoryRow>(
    `SELECT query, last_used_at
       FROM search_history
      ORDER BY last_used_at DESC
      LIMIT ?`,
    [limit]
  );
  return rows ?? [];
}

export async function clearSearchQueries(): Promise<void> {
  await migrateDb();
  const db = await getDb();
  await db.runAsync(`DELETE FROM search_history`);
}

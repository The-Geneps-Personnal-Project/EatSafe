import { getDb, migrateDb } from "./db";

export async function isBookmarked(siret: string): Promise<boolean> {
  await migrateDb();
  const db = await getDb();
  const row = await db.getFirstAsync<{ siret: string }>(
    `SELECT siret FROM bookmarks WHERE siret = ? LIMIT 1`,
    [siret]
  );
  return Boolean(row?.siret);
}

export async function setBookmarked(
  siret: string,
  bookmarked: boolean
): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();

  if (bookmarked) {
    await db.runAsync(
      `INSERT INTO bookmarks (siret, created_at) VALUES (?, ?)
       ON CONFLICT(siret) DO UPDATE SET created_at=excluded.created_at`,
      [siret, now]
    );
    await db.runAsync(
      `UPDATE restaurant_cache SET bookmarked = 1 WHERE siret = ?`,
      [siret]
    );
  } else {
    await db.runAsync(`DELETE FROM bookmarks WHERE siret = ?`, [siret]);
    await db.runAsync(
      `UPDATE restaurant_cache SET bookmarked = 0, details_json = NULL WHERE siret = ?`,
      [siret]
    );
  }
}

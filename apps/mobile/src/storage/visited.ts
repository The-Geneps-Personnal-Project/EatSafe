import { getDb, migrateDb } from "./db";

export async function isVisited(siret: string): Promise<boolean> {
  await migrateDb();
  const db = await getDb();
  const row = await db.getFirstAsync<{ siret: string }>(
    `SELECT siret FROM visited WHERE siret = ? LIMIT 1`,
    [siret]
  );
  return Boolean(row?.siret);
}

export async function setVisited(
  siret: string,
  visited: boolean
): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();

  if (visited) {
    await db.runAsync(
      `INSERT INTO visited (siret, visited_at) VALUES (?, ?)
       ON CONFLICT(siret) DO UPDATE SET visited_at=excluded.visited_at`,
      [siret, now]
    );
  } else {
    await db.runAsync(`DELETE FROM visited WHERE siret = ?`, [siret]);
  }
}

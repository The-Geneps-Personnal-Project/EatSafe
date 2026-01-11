import { getDb, migrateDb } from "./db";

export type RestaurantNoteRow = {
  siret: string;
  rating: number | null;
  note: string;
  updated_at: number;
};

export async function getRestaurantNote(
  siret: string
): Promise<RestaurantNoteRow | null> {
  await migrateDb();
  const db = await getDb();
  const row = await db.getFirstAsync<RestaurantNoteRow>(
    `SELECT siret, rating, note, updated_at FROM restaurant_notes WHERE siret = ?`,
    [siret]
  );
  return row ?? null;
}

export async function upsertRestaurantNote(
  siret: string,
  rating: number | null,
  note: string
): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO restaurant_notes (siret, rating, note, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(siret) DO UPDATE SET
       rating = excluded.rating,
       note = excluded.note,
       updated_at = excluded.updated_at`,
    [siret, rating, note, now]
  );
}

export async function deleteRestaurantNote(siret: string): Promise<void> {
  await migrateDb();
  const db = await getDb();
  await db.runAsync(`DELETE FROM restaurant_notes WHERE siret = ?`, [siret]);
}

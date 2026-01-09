import { getDb, migrateDb } from "./db";

export type ListRow = {
  id: number;
  name: string;
  created_at: number;
};

export async function createList(name: string): Promise<ListRow> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nom de liste requis.");

  await db.runAsync(
    `INSERT INTO lists (name, created_at) VALUES (?, ?)
     ON CONFLICT(name) DO UPDATE SET name=excluded.name`,
    [trimmed, now]
  );

  const row = await db.getFirstAsync<ListRow>(
    `SELECT id, name, created_at FROM lists WHERE name = ? LIMIT 1`,
    [trimmed]
  );
  if (!row) throw new Error("Impossible de créer la liste.");
  return row;
}

export async function listLists(): Promise<ListRow[]> {
  await migrateDb();
  const db = await getDb();
  const rows = await db.getAllAsync<ListRow>(
    `SELECT id, name, created_at FROM lists ORDER BY created_at DESC`
  );
  return rows ?? [];
}

export async function deleteList(listId: number): Promise<void> {
  await migrateDb();
  const db = await getDb();
  await db.runAsync(`DELETE FROM lists WHERE id = ?`, [listId]);
}

export async function isRestaurantInList(
  listId: number,
  siret: string
): Promise<boolean> {
  await migrateDb();
  const db = await getDb();
  const row = await db.getFirstAsync<{ siret: string }>(
    `SELECT siret FROM list_items WHERE list_id = ? AND siret = ? LIMIT 1`,
    [listId, siret]
  );
  return Boolean(row?.siret);
}

export async function listIdsForRestaurant(siret: string): Promise<number[]> {
  await migrateDb();
  const db = await getDb();
  const rows = await db.getAllAsync<{ list_id: number }>(
    `SELECT list_id FROM list_items WHERE siret = ?`,
    [siret]
  );
  return (rows ?? []).map((r) => r.list_id);
}

export async function addRestaurantToList(
  listId: number,
  siret: string
): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO list_items (list_id, siret, created_at) VALUES (?, ?, ?)
     ON CONFLICT(list_id, siret) DO UPDATE SET created_at=excluded.created_at`,
    [listId, siret, now]
  );

  // Keep list items pinned so they don't expire from cache.
  await db.runAsync(`UPDATE restaurant_cache SET pinned = 1 WHERE siret = ?`, [
    siret,
  ]);
}

export async function removeRestaurantFromList(
  listId: number,
  siret: string
): Promise<void> {
  await migrateDb();
  const db = await getDb();
  await db.runAsync(`DELETE FROM list_items WHERE list_id = ? AND siret = ?`, [
    listId,
    siret,
  ]);

  // If the restaurant is no longer in any list and not bookmarked, unpin it.
  await db.runAsync(
    `UPDATE restaurant_cache
        SET pinned = CASE
            WHEN bookmarked = 1 OR EXISTS(SELECT 1 FROM list_items WHERE siret = ? LIMIT 1) THEN 1
            ELSE 0
        END,
        details_json = CASE
            WHEN bookmarked = 1 OR EXISTS(SELECT 1 FROM list_items WHERE siret = ? LIMIT 1) THEN details_json
            ELSE NULL
        END
      WHERE siret = ?`,
    [siret, siret, siret]
  );
}

export type ListItemRow = {
  siret: string;
  name: string;
  address: string;
  city: string;
  sanitary_score: number | null;
  created_at: number;
};

export async function listRestaurantsInList(
  listId: number
): Promise<ListItemRow[]> {
  await migrateDb();
  const db = await getDb();
  const rows = await db.getAllAsync<ListItemRow>(
    `SELECT li.siret as siret,
            COALESCE(rc.name, '') as name,
            COALESCE(rc.address, '') as address,
            COALESCE(rc.city, '') as city,
            rc.sanitary_score as sanitary_score,
            li.created_at as created_at
     FROM list_items li
     LEFT JOIN restaurant_cache rc ON rc.siret = li.siret
     WHERE li.list_id = ?
     ORDER BY li.created_at DESC`,
    [listId]
  );
  return (rows ?? []).filter((r) => r.siret);
}

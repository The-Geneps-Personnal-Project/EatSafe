import { getDb, migrateDb } from "./db";

export type PinnedTargetRow = {
  siret: string;
  bookmarked: 0 | 1;
};

export async function listPinnedTargets(): Promise<PinnedTargetRow[]> {
  await migrateDb();
  const db = await getDb();

  const rows = await db.getAllAsync<PinnedTargetRow>(
    `SELECT s.siret as siret,
            COALESCE(rc.bookmarked, 0) as bookmarked
       FROM (
              SELECT siret FROM bookmarks
              UNION
              SELECT siret FROM list_items
            ) s
       LEFT JOIN restaurant_cache rc ON rc.siret = s.siret`
  );

  return (rows ?? []).filter((r) => r.siret);
}

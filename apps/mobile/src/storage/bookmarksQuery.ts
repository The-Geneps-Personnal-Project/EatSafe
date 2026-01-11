import { getDb, migrateDb } from "./db";

export type BookmarkedRow = {
  siret: string;
  name: string;
  address: string;
  city: string;
  sanitary_score: number | null;
  note_rating: number | null;
  note_text: string | null;
  created_at: number;
};

export async function listBookmarkedRestaurants(): Promise<BookmarkedRow[]> {
  await migrateDb();
  const db = await getDb();

  const rows = await db.getAllAsync<BookmarkedRow>(
    `SELECT b.siret as siret,
            COALESCE(rc.name, '') as name,
            COALESCE(rc.address, '') as address,
            COALESCE(rc.city, '') as city,
            rc.sanitary_score as sanitary_score,
          rn.rating as note_rating,
          rn.note as note_text,
            b.created_at as created_at
     FROM bookmarks b
     LEFT JOIN restaurant_cache rc ON rc.siret = b.siret
      LEFT JOIN restaurant_notes rn ON rn.siret = b.siret
     ORDER BY b.created_at DESC`
  );

  // Filter out any weird empty rows.
  return (rows ?? []).filter((r) => r.siret);
}

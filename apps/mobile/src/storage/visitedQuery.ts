import { getDb, migrateDb } from "./db";

export type VisitedRow = {
  siret: string;
  name: string;
  address: string;
  city: string;
  sanitary_score: number | null;
  note_rating: number | null;
  note_text: string | null;
  visited_at: number;
};

export async function listVisitedRestaurants(): Promise<VisitedRow[]> {
  await migrateDb();
  const db = await getDb();

  const rows = await db.getAllAsync<VisitedRow>(
    `SELECT v.siret as siret,
            COALESCE(rc.name, '') as name,
            COALESCE(rc.address, '') as address,
            COALESCE(rc.city, '') as city,
            rc.sanitary_score as sanitary_score,
          rn.rating as note_rating,
          rn.note as note_text,
            v.visited_at as visited_at
     FROM visited v
     LEFT JOIN restaurant_cache rc ON rc.siret = v.siret
      LEFT JOIN restaurant_notes rn ON rn.siret = v.siret
     ORDER BY v.visited_at DESC`
  );

  return (rows ?? []).filter((r) => r.siret);
}

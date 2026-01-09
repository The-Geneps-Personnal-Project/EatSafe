import type { Restaurant, RestaurantDetails } from "../types/restaurant";
import { getDb, migrateDb } from "./db";

const TTL_MS = 14 * 24 * 60 * 60 * 1000;

export async function upsertMinimal(r: Restaurant): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO restaurant_cache (siret, public_id, name, address, city, sanitary_score, lat, lng, details_json, bookmarked, last_viewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)
         ON CONFLICT(siret) DO UPDATE SET
           public_id=excluded.public_id,
           name=excluded.name,
           address=excluded.address,
           city=excluded.city,
           sanitary_score=excluded.sanitary_score,
           lat=excluded.lat,
           lng=excluded.lng,
           last_viewed_at=excluded.last_viewed_at
        `,
    [
      r.siret,
      r.public_id ?? null,
      r.name,
      r.address,
      r.city,
      r.sanitary_score ?? null,
      r.lat ?? null,
      r.lng ?? null,
      now,
    ]
  );

  await evictExpired();
}

export async function upsertFullForBookmark(
  r: RestaurantDetails,
  bookmarked: boolean
): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const now = Date.now();

  const detailsJson = bookmarked ? JSON.stringify(r) : null;

  await db.runAsync(
    `INSERT INTO restaurant_cache (siret, public_id, name, address, city, sanitary_score, lat, lng, details_json, bookmarked, last_viewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(siret) DO UPDATE SET
           public_id=excluded.public_id,
           name=excluded.name,
           address=excluded.address,
           city=excluded.city,
           sanitary_score=excluded.sanitary_score,
           lat=excluded.lat,
           lng=excluded.lng,
           details_json=excluded.details_json,
           bookmarked=excluded.bookmarked,
           last_viewed_at=excluded.last_viewed_at
        `,
    [
      r.siret,
      r.public_id ?? null,
      r.name,
      r.address,
      r.city,
      r.sanitary_score ?? null,
      r.lat ?? null,
      r.lng ?? null,
      detailsJson,
      bookmarked ? 1 : 0,
      now,
    ]
  );

  await evictExpired();
}

export async function loadCachedDetailsBySiret(
  siret: string
): Promise<RestaurantDetails | null> {
  await migrateDb();
  const db = await getDb();
  const row = await db.getFirstAsync<{ details_json: string | null }>(
    `SELECT details_json FROM restaurant_cache WHERE siret = ? LIMIT 1`,
    [siret]
  );
  if (!row?.details_json) return null;

  try {
    return JSON.parse(row.details_json) as RestaurantDetails;
  } catch {
    return null;
  }
}

export type CachedMinimalRestaurant = {
  siret: string;
  public_id: string | null;
  name: string;
  address: string;
  city: string;
  sanitary_score: number | null;
  lat: number | null;
  lng: number | null;
  bookmarked: 0 | 1;
  last_viewed_at: number;
};

export async function loadCachedMinimalBySiret(
  siret: string
): Promise<CachedMinimalRestaurant | null> {
  await migrateDb();
  const db = await getDb();
  const row = await db.getFirstAsync<CachedMinimalRestaurant>(
    `SELECT siret, public_id, name, address, city, sanitary_score, lat, lng, bookmarked, last_viewed_at
     FROM restaurant_cache WHERE siret = ? LIMIT 1`,
    [siret]
  );
  return row ?? null;
}

export async function evictExpired(): Promise<void> {
  await migrateDb();
  const db = await getDb();
  const cutoff = Date.now() - TTL_MS;
  await db.runAsync(
    `DELETE FROM restaurant_cache WHERE bookmarked = 0 AND last_viewed_at < ?`,
    [cutoff]
  );
}

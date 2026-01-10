import { mockDetailsBySiret, mockRestaurants } from "./mockData";
import { addRestaurantToList, createList } from "../storage/lists";
import { setBookmarked } from "../storage/bookmarks";
import { setVisited } from "../storage/visited";
import { upsertMinimal, upsertFullForPinned } from "../storage/restaurantCache";
import { addSearchQuery } from "../storage/searchHistory";
import { getDb, migrateDb } from "../storage/db";
import { resetLocalData } from "../storage/debugReset";

export async function seedDemoData(): Promise<void> {
  // Start from a clean state to make the seed deterministic.
  await resetLocalData();

  const now = Date.now();

  const pick = (idx: number) => mockRestaurants[idx % mockRestaurants.length]!;

  // 1) Cache minimal for map/recents/offline search.
  for (const r of mockRestaurants) {
    await upsertMinimal(r);
  }

  // 2) Create a few lists and fill them (pins items).
  const listA = await createList("À tester");
  const listB = await createList("Brunch");
  const listC = await createList("Veggie");
  const listD = await createList("Top");

  const listPlans: Array<{ listId: number; indices: number[] }> = [
    { listId: listA.id, indices: [0, 1, 2, 3, 4] },
    { listId: listB.id, indices: [0, 5, 6] },
    { listId: listC.id, indices: [7, 8] },
    { listId: listD.id, indices: [2, 9] },
  ];

  const pinnedSirets = new Set<string>();
  for (const plan of listPlans) {
    for (const idx of plan.indices) {
      const r = pick(idx);
      pinnedSirets.add(r.siret);
      await addRestaurantToList(plan.listId, r.siret);
    }
  }

  // 3) Bookmark a few (also pins + should have full details offline).
  const bookmarkedIdx = [2, 5, 8, 9];
  for (const idx of bookmarkedIdx) {
    const r = pick(idx);
    pinnedSirets.add(r.siret);
    await setBookmarked(r.siret, true);
  }

  // 4) Ensure full details exist for all pinned targets.
  for (const siret of pinnedSirets) {
    const details = mockDetailsBySiret[siret];
    if (!details) continue;
    const isBookmarked = bookmarkedIdx.some((i) => pick(i).siret === siret);
    await upsertFullForPinned(details, {
      bookmarked: isBookmarked,
      pinned: true,
    });
  }

  // 5) Visited markers.
  for (const idx of [1, 4, 6, 9]) {
    await setVisited(pick(idx).siret, true);
  }

  // 6) Search history: helps test search suggestions UI.
  for (const q of ["Paris", "Brunch", "Sushi", "Lyon", "Marseille", "Café"]) {
    await addSearchQuery(q);
  }

  // 7) Spread timestamps so ordering feels realistic (recents / lists / bookmarks).
  await migrateDb();
  const db = await getDb();

  for (let i = 0; i < mockRestaurants.length; i++) {
    const r = mockRestaurants[i]!;
    const viewedAt = now - i * 45 * 60 * 1000; // 45min steps
    await db.runAsync(
      `UPDATE restaurant_cache SET last_viewed_at = ? WHERE siret = ?`,
      [viewedAt, r.siret]
    );
  }

  // Lists ordering
  for (let i = 0; i < listPlans.length; i++) {
    const plan = listPlans[i]!;
    for (let j = 0; j < plan.indices.length; j++) {
      const r = pick(plan.indices[j]!);
      const createdAt = now - (i * 24 + j) * 60 * 60 * 1000; // hours steps
      await db.runAsync(
        `UPDATE list_items SET created_at = ? WHERE list_id = ? AND siret = ?`,
        [createdAt, plan.listId, r.siret]
      );
    }
  }

  // Bookmarks ordering
  for (let i = 0; i < bookmarkedIdx.length; i++) {
    const r = pick(bookmarkedIdx[i]!);
    const createdAt = now - i * 6 * 60 * 60 * 1000;
    await db.runAsync(`UPDATE bookmarks SET created_at = ? WHERE siret = ?`, [
      createdAt,
      r.siret,
    ]);
  }

  // Visited ordering
  for (let i = 0; i < [1, 4, 6, 9].length; i++) {
    const r = pick([1, 4, 6, 9][i]!);
    const visitedAt = now - i * 12 * 60 * 60 * 1000;
    await db.runAsync(`UPDATE visited SET visited_at = ? WHERE siret = ?`, [
      visitedAt,
      r.siret,
    ]);
  }
}

import { getDb, migrateDb } from "./db";

export async function resetLocalData(): Promise<void> {
  await migrateDb();
  const db = await getDb();

  // Order matters because of FK on list_items.
  await db.runAsync(`DELETE FROM list_items`);
  await db.runAsync(`DELETE FROM lists`);
  await db.runAsync(`DELETE FROM visited`);
  await db.runAsync(`DELETE FROM bookmarks`);
  await db.runAsync(`DELETE FROM search_history`);
  await db.runAsync(`DELETE FROM restaurant_cache`);
}

import { mockDetailsBySiret, mockRestaurants } from "./mockData";
import { addRestaurantToList, createList } from "../storage/lists";
import { setBookmarked } from "../storage/bookmarks";
import { setVisited } from "../storage/visited";
import { upsertMinimal, upsertFullForPinned } from "../storage/restaurantCache";

export async function seedDemoData(): Promise<void> {
  // Ensure cache has coordinates for map.
  for (const r of mockRestaurants) {
    await upsertMinimal(r);
  }

  const listA = await createList("À tester");
  const listB = await createList("Brunch");

  const pick = (idx: number) => mockRestaurants[idx % mockRestaurants.length]!;

  // Put some items in lists (pins them).
  for (const idx of [0, 1, 2, 3]) {
    await addRestaurantToList(listA.id, pick(idx).siret);
    await upsertFullForPinned(mockDetailsBySiret[pick(idx).siret]!, {
      bookmarked: false,
      pinned: true,
    });
  }
  for (const idx of [4, 5, 6]) {
    await addRestaurantToList(listB.id, pick(idx).siret);
    await upsertFullForPinned(mockDetailsBySiret[pick(idx).siret]!, {
      bookmarked: false,
      pinned: true,
    });
  }

  // Bookmark a few (pins + store full details for offline).
  for (const idx of [2, 7, 8]) {
    const r = pick(idx);
    await setBookmarked(r.siret, true);
    await upsertFullForPinned(mockDetailsBySiret[r.siret]!, {
      bookmarked: true,
      pinned: true,
    });
  }

  // Visited markers.
  for (const idx of [1, 5]) {
    await setVisited(pick(idx).siret, true);
  }
}

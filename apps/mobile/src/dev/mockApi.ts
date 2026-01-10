import type { Restaurant, RestaurantDetails } from "../types/restaurant";
import { getDevMockApiEnabled } from "../features/dev/devPrefs";
import {
  mockDetailsBySiret,
  mockPublicIdToSiret,
  mockRestaurants,
} from "./mockData";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export async function shouldUseMockApi(): Promise<boolean> {
  return __DEV__ ? await getDevMockApiEnabled() : false;
}

export async function mockSearchRestaurants(
  query: string
): Promise<Restaurant[]> {
  const q = normalize(query);
  const items = mockRestaurants.filter((r) => {
    const hay = `${r.name} ${r.address} ${r.city}`.toLowerCase();
    return hay.includes(q);
  });
  return items;
}

export async function mockFetchRestaurantsByCity(
  city: string
): Promise<Restaurant[]> {
  const q = normalize(city);
  return mockRestaurants.filter((r) => normalize(r.city) === q);
}

export async function mockFetchRestaurantDetailBySiret(
  siret: string
): Promise<RestaurantDetails> {
  const d = mockDetailsBySiret[siret];
  if (!d) throw new Error("Restaurant introuvable (mock)");
  return d;
}

export async function mockFetchRestaurantDetailByPublicId(
  publicId: string
): Promise<RestaurantDetails> {
  const siret = mockPublicIdToSiret[publicId];
  if (!siret) throw new Error("Restaurant introuvable (mock)");
  return await mockFetchRestaurantDetailBySiret(siret);
}

export async function mockEnsurePublicIdForSiret(
  siret: string
): Promise<string> {
  const r = mockRestaurants.find((x) => x.siret === siret);
  if (!r) throw new Error("publicId introuvable (mock)");
  return r.public_id;
}

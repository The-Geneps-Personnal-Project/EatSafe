import type { Restaurant, RestaurantDetails } from "../types/restaurant";
import {
  mockCities,
  mockDetailsBySiret,
  mockPublicIdToSiret,
  mockRestaurants,
} from "./mockData";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export async function shouldUseMockApi(): Promise<boolean> {
  // In dev we force mock everywhere to avoid API hangs/timeouts.
  return __DEV__ ? true : false;
}

export async function mockSearchCities(query: string) {
  const q = normalize(query);
  return mockCities
    .filter(
      (c) => normalize(c.city).includes(q) || normalize(c.label).includes(q)
    )
    .slice(0, 5);
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

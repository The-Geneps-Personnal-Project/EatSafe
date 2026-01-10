import { http } from "./http";
import type { Restaurant, RestaurantDetails } from "../types/restaurant";
import {
  mockFetchRestaurantDetailByPublicId,
  mockFetchRestaurantDetailBySiret,
  mockFetchRestaurantsByCity,
  mockSearchRestaurants,
  shouldUseMockApi,
} from "../dev/mockApi";

export async function searchRestaurants(query: string): Promise<Restaurant[]> {
  if (await shouldUseMockApi()) return await mockSearchRestaurants(query);
  const q = encodeURIComponent(query);
  return await http.get<Restaurant[]>(`/restaurants/search?q=${q}`);
}

export async function fetchRestaurantDetailBySiret(
  siret: string
): Promise<RestaurantDetails> {
  if (await shouldUseMockApi())
    return await mockFetchRestaurantDetailBySiret(siret);
  const q = encodeURIComponent(siret);
  return await http.get<RestaurantDetails>(`/restaurants/detail?siret=${q}`);
}

export async function fetchRestaurantDetailByPublicId(
  publicId: string
): Promise<RestaurantDetails> {
  if (await shouldUseMockApi())
    return await mockFetchRestaurantDetailByPublicId(publicId);
  const q = encodeURIComponent(publicId);
  return await http.get<RestaurantDetails>(`/restaurants/public/${q}`);
}

export async function fetchRestaurantsByCity(
  city: string
): Promise<Restaurant[]> {
  if (await shouldUseMockApi()) return await mockFetchRestaurantsByCity(city);
  const q = encodeURIComponent(city);
  return await http.get<Restaurant[]>(`/restaurants?city=${q}`);
}

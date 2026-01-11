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
  try {
    return await http.get<Restaurant[]>(`/restaurants/search?q=${q}`);
  } catch (e) {
    if (await shouldUseMockApi()) return await mockSearchRestaurants(query);
    throw e;
  }
}

export async function fetchRestaurantDetailBySiret(
  siret: string
): Promise<RestaurantDetails> {
  if (await shouldUseMockApi())
    return await mockFetchRestaurantDetailBySiret(siret);
  const q = encodeURIComponent(siret);
  try {
    return await http.get<RestaurantDetails>(`/restaurants/detail?siret=${q}`);
  } catch (e) {
    if (await shouldUseMockApi())
      return await mockFetchRestaurantDetailBySiret(siret);
    throw e;
  }
}

export async function fetchRestaurantDetailByPublicId(
  publicId: string
): Promise<RestaurantDetails> {
  if (await shouldUseMockApi())
    return await mockFetchRestaurantDetailByPublicId(publicId);
  const q = encodeURIComponent(publicId);
  try {
    return await http.get<RestaurantDetails>(`/restaurants/public/${q}`);
  } catch (e) {
    if (await shouldUseMockApi())
      return await mockFetchRestaurantDetailByPublicId(publicId);
    throw e;
  }
}

export async function fetchRestaurantsByCity(
  city: string
): Promise<Restaurant[]> {
  if (await shouldUseMockApi()) return await mockFetchRestaurantsByCity(city);
  const q = encodeURIComponent(city);
  try {
    return await http.get<Restaurant[]>(`/restaurants?city=${q}`);
  } catch (e) {
    if (await shouldUseMockApi()) return await mockFetchRestaurantsByCity(city);
    throw e;
  }
}

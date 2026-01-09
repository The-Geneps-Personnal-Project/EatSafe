import { http } from "./http";
import type { Restaurant, RestaurantDetails } from "../types/restaurant";

export async function searchRestaurants(query: string): Promise<Restaurant[]> {
  const q = encodeURIComponent(query);
  return await http.get<Restaurant[]>(`/restaurants/search?q=${q}`);
}

export async function fetchRestaurantDetailBySiret(
  siret: string
): Promise<RestaurantDetails> {
  const q = encodeURIComponent(siret);
  return await http.get<RestaurantDetails>(`/restaurants/detail?siret=${q}`);
}

export async function fetchRestaurantDetailByPublicId(
  publicId: string
): Promise<RestaurantDetails> {
  const q = encodeURIComponent(publicId);
  return await http.get<RestaurantDetails>(`/restaurants/public/${q}`);
}

export async function fetchRestaurantsByCity(
  city: string
): Promise<Restaurant[]> {
  const q = encodeURIComponent(city);
  return await http.get<Restaurant[]>(`/restaurants?city=${q}`);
}

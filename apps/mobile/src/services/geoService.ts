import { http } from "./http";
import type { CityHit } from "../types/city";

export async function searchCities(query: string): Promise<CityHit[]> {
  const q = encodeURIComponent(query);
  return await http.get<CityHit[]>(`/geo/cities?q=${q}`);
}

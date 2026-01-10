import { http } from "./http";
import type { CityHit } from "../types/city";
import { mockSearchCities, shouldUseMockApi } from "../dev/mockApi";

export async function searchCities(query: string): Promise<CityHit[]> {
  if (await shouldUseMockApi()) return await mockSearchCities(query);
  const q = encodeURIComponent(query);
  return await http.get<CityHit[]>(`/geo/cities?q=${q}`);
}

import axiosInstance from "@services/axiosInstance";
import { Recommendation, RecommendationsResponse } from "@schemas/recommendation";
import type { RecommendationQuery } from "@schemas/recommendation";

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const k of Object.keys(obj)) {
        const v = obj[k as keyof T];
        if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) {
            out[k as keyof T] = v as any;
        }
    }
    return out;
}

export async function fetchRecommendations(
    q: RecommendationQuery,
    signal?: AbortSignal
): Promise<Recommendation[]> {
    const body = clean({
        cuisine: Array.isArray(q.cuisine) ? q.cuisine : undefined,
        location: clean({ lat: q.lat, lng: q.lng, radius: q.radius }),
        hygiene_threshold: q.min_local_score,
        price_ranges: q.price_ranges,
        wheelchair: q.wheelchair,
        open_now: q.open_now,
        limit: q.limit
    });

    const res = await axiosInstance.post<RecommendationsResponse | Recommendation[]>(
        "/restaurants/recommendations",
        body,
        { signal }
    );
    return Array.isArray(res.data) ? res.data : res.data.results;
}
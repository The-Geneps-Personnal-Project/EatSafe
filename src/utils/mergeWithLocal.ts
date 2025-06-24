import { Restaurant } from "@schemas/restaurant";
import { mockRestaurants } from "./mockRestaurants";

export function mergeWithLocal(place: Partial<Restaurant>): Restaurant {
    const localMatch = mockRestaurants.find((local) => {
        const sameName = local.name.toLowerCase() === place.name?.toLowerCase();
        const closeEnough = Math.hypot(local.lat - (place.lat ?? 0), local.lng - (place.lng ?? 0)) < 0.01; // ~1km
        return sameName || closeEnough;
    });

    return {
        id: place.id ?? localMatch?.id ?? "unknown",
        name: place.name ?? localMatch?.name ?? "Unknown",
        lat: place.lat ?? localMatch?.lat ?? 0,
        lng: place.lng ?? localMatch?.lng ?? 0,
        local_rating: localMatch?.local_rating ?? 1,
        google_rating: place.google_rating ?? undefined,
        address: place.address,
        photos: place.photos,
        reviews: place.reviews,
        source: localMatch ? "merged" : "google"
    };
}
import { Restaurant } from "@schemas/restaurant";

export function mergeWithLocalIfPossible(
    localRestaurants: Restaurant[],
    googlePlace: Partial<Restaurant> & { lat: number; lng: number; name: string }
): Restaurant {
    const normalized = (str: string) =>
        str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const targetName = normalized(googlePlace.name);
    const targetLat = googlePlace.lat;
    const targetLng = googlePlace.lng;

    const isClose = (r: Restaurant) =>
        Math.abs(r.lat - targetLat) < 0.001 && Math.abs(r.lng - targetLng) < 0.001;

    const bestMatch = localRestaurants.find((r) =>
        isClose(r) && normalized(r.name).includes(targetName)
    );

    if (bestMatch) {
        return {
            ...bestMatch,
            google_rating: googlePlace.google_rating,
            photos: googlePlace.photos ?? [],
            reviews: googlePlace.reviews ?? [],
            address: googlePlace.address ?? bestMatch.address
        };
    }

    const isFrance = targetLat >= 41 && targetLat <= 51 && targetLng >= -5 && targetLng <= 9;

    if (!isFrance) {
        console.warn("Discarded fallback outside France:", googlePlace);
    }

    return {
        id: "google-place",
        name: googlePlace.name,
        lat: targetLat,
        lng: targetLng,
        address: googlePlace.address ?? "",
        google_rating: googlePlace.google_rating,
        photos: googlePlace.photos ?? [],
        reviews: googlePlace.reviews ?? [],
        local_rating: 1,
    };
}
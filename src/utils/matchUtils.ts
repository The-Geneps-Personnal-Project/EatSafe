import { Restaurant } from "@schemas/restaurant";

export function mergeWithLocalIfPossible(
    localRestaurants: Restaurant[],
    googlePlace: Partial<Restaurant> & { lat: number; lng: number; name: string; address?: string }
): Restaurant {
    const normalize = (str: string): string =>
        str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const extractPostalOrCity = (addr?: string): string | null => {
        if (!addr) return null;
        const match = addr.match(/\b(0[1-9]|[1-8][0-9]|9[0-5]|97[1-6])\d{2}\b/);
        if (match) return match[0];
        const parts = addr.split(",");
        return parts[parts.length - 2]?.trim().toLowerCase() || null;
    };

    const targetLat = googlePlace.lat;
    const targetLng = googlePlace.lng;
    const targetName = normalize(googlePlace.name);
    const targetCity = extractPostalOrCity(googlePlace.address);

    const isClose = (r: Restaurant) =>
        Math.abs(r.lat - targetLat) < 0.001 &&
        Math.abs(r.lng - targetLng) < 0.001;

    const bestMatch = localRestaurants.find((r) => {
        const localName = normalize(r.name);
        const localCity = extractPostalOrCity(r.address);

        return (
            isClose(r) &&
            localName.includes(targetName) &&
            (!targetCity || !localCity || targetCity === localCity)
        );
    });

    if (bestMatch) {
        return {
            ...bestMatch,
            google_rating: googlePlace.google_rating,
            reviews: googlePlace.reviews,
            photos: googlePlace.photos,
            address: googlePlace.address || bestMatch.address
        };
    }

    return {
        id: "google-place",
        name: googlePlace.name,
        lat: targetLat,
        lng: targetLng,
        address: googlePlace.address ?? "",
        city: targetCity || "Inconnu",
        local_rating: 1,
        google_rating: googlePlace.google_rating,
        user_ratings_total: googlePlace.user_ratings_total,
        photos: googlePlace.photos ?? [],
        reviews: googlePlace.reviews ?? [],
        opening_hours: googlePlace.opening_hours,
        price_level: googlePlace.price_level,
    };
}
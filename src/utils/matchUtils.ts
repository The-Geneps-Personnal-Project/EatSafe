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
        local_rating: 1,
    };
}

export const getPlaceDetailsByTextSearch = (
    query: string,
    lat: number,
    lng: number
): Promise<google.maps.places.PlaceResult | null> => {
    return new Promise((resolve) => {
        const textService = new google.maps.places.PlacesService(document.createElement("div"));

        textService.textSearch(
            {
                query,
                location: new google.maps.LatLng(lat, lng),
                radius: 300
            },
            (results, status) => {
                if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    results &&
                    results.length > 0
                ) {
                    const placeId = results[0].place_id;
                    if (!placeId) {
                        resolve(null);
                        return;
                    }
                    const detailService = new google.maps.places.PlacesService(document.createElement("div"));
                    detailService.getDetails(
                        {
                            placeId,
                            fields: ["name", "rating", "formatted_address", "geometry", "photos"]
                        },
                        (place, status) => {
                            if (
                                status === google.maps.places.PlacesServiceStatus.OK &&
                                place
                            ) {
                                resolve(place);
                            } else {
                                resolve(null);
                            }
                        }
                    );
                } else {
                    resolve(null);
                }
            }
        );
    });
};

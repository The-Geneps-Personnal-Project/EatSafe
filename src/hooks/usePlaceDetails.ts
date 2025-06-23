import { useCallback } from "react";

export const usePlaceDetails = () => {
    const fetchPlaceDetails = useCallback((placeId: string): Promise<google.maps.places.PlaceResult | null> => {
        return new Promise((resolve, reject) => {
            if (!window.google) {
                reject("Google Maps JS SDK not loaded");
                return;
            }

            const service = new window.google.maps.places.PlacesService(document.createElement("div"));
            service.getDetails(
                {
                    placeId,
                    fields: ["name", "geometry", "rating", "formatted_address", "photos", "types"]
                },
                (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                        resolve(place);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }, []);

    return { fetchPlaceDetails };
};

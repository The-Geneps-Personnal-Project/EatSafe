import { useRef } from "react";

export const usePlaceDetails = () => {
    const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

    const setMapElement = (map: google.maps.Map) => {
        serviceRef.current = new google.maps.places.PlacesService(map);
    };

    const getPlaceDetails = (placeId: string): Promise<google.maps.places.PlaceResult | null> => {
        return new Promise((resolve) => {
            if (!serviceRef.current) return resolve(null);

            serviceRef.current.getDetails(
                {
                    placeId,
                    fields: ["name", "geometry", "rating", "formatted_address", "photos", "types", "place_id"]
                },
                (place, status) => {
                    if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
                        return resolve(null);
                    }
                    resolve(place);
                }
            );
        });
    };

    return { setMapElement, getPlaceDetails };
};

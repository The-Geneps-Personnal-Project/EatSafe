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
                    fields: [
                        "name",
                        "geometry",
                        "rating",
                        "formatted_address",
                        "photos",
                        "types",
                        "place_id",
                        "reviews",
                        "user_ratings_total",
                        "opening_hours",
                        "price_level",
                    ]
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

    const getPlaceDetailsByTextSearch = (
        query: string,
        lat: number,
        lng: number,
        city: string
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
                        const placeId = results.filter(r => r.formatted_address?.includes(city))[0].place_id;
                        if (!placeId) return resolve(null);

                        getPlaceDetails(placeId).then(resolve).catch(() => resolve(null));
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    };

    return {
        setMapElement,
        getPlaceDetails,
        getPlaceDetailsByTextSearch
    };
};
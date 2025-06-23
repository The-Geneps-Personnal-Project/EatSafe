// src/hooks/useMapHandlers.ts
import { useRef, useState } from "react";
import type { Restaurant } from "@schemas/restaurant";
import { usePlaceDetails } from "@hooks/usePlaceDetails";

export const useMapHandlers = () => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const { setMapElement, getPlaceDetails } = usePlaceDetails();
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    const handleSelect = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        if (mapRef.current) {
            mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
            mapRef.current.setZoom(16);
        }
    };

    const handleFallbackSearch = async (placeId: string) => {
        try {
            const place = await getPlaceDetails(placeId);
            if (place && place.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setSelectedRestaurant({
                    id: "google-place",
                    name: place.name || placeId,
                    lat,
                    lng,
                    local_rating: [1, 2, 3, 4].includes(Math.round(place.rating || 1))
                        ? (Math.round(place.rating || 1) as 1 | 2 | 3 | 4)
                        : 1,
                    google_rating: place.rating
                });

                mapRef.current?.panTo({ lat, lng });
                mapRef.current?.setZoom(16);
            }
        } catch (e) {
            console.error("Failed to fetch place details", e);
        }
    };

    return {
        mapRef,
        setMapElement,
        selectedRestaurant,
        setSelectedRestaurant,
        handleSelect,
        handleFallbackSearch
    };
};

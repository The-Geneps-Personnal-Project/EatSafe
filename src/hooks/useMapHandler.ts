// src/hooks/useMapHandlers.ts
import { useRef, useState } from "react";
import type { Restaurant } from "@schemas/restaurant";
import { usePlaceDetails } from "@hooks/usePlaceDetails";
import { mergeWithLocal } from "@/utils/mergeWithLocal";

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

                const enriched = mergeWithLocal({
                    id: place.place_id ?? "google-place",
                    name: place.name ?? placeId,
                    lat,
                    lng,
                    google_rating: place.rating,
                    address: place.formatted_address,
                    photos: place.photos
                });

                setSelectedRestaurant(enriched);

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

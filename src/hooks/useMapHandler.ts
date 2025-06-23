import { useRef, useState } from "react";
import { getPlaceDetailsByTextSearch, mergeWithLocalIfPossible } from "@utils/matchUtils";
import type { Restaurant } from "@schemas/restaurant";
import { usePlaceDetails } from "@hooks/usePlaceDetails";
import { useRestaurantsData } from "./useRestaurantsData";

export const useMapHandlers = () => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const { getPlaceDetails, setMapElement } = usePlaceDetails();
    const { restaurants } = useRestaurantsData();

    const handleSelect = async (restaurant: Restaurant, zoom?: number) => {
            let enriched = restaurant;

        if (!restaurant.google_rating && !restaurant.photos) {
            try {
                const place = await getPlaceDetailsByTextSearch(restaurant.name, restaurant.lat, restaurant.lng);
                if (place) {
                    enriched = {
                        ...restaurant,
                        google_rating: place.rating,
                        photos: place.photos,
                        address: place.formatted_address || restaurant.address
                    };
                }
            } catch (e) {
                console.warn("No matching Google place found for:", restaurant.name);
            }
        }

        setSelectedRestaurant(enriched);
        if (mapRef.current && !(zoom! >= 16)) {
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

                const merged = mergeWithLocalIfPossible(restaurants, {
                    lat,
                    lng,
                    name: place.name || "Inconnu",
                    google_rating: place.rating,
                    reviews: place.reviews,
                    address: place.formatted_address,
                    photos: place.photos
                });

                setSelectedRestaurant(merged);

                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(16);
                }
            }
        } catch (e) {
            console.error("Fallback search error", e);
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
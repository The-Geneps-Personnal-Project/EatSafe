import { useRef, useState } from "react";
import type { Restaurant } from "@schemas/restaurant";
import { fetchRestaurantDetail, fetchRestaurantDetailByName } from "@services/restaurantService";

export const useMapHandlers = () => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    const handleSelect = async (restaurant: Restaurant) => {
        try {
            const data = await fetchRestaurantDetail(restaurant.siret);
            setSelectedRestaurant(data);
        } catch (e) {
            console.error("Failed to fetch restaurant detail", e);
            setSelectedRestaurant(restaurant);
        }
    };

    const handleSearch = async (name: string, city: string) => {
        try {
            const data = await fetchRestaurantDetailByName(name, city);
            setSelectedRestaurant(data);
        } catch (e) {
            console.error("Failed to fetch restaurant detail by name/city", e);
            setSelectedRestaurant(null);
        }
    };

    const setMapElement = (map: google.maps.Map) => {
        mapRef.current = map;
    };

    return {
        mapRef,
        setMapElement,
        selectedRestaurant,
        setSelectedRestaurant,
        handleSelect,
        handleSearch,
    };
};

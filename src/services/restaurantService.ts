import axios from "./axiosInstance";
import type { Restaurant } from "@schemas/restaurant";
import type { FilterValues } from "@schemas/filter";
import type { RestaurantFilterValues } from "@schemas/restaurant";
import { extractCity } from "@/utils/format";

export const fetchFilterData = async (): Promise<RestaurantFilterValues> => {
    const res = await axios.get<RestaurantFilterValues>("/restaurants/filter/setup");
    return res.data;
};

export const searchRestaurants = async (query: string): Promise<Restaurant[]> => {
    const res = await axios.get<Restaurant[]>("/restaurants/search", {
        params: { q: query }
    });
    return res.data;
};

export const fetchFilteredRestaurants = async (
    filters: FilterValues
): Promise<Restaurant[]> => {
    const res = await axios.get<Restaurant[]>("/restaurants", {
        params: filters
    });
    return res.data;
};

export const fetchRestaurantDetail = async (siret: string): Promise<Restaurant> => {
    const res = await axios.get<Restaurant>("/restaurants/detail", {
        params: { siret }
    });
    return res.data;
};

export const fetchRestaurantDetailByName = async (
    name: string,
    city: string
): Promise<Restaurant> => {
    const sanitizedCity = extractCity(city);
    const res = await axios.get<Restaurant>("/restaurants/detail", {
        params: { name, city: sanitizedCity }
    });

    return res.data;
};

export type Restaurant = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    local_rating: 1 | 2 | 3 | 4;
    local_rating_label?: string;
    google_rating?: number;
    user_ratings_total?: number;
    address: string;
    city: string;
    photos?: google.maps.places.PlacePhoto[];
    reviews?: google.maps.places.PlaceReview[];
    opening_hours?: {
        open_now: boolean;
        weekdayDescriptions: string[];
        periods: {
            open: { day: number; time: string };
            close?: { day: number; time: string };
        }[];
    };
    price_level?: number;
    source?: "local" | "google" | "merged";
    inspection_date?: string;
    fromLocalDataset?: boolean;
};

export type RestaurantOption = {
    label: string;
    restaurant: Restaurant;
};
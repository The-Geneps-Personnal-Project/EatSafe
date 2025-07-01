export type Restaurant = {
    id: string;
    siret: string;
    name: string;
    lat: number;
    lng: number;
    sanitary_score: 1 | 2 | 3 | 4;
    sanitary_score_label?: string;
    google_rating?: number;
    user_ratings_total?: number;
    address: string;
    city: string;
    photos?: Photo[];
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
    inspection_date?: string;
};

export type RestaurantOption = {
    label: string;
    restaurant: Restaurant;
};

export type RestaurantFilterOption = {
    value: string;
    label: string;
}

export type RestaurantFilterValues = {
    types?: RestaurantFilterOption[];
    regions?: RestaurantFilterOption[];
    departments?: RestaurantFilterOption[];
}

export type Photo = {
    photo_reference: string;
    height?: number;
    width?: number;
};
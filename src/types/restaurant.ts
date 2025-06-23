export type Restaurant = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    local_rating: 1 | 2 | 3 | 4;
    local_rating_label?: string;
    google_rating?: number;
    address?: string;
    photos?: google.maps.places.PlacePhoto[];
    reviews?: google.maps.places.PlaceReview[];
    source?: "local" | "google" | "merged";
    inspection_date?: string;
    fromLocalDataset?: boolean
};

export type RestaurantOption = {
    label: string;
    restaurant: Restaurant;
};
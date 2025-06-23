export type Restaurant = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    local_rating: 1 | 2 | 3 | 4;
    google_rating?: number;
    address?: string;
    photos?: google.maps.places.PlacePhoto[];
    source?: "local" | "google" | "merged";
};

export type RestaurantOption = {
    label: string;
    restaurant: Restaurant;
};
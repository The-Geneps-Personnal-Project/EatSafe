export type Restaurant = {
    id: string;
    name: string;
    local_rating: 1 | 2 | 3 | 4;
    google_rating?: number;
    lat: number;
    lng: number;
};

export type RestaurantOption = {
    label: string;
    restaurant: Restaurant;
};
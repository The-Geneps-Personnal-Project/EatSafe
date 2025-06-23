export type Restaurant = {
    id: string;
    name: string;
    rating: 1 | 2 | 3 | 4;
    lat: number;
    lng: number;
};

export type RestaurantOption = {
    label: string;
    restaurant: Restaurant;
};
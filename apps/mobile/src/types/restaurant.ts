export type Restaurant = {
  siret: string;
  name: string;
  lat: number;
  lng: number;
  sanitary_score: number;
  address: string;
  city: string;
  public_id?: string;
  types?: string[];
};

export type RestaurantDetails = Restaurant & {
  inspection_date?: string;
  sanitary_score_label?: string;
  opening_hours?: {
    open_now: boolean;
    weekdayDescriptions: string[];
  };
  photos?: Array<{ url: string } | { photo_reference: string }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    relative_time_description?: string;
  }>;
};

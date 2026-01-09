export type LocalScore = 1 | 2 | 3 | 4;
export type Price = "low" | "mid" | "high";

export type Recommendation = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    local_score: LocalScore;
    google_rating?: number;
    user_ratings_total?: number;
    distance_m: number;
    reason: string[];
    score: number;
    inspection_date?: string;
};

export type RecommendationQuery = {
    lat: number;
    lng: number;
    radius: number;
    limit?: number;
    cuisine?: string[];
    wheelchair?: boolean;
    open_now?: boolean;
    min_local_score?: LocalScore;
    max_distance_weight?: number;
    price_ranges?: Price[];
};

export type RecommendationsResponse = {
    results: Recommendation[];
    seed?: string;
};
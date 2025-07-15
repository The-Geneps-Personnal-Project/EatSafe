export interface Props {
    onSearch: (value: Option) => void;
}

export interface Option {
    type: "restaurant" | "city";
    label: string;
    placeId: string;
    name: string;
    city: string;
    lng?: number;
    lat?: number;
}
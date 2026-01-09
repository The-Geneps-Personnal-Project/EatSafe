import { Autocomplete, Chip, TextField } from "@mui/material";
import { useMemo } from "react";

type Props = {
    value: string[];
    onChange: (v: string[]) => void;
    options?: string[];
    label?: string;
};

const DEFAULTS = [
    "Italien",
    "Japonais",
    "Sushi",
    "Chinois",
    "Indien",
    "Thai",
    "Français",
    "Libanais",
    "Grec",
    "Mexicain",
    "Burger",
    "Pizza",
    "Tacos",
    "Végétarien",
    "Vegan",
    "Halal",
    "Kebab",
    "Tapas",
    "Vietnamien",
    "Coréen"
];

export default function CuisineMultiSelect({ value, onChange, options, label }: Props) {
    const opts = useMemo(() => options?.length ? options : DEFAULTS, [options]);
    return (
        <Autocomplete
            multiple
            options={opts}
            value={value}
            onChange={(_, v) => onChange(v)}
            renderTags={(val, getTagProps) =>
                val.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                ))
            }
            renderInput={(params) => (
                <TextField {...params} label={label ?? "Types de cuisine"} placeholder="Sélectionner..." size="small" margin="normal" />
            )}
        />
    );
}

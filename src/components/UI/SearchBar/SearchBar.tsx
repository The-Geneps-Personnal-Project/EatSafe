import { useEffect, useState, useRef } from "react";
import { Autocomplete, Box, TextField } from "@mui/material";
import debounce from "lodash.debounce";
import { useAutocompleteService } from "@hooks/useAutoCompleteService";
import { Props, Option } from "@/types/search";
import { searchRestaurants } from "@/services/restaurantService";
import { toTitleCase } from "@/utils/format";

const SearchBar = ({ onSearch }: Props) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const { getPredictions } = useAutocompleteService();

    const debouncedSearchRef = useRef(
        debounce(async (rawValue: string) => {
            const value = rawValue.trim();
            if (value.length < 2) return;

            const [googleResults, dbResults] = await Promise.all([
                getPredictions(value),
                searchRestaurants(value),
            ]);

            const formattedGoogle: Option[] = googleResults.slice(0, 2).map((p) => {
                const [namePart] = p.description.split(",");
                return {
                    type: "city",
                    label: `${p.description}`,
                    placeId: p.place_id,
                    name: namePart.trim(),
                    city: namePart.trim(),
                };
            });

            const formattedDB: Option[] = dbResults.map((r) => ({
                type: "restaurant",
                label: `${toTitleCase(r.name)} - ${toTitleCase(r.address)}, ${toTitleCase(r.city)}`,
                name: r.name,
                city: r.city,
                address: r.address,
                siret: r.siret,
                lat: r.lat,
                lng: r.lng,
            }));

            setOptions([...formattedGoogle, ...formattedDB]);
        }, 400)
    );

    useEffect(() => {
        const trimmed = inputValue.trim();

        if (trimmed.length >= 2) {
            debouncedSearchRef.current(trimmed);
        } else {
            setOptions([]);
        }

        const currentDebounce = debouncedSearchRef.current;

        return () => {
            currentDebounce.cancel();
        };
    }, [inputValue]);

    return (
        <Box sx={{ width: "100%" }}>
            <Autocomplete
                freeSolo
                fullWidth
                disableClearable
                options={options}
                getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.label
                }
                onInputChange={(_, value) => setInputValue(value)}
                onChange={(_, value) => {
                    if (!value || typeof value === "string") return;
                    onSearch(value);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Rechercher un restaurant ou une ville"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                            ...params.InputProps,
                            type: "search",
                        }}
                        sx={{
                            backgroundColor: "#fff",
                            borderRadius: 1,
                            boxShadow: 1,
                        }}
                    />
                )}
            />
        </Box>
    );
};

export default SearchBar;

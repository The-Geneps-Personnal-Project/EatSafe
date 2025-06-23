import { useMemo, useState, useEffect } from "react";
import { Autocomplete, Box, TextField } from "@mui/material";
import { mockRestaurants } from "@utils/mockRestaurants";
import type { Restaurant } from "@schemas/restaurant";
import { useAutocompleteService } from "@hooks/useAutoCompleteService";
import debounce from "lodash.debounce";

type Option =
    | { type: "local"; label: string; restaurant: Restaurant }
    | { type: "google"; label: string; placeId: string };

type Props = {
    onSelect: (restaurant: Restaurant, zoom?: number) => void; // Local search
    onFallbackSearch: (query: string) => void; // Fallback search on google maps API
};

const SearchBar = ({ onSelect, onFallbackSearch }: Props) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const { getPredictions } = useAutocompleteService();

    const handleSearch = async (value: string) => {
        const localResults: Option[] = mockRestaurants
            .filter((r) => r.name.toLowerCase().includes(value.toLowerCase()))
            .map((r) => ({
                type: "local",
                label: r.name,
                restaurant: r
            }));

        if (localResults.length >= 5) {
            setOptions(localResults);
            return;
        }

        const googleResults = await getPredictions(value);
        const formattedGoogle: Option[] = googleResults.map((p) => ({
            type: "google",
            label: p.description,
            placeId: p.place_id
        }));

        setOptions([...localResults, ...formattedGoogle]);
    };

    const debouncedSearch = useMemo(() => debounce(handleSearch, 300), []);

    useEffect(() => {
        if (inputValue.length >= 2) debouncedSearch(inputValue);
        else setOptions([]);
    }, [inputValue]);

    return (
        <Box sx={{ position: "absolute", top: 10, left: 10, zIndex: 9999, width: "90%", maxWidth: 400 }}>
            <Autocomplete
                freeSolo
                fullWidth
                disableClearable
                options={options}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
                onInputChange={(_, value) => setInputValue(value)}
                onChange={(_, value) => {
                    if (!value || typeof value === "string") return;

                    if (value.type === "local") {
                        onSelect(value.restaurant);
                    } else if (value.type === "google") {
                        onFallbackSearch(value.placeId);
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Rechercher un restaurant ou un lieu"
                        variant="outlined"
                        InputProps={{
                            ...params.InputProps,
                            type: "search"
                        }}
                        sx={{ backgroundColor: "#fff", borderRadius: 1, boxShadow: 1 }}
                    />
                )}
            />
        </Box>
    );
};

export default SearchBar;

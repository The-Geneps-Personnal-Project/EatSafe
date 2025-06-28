import { useEffect, useState, useMemo } from "react";
import { Autocomplete, Box, TextField } from "@mui/material";
import debounce from "lodash.debounce";
import { useAutocompleteService } from "@hooks/useAutoCompleteService";

interface Props {
    onSearch: (name: string, city: string) => void;
}

interface Option {
    type: "google";
    label: string;
    placeId: string;
    name: string;
    city: string;
}

const SearchBar = ({ onSearch }: Props) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const { getPredictions } = useAutocompleteService();

    const handleSearch = async (value: string) => {
        const googleResults = await getPredictions(value);
        const formatted: Option[] = googleResults.map((p) => {
            const [namePart, ...rest] = p.description.split(",");
            return {
                type: "google",
                label: p.description,
                placeId: p.place_id,
                name: namePart.trim(),
                city: rest.join(",").trim()
            };
        });
        setOptions(formatted);
    };

    const debouncedSearch = useMemo(() => debounce(handleSearch, 300), []);

    useEffect(() => {
        if (inputValue.length >= 2) debouncedSearch(inputValue);
        else setOptions([]);
    }, [inputValue]);

    return (
        <Box sx={{ width: "100%" }}>
            <Autocomplete
                freeSolo
                fullWidth
                disableClearable
                options={options}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
                onInputChange={(_, value) => setInputValue(value)}
                onChange={(_, value) => {
                    if (!value || typeof value === "string") return;
                    if (value.type === "google") {
                        onSearch(value.name, value.city);
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Rechercher un restaurant ou une adresse"
                        variant="outlined"
                        fullWidth
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

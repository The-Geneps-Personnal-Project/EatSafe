import { useMemo } from "react";
import { Autocomplete, Box, TextField } from "@mui/material";
import { mockRestaurants } from "../../../utils/mockRestaurants";
import { Restaurant, RestaurantOption } from "../../../types/restaurant";

type Props = {
    onSelect: (restaurant: Restaurant) => void; // Local search
    onFallbackSearch: (query: string) => void; // Fallback search on google maps API
};

const SearchBar = ({ onSelect, onFallbackSearch }: Props) => {
    const options: RestaurantOption[] = useMemo(() => {
        return mockRestaurants.map((r) => ({
            label: r.name,
            restaurant: r
        }));
    }, []);

    return (
        <Box
            sx={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                width: {
                    xs: "90%",
                    md: 400
                },
                zIndex: 1000
            }}
        >
            <Autocomplete
                freeSolo
                options={options}
                getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.label
                }
                onChange={(e, value) => {
                    if (typeof value === "string") {
                        onFallbackSearch(value);
                    } else if (value?.restaurant) {
                        onSelect(value.restaurant);
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Rechercher un restaurant ou un lieu"
                        size="small"
                        fullWidth
                        sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                )}
            />
        </Box>
    );
};

export default SearchBar;

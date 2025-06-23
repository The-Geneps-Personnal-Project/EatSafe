import { Autocomplete, TextField, Box } from "@mui/material";

const SearchBar = () => {
    return (
        <Box
            sx={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                width: {
                    xs: "90%", // mobile
                    md: 400    // desktop
                },
                zIndex: 1000
            }}
        >
            <Autocomplete
                freeSolo
                options={[]}
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

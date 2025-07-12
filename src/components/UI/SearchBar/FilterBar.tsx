import { useEffect, useState } from "react";
import { Box, Button, Card, Typography } from "@mui/material";
import { fetchFilterData } from "@services/restaurantService";
import type { FilterValues } from "@schemas/filter";
import type {
    RestaurantFilterOption,
    RestaurantFilterValues,
} from "@schemas/restaurant";
import ScoreSelect from "./Components/ScoreSelect";
import GoogleRatingSelect from "./Components/GoogleRating";
import TypeAutocomplete from "./Components/TypeAutocomplete";
import RegionDepartmentAutocomplete from "./Components/RegionDepartementAutocomplete";

interface FilterBarProps {
    onSearch: (filters: FilterValues) => void;
    visible: boolean;
    isMobile?: boolean;
    onClose: () => void;
    onClear: () => void;
}

export default function FilterBar({
    onSearch,
    visible,
    isMobile = false,
    onClose,
    onClear,
}: FilterBarProps) {
    const [filters, setFilters] = useState<FilterValues>({});
    const [types, setTypes] = useState<RestaurantFilterOption[]>([]);
    const [regions, setRegions] = useState<RestaurantFilterOption[]>([]);
    const [departments, setDepartments] = useState<RestaurantFilterOption[]>([]);

    useEffect(() => {
        fetchFilterData().then((result: RestaurantFilterValues) => {
            setTypes(result.types || []);
            setRegions(result.regions || []);
            setDepartments(result.departments || []);
        });
    }, []);

    const handleChange = (field: keyof FilterValues, value: string | number | null) => {
        setFilters((prev) => {
        if (value === null || value === "") {
            const copy = { ...prev };
            delete copy[field];
            return copy;
        }
        return { ...prev, [field]: value };
        });
    };

    const handleClear = () => {
        setFilters({});
        onClear();
    };

    const handleSubmit = () => {
        onSearch(filters);
        onClose();
    };

    if (!visible) return null;

    return (
        <>
        <Card
            sx={{
            position: "fixed",
            top: isMobile ? "auto" : 70,
            bottom: isMobile ? 0 : "auto",
            left: isMobile ? "50%" : 10,
            transform: isMobile ? "translateX(-50%)" : "none",
            width: isMobile ? "90%" : 420,
            maxHeight: isMobile ? "40%" : "auto",
            p: 2,
            boxShadow: 3,
            bgcolor: "#fff",
            overflowY: isMobile ? "auto" : "visible",
            zIndex: 1100,
            borderTopLeftRadius: isMobile ? 16 : 4,
            borderTopRightRadius: isMobile ? 16 : 4,
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Filtres</Typography>
            <Button size="small" onClick={onClose}>Fermer</Button>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <ScoreSelect value={filters.score} onChange={(v) => handleChange("score", v)} />
            <GoogleRatingSelect value={filters.google_rating} onChange={(v) => handleChange("google_rating", v)} />
            </Box>

            <TypeAutocomplete types={types} value={filters.place_type} onChange={(v) => handleChange("place_type", v)} />

            <RegionDepartmentAutocomplete
            regions={regions}
            departments={departments}
            selectedRegion={filters.reg_code}
            selectedDepartment={filters.dep_code}
            onChange={(field, val) => handleChange(field as keyof FilterValues, val)}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button variant="outlined" onClick={handleClear}>Effacer</Button>
            <Button variant="contained" onClick={handleSubmit}>Rechercher</Button>
            </Box>
        </Card>
        </>
    );
}

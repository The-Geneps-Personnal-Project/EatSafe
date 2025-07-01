import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    MenuItem,
    TextField,
    Typography,
    Autocomplete,
} from "@mui/material";
import { fetchFilterData } from "@services/restaurantService";
import type { FilterValues } from "@schemas/filter";
import type {
    RestaurantFilterOption,
    RestaurantFilterValues,
} from "@schemas/restaurant";

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

    const handleChange = (
        field: keyof FilterValues,
        value: string | number | null
    ) => {
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

    const uniqueTypes = Array.from(
        new Map(types.map((t) => [t.label, t])).values()
    );

    const getTypeOption = () =>
        uniqueTypes.find((t) => t.value[0] === filters.place_type) || null;

    if (!visible) return null;

    return (
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
        <Box
            sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            }}
        >
            <Typography variant="h6">Filtres</Typography>
            <Button size="small" onClick={onClose}>
            Fermer
            </Button>
        </Box>

        <Box sx={{ width: "100%", display: "flex", gap: 2, mb: 2 }}>
            <TextField
                select
                label="Score Sanitaire"
                value={filters.score ?? ""}
                onChange={(e) => handleChange("score", Number(e.target.value))}
                fullWidth
            >
                {[
                    { value: 1, label: "1 – Très satisfaisant" },
                    { value: 2, label: "2 – Satisfaisant" },
                    { value: 3, label: "3 – A améliorer" },
                    { value: 4, label: "4 – A corriger de manière urgente" },
                ].map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                    {label}
                </MenuItem>
                ))}
            </TextField>

            <TextField
                select
                label="Notation Google"
                value={filters.google_rating ?? ""}
                onChange={(e) =>
                handleChange("google_rating", Number(e.target.value))
                }
                fullWidth
            >
                {[1, 2, 3, 4, 5].map((n) => (
                <MenuItem key={n} value={n}>
                    {n}
                </MenuItem>
                ))}
            </TextField>
        </Box>


        <Autocomplete
            options={uniqueTypes}
            getOptionLabel={(opt) => opt.label}
            value={getTypeOption()}
            onChange={(_, v) => handleChange("place_type", v?.value[0] || null)}
            renderInput={(params) => <TextField {...params} label="Type" />}
            clearOnEscape
            sx={{ mb: 2 }}
        />

        <Box sx={{ width: "100%", display: "flex", gap: 2, mb: 2 }}>
            <Autocomplete
            options={regions}
            getOptionLabel={(opt) => opt.label}
            value={
                regions.find((r) => r.value === filters.reg_code) || null
            }
            onChange={(_, v) => handleChange("reg_code", v?.value || null)}
            fullWidth
            renderInput={(p) => <TextField {...p} label="Région" />}
            clearOnEscape
            />

            <Autocomplete
            options={departments}
            getOptionLabel={(opt) => opt.label}
            value={
                departments.find((d) => d.value === filters.dep_code) || null
            }
            onChange={(_, v) => handleChange("dep_code", v?.value || null)}
            fullWidth
            renderInput={(p) => <TextField {...p} label="Département" />}
            clearOnEscape
            />
        </Box>

        <Box
            sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            mt: 2,
            }}
        >
            <Button variant="outlined" onClick={handleClear}>
            Effacer
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
            Rechercher
            </Button>
        </Box>
        </Card>
    );
}

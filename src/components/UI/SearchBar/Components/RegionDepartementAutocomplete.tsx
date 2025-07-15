import { Autocomplete, Box, TextField } from "@mui/material";
import type { RestaurantFilterOption } from "@schemas/restaurant";

interface Props {
    regions: RestaurantFilterOption[];
    departments: RestaurantFilterOption[];
    selectedRegion: string | undefined;
    selectedDepartment: string | undefined;
    onChange: (field: "reg_code" | "dep_code", value: string | null) => void;
}

export default function RegionDepartmentAutocomplete({
    regions,
    departments,
    selectedRegion,
    selectedDepartment,
    onChange,
}: Props) {
    return (
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Autocomplete
            options={regions}
            getOptionLabel={(opt) => opt.label}
            value={regions.find((r) => r.value === selectedRegion) ?? null}
            onChange={(_, v) => onChange("reg_code", v?.value || null)}
            fullWidth
            renderInput={(params) => <TextField {...params} label="Région" />}
            clearOnEscape
        />

        <Autocomplete
            options={departments}
            getOptionLabel={(opt) => opt.label}
            value={departments.find((d) => d.value === selectedDepartment) ?? null}
            onChange={(_, v) => onChange("dep_code", v?.value || null)}
            fullWidth
            renderInput={(params) => <TextField {...params} label="Département" />}
            clearOnEscape
        />
        </Box>
    );
}

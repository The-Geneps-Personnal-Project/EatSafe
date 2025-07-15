import { Autocomplete, TextField } from "@mui/material";
import type { RestaurantFilterOption } from "@schemas/restaurant";

interface Props {
    types: RestaurantFilterOption[];
    value: string | undefined;
    onChange: (val: string | null) => void;
}

export default function TypeAutocomplete({ types, value, onChange }: Props) {
    const uniqueTypes = Array.from(new Map(types.map((t) => [t.label, t])).values());

    const selected = uniqueTypes.find((t) => t.value[0] === value) || null;

    return (
        <Autocomplete
        options={uniqueTypes}
        getOptionLabel={(opt) => opt.label}
        value={selected}
        onChange={(_, v) => onChange(v?.value[0] || null)}
        renderInput={(params) => <TextField {...params} label="Type" />}
        clearOnEscape
        sx={{ mb: 2 }}
        />
    );
}

import { TextField, MenuItem } from "@mui/material";

interface Props {
    value: number | undefined;
    onChange: (val: number | null) => void;
}

export default function GoogleRatingSelect({ value, onChange }: Props) {
    return (
        <TextField
        select
        label="Notation Google"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        fullWidth
        >
        {[1, 2, 3, 4, 5].map((n) => (
            <MenuItem key={n} value={n}>
            {n}
            </MenuItem>
        ))}
        </TextField>
    );
}

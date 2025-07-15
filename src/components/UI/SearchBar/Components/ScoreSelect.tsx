import { TextField, MenuItem } from "@mui/material";

interface Props {
    value: number | undefined;
    onChange: (val: number | null) => void;
}

const options = [
    { value: 1, label: "1 – Très satisfaisant" },
    { value: 2, label: "2 – Satisfaisant" },
    { value: 3, label: "3 – À améliorer" },
    { value: 4, label: "4 – À corriger de manière urgente" },
];

export default function ScoreSelect({ value, onChange }: Props) {
    return (
        <TextField
        select
        label="Score Sanitaire"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        fullWidth
        >
        {options.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
            {label}
            </MenuItem>
        ))}
        </TextField>
    );
}

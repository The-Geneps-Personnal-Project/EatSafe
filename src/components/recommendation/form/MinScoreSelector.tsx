import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

type Props = {
    value: 1 | 2 | 3 | 4 | undefined;
    onChange: (v: 1 | 2 | 3 | 4 | undefined) => void;
};

export default function MinScoreSelector({ value, onChange }: Props) {
    return (
        <FormControl size="small" fullWidth>
            <InputLabel id="min-score-label">Score sanitaire minimum</InputLabel>
            <Select
                labelId="min-score-label"
                label="Score sanitaire minimum"
                value={(value ?? "") as any}
                onChange={(e) => {
                    const v = e.target.value === "" ? undefined : (Number(e.target.value) as 1 | 2 | 3 | 4);
                    onChange(v);
                }}
            >
                <MenuItem value="">Aucun filtre</MenuItem>
                <MenuItem value={1}>1 — Très satisfaisant</MenuItem>
                <MenuItem value={2}>2 — Satisfaisant</MenuItem>
                <MenuItem value={3}>3 — À améliorer</MenuItem>
                <MenuItem value={4}>4 — Urgent</MenuItem>
            </Select>
        </FormControl>
    );
}

import { Box, Chip, Typography } from "@mui/material";

export default function ResultLimitChips({ value, onChange, options }: { value: number; onChange: (v: number) => void; options?: number[] }) {
    const opts = options ?? [3, 5, 10, 25];
    return (
        <Box sx={{ display: "grid", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Nombre de résultats</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {opts.map((n) => (
                    <Chip
                        key={n}
                        label={String(n)}
                        clickable
                        size="small"
                        color={value === n ? "primary" : "default"}
                        variant={value === n ? "filled" : "outlined"}
                        onClick={() => onChange(n)}
                    />
                ))}
            </Box>
        </Box>
    );
}

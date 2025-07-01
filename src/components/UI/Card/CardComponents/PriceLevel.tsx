import React from "react";
import { Stack, Typography } from "@mui/material";

interface Props {
    level: number;    
}

const PriceLevel: React.FC<Props> = ({ level }) => {
    if (!level || level < 1) return null;

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.primary">
                Indice de Prix :
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
                    {"€".repeat(level)}
                </Typography>
            </Stack>
        </Stack>
    );
};

export default PriceLevel;

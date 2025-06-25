// components/UI/RestaurantDetails/PriceLevel.tsx

import React from "react";
import { Box, Typography } from "@mui/material";

interface Props {
    level: number;    
}

const PriceLevel: React.FC<Props> = ({ level }) => {
    if (!level || level < 1) return null;

    return (
        <Box mt={1}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                💵 Indice de Prix: {"$".repeat(level)}
            </Typography>
        </Box>
    );
};

export default PriceLevel;

import React from "react";
import { Box, Typography } from "@mui/material";
import { getWeekSchedule } from "@utils/format";

interface Props {
    openNow: boolean;
    periods: {
        open: { day: number; time: string };
        close?: { day: number; time: string };
    }[];
}

const OpeningHours: React.FC<Props> = ({ openNow, periods }) => {
    const weekSchedule = getWeekSchedule(periods);

    return (
        <Box mt={1}>
        <Typography variant="subtitle2">
            {openNow ? "🟢 Ouvert maintenant" : "🔴 Fermé actuellement"}
        </Typography>
        <Box ml={1}>
            {weekSchedule.map((line, i) => (
            <Typography key={i} variant="body2" color="text.secondary">
                {line}
            </Typography>
            ))}
        </Box>
        </Box>
    );
};

export default OpeningHours;

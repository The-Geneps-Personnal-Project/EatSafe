import React from "react";
import { Box, Typography } from "@mui/material";
import { getWeekSchedule } from "@utils/format";

interface Props {
    periods: {
        open: { day: number; time: string };
        close?: { day: number; time: string };
    }[];
}

const OpeningHours: React.FC<Props> = ({periods }) => {
    const weekSchedule = getWeekSchedule(periods);

    return (
        <Box ml={1}>
            {weekSchedule.map((line, i) => (
            <Typography key={i} variant="body2" color="text.secondary">
                {line}
            </Typography>
            ))}
        </Box>
    );
};

export default OpeningHours;

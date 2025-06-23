import { Chip, Box, Typography } from "@mui/material";

export const getRatingColor = (rating: 1 | 2 | 3 | 4): string => {
    switch (rating) {
        case 1: return "#2196f3"; // Blue
        case 2: return "#4caf50"; // Green
        case 3: return "#ff9800"; // Orange
        case 4: return "#f44336"; // Red
    }
}

const ratingLabels: Record<1 | 2 | 3 | 4, string> = {
    1: "Très satisfaisant",
    2: "Satisfaisant",
    3: "À mettre à jour",
    4: "À mettre à jour urgemment"
};

type Props = {
    score: 1 | 2 | 3 | 4;
};

const RatingChip = ({ score }: Props) => (
    <Box display="flex" alignItems="center" gap={1} mt={2}>
        <Typography variant="subtitle2" fontWeight={600}>
            Score sanitaire
        </Typography>
        <Chip
            label={
                <Box component="span" sx={{ px: 1 }}>
                    {ratingLabels[score]}
                </Box>
            }
            sx={{
                backgroundColor: getRatingColor(score),
                color: "white",
                fontWeight: "bold",
                borderRadius: "999px",
                height: 24,
                fontSize: "0.75rem",
                lineHeight: 1,
                minWidth: 0,
                padding: 0
            }}
            size="small"
        />
    </Box>
);

export default RatingChip;
import { Box } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

interface Props {
    rating: number;
    max?: number;
}

export default function RatingStars({ rating, max = 5 }: Props) {
    const rounded = Math.round(rating || 0);
    return (
        <Box display="flex" alignItems="center" gap={0.25}>
            {Array.from({ length: max }).map((_, idx) => (
                <StarIcon
                    key={idx}
                    fontSize="small"
                    sx={{ color: idx < rounded ? "#fbc02d" : "#ccc" }}
                />
            ))}
        </Box>
    );
}

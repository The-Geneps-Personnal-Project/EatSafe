import { Box, Stack, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

type Props = {
    rating: number;
    user_ratings_total: number;
};

const GoogleRating = ({ rating, user_ratings_total }: Props) => (
    <Box display="flex" alignItems="center" gap={1} mt={2}>
        <Typography variant="subtitle2" fontWeight={600}>
            Score Google
        </Typography>
        <Stack direction="row" spacing={0.5}>
            {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                    key={i}
                    sx={{
                        fontSize: "1rem",
                        color: i < Math.round(rating) ? "#FFD700" : "#ccc"
                    }}
                />
            ))}
        </Stack>
        <Typography variant="body2" ml={0.5}>
            {rating.toFixed(1)} {user_ratings_total !== -1 ? `sur (${user_ratings_total} avis)` : ""}
        </Typography>
    </Box>
);

export default GoogleRating;
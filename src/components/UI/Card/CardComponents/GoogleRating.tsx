import { Chip, Stack, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

type Props = {
    rating: number;
    user_ratings_total: number;
};

const GoogleRating = ({ rating, user_ratings_total }: Props) => (
    <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" color="text.primary">
            Score Google :
        </Typography>
        <Chip
            size="small"
            icon={<StarIcon fontSize="small" />}
            label={`${rating.toFixed(1)} (${user_ratings_total})`}
            sx={{ height: 24 }}
        />
    </Stack>
);

export default GoogleRating;
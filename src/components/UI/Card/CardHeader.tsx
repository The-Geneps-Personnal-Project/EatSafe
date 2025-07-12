import {
    CardHeader,
    IconButton,
    Typography,
    Stack
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Restaurant } from "@schemas/restaurant";
import RatingChip from "./CardComponents/RatingChip";
import PriceLevel from "./CardComponents/PriceLevel";
import GoogleRating from "./CardComponents/GoogleRating";

interface Props {
    restaurant: Restaurant;
    onClose: () => void;
}

export default function CustomCardHeader({
    restaurant,
    onClose
}: Props) {
    return (
        <CardHeader
            sx={{ pb: 0, px: 0 }}
            title={
                <Typography variant="h6" fontWeight="bold">
                    {restaurant.name}
                </Typography>
            }
            subheader={
                <Stack direction="column" spacing={1} mt={1}>
                    {restaurant.price_level && (
                        <PriceLevel level={restaurant.price_level}/>
                    )}

                    {restaurant.sanitary_score && (
                        <RatingChip score={restaurant.sanitary_score} />
                    )}

                    {restaurant.google_rating  && (
                        <GoogleRating
                            rating={restaurant.google_rating}
                            user_ratings_total={restaurant.user_ratings_total || 0}
                        />
                    )}
                </Stack>
            }
            action={
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            }
        />
    );
}

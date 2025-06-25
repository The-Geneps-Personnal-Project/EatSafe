import React from "react";
import { Box, Typography } from "@mui/material";
import type { Restaurant } from "@schemas/restaurant";
import { formatDate } from "@utils/format";
import RatingChip from "./CardComponents/RatingChip";
import OpeningHours from "./CardComponents/OpeningHours";
import PriceLevel from "./CardComponents/PriceLevel";
import ReviewsSection from "./CardComponents/ReviewsSection";
import PhotosSlider from "./CardComponents/PhotosSlider";

interface Props {
    restaurant: Restaurant;
}

const RestaurantCardDetails: React.FC<Props> = ({ restaurant }) => {
    return (
        <Box px={3} pb={2}>
            {restaurant.address && (
                <Typography variant="subtitle2" color="text.primary" mt={2}>
                📍 {restaurant.address}
                </Typography>
            )}

            {restaurant.fromLocalDataset && restaurant.local_rating ? (
                <>
                <RatingChip score={restaurant.local_rating} />
                <Typography variant="subtitle2" mt={1}>
                    🧪 Inspection : {restaurant.inspection_date ? formatDate(restaurant.inspection_date) : "N/A"}
                </Typography>
                </>
            ) : (
                <Typography variant="subtitle2" mt={2}>
                Aucune donnée sanitaire trouvée
                </Typography>
            )}

            {restaurant.opening_hours && (
                <Box mt={2}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Horaires d'ouverture
                </Typography>
                <OpeningHours
                    openNow={restaurant.opening_hours.open_now}
                    periods={restaurant.opening_hours.periods}
                />
                </Box>
            )}

            {restaurant.price_level !== undefined && (
                    <Box mt={2}>
                        <PriceLevel level={restaurant.price_level} />
                    </Box>
            )}

            <ReviewsSection restaurant={restaurant} />

            {restaurant.photos && <PhotosSlider photos={restaurant.photos} />}
        </Box>
    );
};

export default RestaurantCardDetails;
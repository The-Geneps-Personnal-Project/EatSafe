import React from "react";
import { Box, Typography } from "@mui/material";
import type { Restaurant } from "@schemas/restaurant";
import OpeningHours from "./CardComponents/OpeningHours";
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

            {restaurant.opening_hours && (
                <Box mt={2}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Horaires d'ouverture
                </Typography>
                <OpeningHours
                    periods={restaurant.opening_hours.periods}
                />
                </Box>
            )}

            <ReviewsSection restaurant={restaurant} />

            {restaurant.photos && <PhotosSlider photos={restaurant.photos} />}
        </Box>
    );
};

export default RestaurantCardDetails;
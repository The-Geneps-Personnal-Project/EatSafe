import React from "react";
import { Box, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import type { Restaurant } from "@schemas/restaurant";
import OpeningHours from "./CardComponents/OpeningHours";
import ReviewsSection from "./CardComponents/ReviewsSection";
import PhotosSlider from "./CardComponents/PhotosSlider";

interface Props {
    restaurant: Restaurant;
}

const RestaurantCardDetails: React.FC<Props> = ({ restaurant }) => {
    return (
        <Box px={0} pb={2}>
            {restaurant.address && (
                <Box display="flex" alignItems="center" mt={2}>
                    <LocationOnIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.primary">
                        {restaurant.address}
                    </Typography>
                </Box>
            )}

            {restaurant.opening_hours && (
                <Box mt={2}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Horaires d'ouverture
                    </Typography>
                    <OpeningHours periods={restaurant.opening_hours.periods} />
                </Box>
            )}

            <ReviewsSection restaurant={restaurant} />

            {restaurant.photos && <PhotosSlider photos={restaurant.photos} />}
        </Box>
    );
};

export default RestaurantCardDetails;

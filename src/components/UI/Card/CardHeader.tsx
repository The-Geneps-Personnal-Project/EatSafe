import React from "react";
import { Box, Typography, IconButton, useTheme, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PriceLevel from "./CardComponents/PriceLevel";
import GoogleRating from "./CardComponents/GoogleRating";
import type { Restaurant } from "@schemas/restaurant";

type Props = {
    restaurant: Restaurant;
    onClose: () => void;
};

const RestaurantCardHeader: React.FC<Props> = ({ restaurant, onClose }) => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <Box px={3} pt={2} pb={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
            {restaurant.name}
            </Typography>

            {isDesktop && (
            <IconButton onClick={onClose} size="small">
                <CloseIcon />
            </IconButton>
            )}
        </Box>

        {restaurant.price_level !== undefined && (
            <Box mt={0.5}>
            <PriceLevel level={restaurant.price_level} />
            </Box>
        )}

        {restaurant.google_rating && (
            <GoogleRating
            rating={restaurant.google_rating}
            user_ratings_total={restaurant.user_ratings_total ?? -1}
            />
        )}
        </Box>
    );
};

export default RestaurantCardHeader;

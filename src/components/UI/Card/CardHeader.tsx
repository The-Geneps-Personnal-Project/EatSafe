import React from "react";
import { Box, Typography, IconButton, useTheme, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PriceLevel from "./CardComponents/PriceLevel";
import GoogleRating from "./CardComponents/GoogleRating";
import type { Restaurant } from "@schemas/restaurant";
import RatingChip from "./CardComponents/RatingChip";
import { formatDate } from "@/utils/format";

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

        {restaurant.sanitary_score ? (
            <>
                <RatingChip score={restaurant.sanitary_score} />
                <Typography variant="subtitle2" mt={1}>
                    🧪 Inspection : {restaurant.inspection_date ? formatDate(restaurant.inspection_date) : "N/A"}
                </Typography>
            </>
        ) : (
                <Typography variant="subtitle2" mt={2}>
                Aucune donnée sanitaire trouvée
                </Typography>
            )}
        <Box mt={1}>
            <Box
                sx={{
                    borderTop: "3px solid #e0e0e0",
                    width: "100%",
                }}
            />
        </Box>
        </Box>
    );
};

export default RestaurantCardHeader;

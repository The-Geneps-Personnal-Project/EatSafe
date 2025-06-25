import {
    Typography,
    Box,
    IconButton,
    useTheme,
    useMediaQuery,
    SwipeableDrawer
} from "@mui/material";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import type { Restaurant } from "@schemas/restaurant";
import { formatDate } from "@utils/format";
import RatingChip from "./RatingChip";
import GoogleRating from "./GoogleRating";
import PhotosSlider from "./PhotosSlider";
import ReviewsSection from "./ReviewsSection";
import OpeningHours from "./OpeningHours";
import PriceLevel from "./PriceLevel";

type Props = {
    restaurant: Restaurant;
    onClose: () => void;
    isMobile: boolean;
};

const drawerPaperSx = {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: "100%",
    height: "60%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
};

const drawerHandleSx = {
    width: 40,
    height: 6,
    backgroundColor: "#ccc",
    borderRadius: 3,
    margin: "8px auto",
    cursor: "pointer"
};

const drawerContentSx = (expanded: boolean) => ({
    flex: 1,
    overflowY: expanded ? "auto" : "hidden",
    maxHeight: expanded ? "100%" : 0,
    transition: "max-height 0.3s ease"
});

const RestaurantCard = ({ restaurant, onClose, isMobile }: Props) => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleDrawer = () => {
        setIsExpanded((prev) => !prev);
    };

    const content = (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                    {restaurant.name}
                </Typography>
                {isDesktop && (
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>
            
            {restaurant.address && (
                <Typography variant="subtitle2" color="text.primary" mt={2}>
                    📍 {restaurant.address}
                </Typography>
            )}

            {(restaurant.fromLocalDataset && restaurant.local_rating) ? (
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

            {restaurant.google_rating && (
                <GoogleRating rating={restaurant.google_rating} user_ratings_total={restaurant.user_ratings_total ?? -1} />
            )}


            {restaurant.opening_hours && (
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} mt={2}>
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

    if (isMobile) {
        return (
            <SwipeableDrawer
                anchor="bottom"
                open={true}
                onClose={() => {}}
                onOpen={() => {}}
                disableBackdropTransition={false}
                disableSwipeToOpen={true}
                keepMounted
                slotProps={{paper: {sx: {drawerPaperSx}}}}
            >
                <Box
                    onClick={toggleDrawer}
                    sx={drawerHandleSx}
                />
                <Box
                    sx={drawerContentSx(isExpanded)}
                >
                    {content}
                </Box>
            </SwipeableDrawer>
        );
    }

    return (
        <Box
            sx={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 400,
                maxHeight: "80vh",
                bgcolor: "white",
                boxShadow: 3,
                borderRadius: 2,
                zIndex: 9999,
                overflowY: "auto",
            }}
        >
            {content}
        </Box>
    );
};

export default RestaurantCard;

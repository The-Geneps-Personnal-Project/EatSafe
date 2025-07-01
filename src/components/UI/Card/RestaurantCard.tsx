import { Box, Divider } from "@mui/material";
import RestaurantCardHeader from "./CardHeader";
import RestaurantCardDetails from "./CardDetails";
import RestaurantCardMobileDrawer from "./CardMobileDrawer";
import type { Restaurant } from "@schemas/restaurant";

type Props = {
    restaurant: Restaurant;
    onClose: () => void;
    isMobile: boolean;
};

const boxSx = {
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
    p: 3
};

const RestaurantCard = ({ restaurant, onClose, isMobile }: Props) => {
    if (isMobile) {
        return <RestaurantCardMobileDrawer restaurant={restaurant} onClose={onClose} />;
    }

    return (
        <Box sx={boxSx}>
            <RestaurantCardHeader restaurant={restaurant} onClose={onClose} />
            <Divider sx={{ my: 2 }} />
            <RestaurantCardDetails restaurant={restaurant} />
        </Box>
    );
};

export default RestaurantCard;

import { useState } from "react";
import { Box, SwipeableDrawer } from "@mui/material";
import RestaurantCardHeader from "./CardHeader";
import RestaurantCardDetails from "./CardDetails";
import type { Restaurant } from "@schemas/restaurant";

type Props = {
    restaurant: Restaurant;
    onClose: () => void;
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
    transition: "max-height 0.3s ease",
    px: 3,
    pb: 2
});

const RestaurantCardMobileDrawer = ({ restaurant, onClose }: Props) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleDrawer = () => setIsExpanded((prev) => !prev);

    return (
        <SwipeableDrawer
            anchor="bottom"
            open={true}
            onClose={() => {}}
            onOpen={() => {}}
            disableBackdropTransition={false}
            disableSwipeToOpen={true}
            keepMounted
            PaperProps={{ sx: drawerPaperSx }}
        >
        <Box onClick={toggleDrawer} sx={drawerHandleSx} />
        <Box px={3} pt={1}>
            <RestaurantCardHeader restaurant={restaurant} onClose={onClose} />
        </Box>
        <Box sx={drawerContentSx(isExpanded)}>
            <RestaurantCardDetails restaurant={restaurant} />
        </Box>
        </SwipeableDrawer>
    );
};

export default RestaurantCardMobileDrawer;
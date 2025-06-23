import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Paper,
    SwipeableDrawer
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Restaurant } from "@schemas/restaurant";

type Props = {
    restaurant: Restaurant;
    onClose: () => void;
    isMobile: boolean;
};

const RestaurantCard = ({ restaurant, onClose, isMobile }: Props) => {
    const [isExpanded, setIsExpanded] = useState(true);
    useEffect(() => {
        setIsExpanded(true);
    }, [restaurant]);

    const content = (
        <Card
            sx={{
                width: "100%",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                pt: 2
            }}
            elevation={0}
        >
            <Box
                sx={{
                    width: 40,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: "grey.400",
                    mx: "auto",
                    mb: isExpanded ? 2 : 1,
                    cursor: "pointer"
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <CardContent>
                    <Typography variant="h6">{restaurant.name}</Typography>
                    <Typography variant="body2">Rating: {restaurant.local_rating}/4</Typography>
                    <Typography variant="body2">
                        Coordinates: {restaurant.lat}, {restaurant.lng}
                    </Typography>
                </CardContent>
            )}
        </Card>
    );

    if (isMobile) {
        return (
            <SwipeableDrawer
                anchor="bottom"
                open={true}
                onClose={onClose}
                onOpen={() => {}}
                disableBackdropTransition={false}
                keepMounted
                slotProps={{
                    paper: {
                        sx: {
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            height: isExpanded ? "50%" : "80px",
                            transition: "height 0.3s"
                        }
                    }
                }}
            >
                <Box sx={{ px: 2, pt: 1 }}>{content}</Box>
            </SwipeableDrawer>
        );
    }

    // Desktop version
    return (
        <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1000 }}>
            <Paper elevation={4}>
                <Card sx={{ width: 300, position: "relative" }}>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 10
                        }}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                    <CardContent>
                        <Typography variant="h6">{restaurant.name}</Typography>
                        <Typography variant="body2">Rating: {restaurant.local_rating}/4</Typography>
                        <Typography variant="body2">
                            Coordinates: {restaurant.lat}, {restaurant.lng}
                        </Typography>
                    </CardContent>
                </Card>
            </Paper>
        </Box>
    );
};

export default RestaurantCard;

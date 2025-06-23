import { useEffect, useState } from "react";
import {
    GoogleMap,
    LoadScript,
    Marker,
    MarkerClusterer
} from "@react-google-maps/api";
import { mockRestaurants } from "../../utils/mockRestaurants";
import { getSymbolIcon } from "../../utils/markerColors";
import { Restaurant } from "../../types/restaurant";
import RestaurantCard from "../UI/Card/RestaurantCard";
import Spinner from "../UI/Spinner/Spinner";
import { useTheme, useMediaQuery, Box, Typography } from "@mui/material";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

const center = {
    lat: 46.603354,
    lng: 1.888334
};

const MapWrapper = () => {
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // Simulate data loading while fetching part is not implemented
    useEffect(() => {
        const timer = setTimeout(() => {
            setDataLoaded(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={6}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false
                }}
            >
                {dataLoaded && (
                    <>
                        <MarkerClusterer>
                            {(clusterer) => (
                                <>
                                    {mockRestaurants.map((restaurant) => (
                                        <Marker
                                            key={restaurant.id}
                                            position={{ lat: restaurant.lat, lng: restaurant.lng }}
                                            icon={getSymbolIcon(restaurant.rating)}
                                            clusterer={clusterer}
                                            title={restaurant.name}
                                            onClick={() => setSelectedRestaurant(restaurant)}
                                        />
                                    ))}
                                </>
                            )}
                        </MarkerClusterer>
                        {selectedRestaurant && (
                            <RestaurantCard
                                restaurant={selectedRestaurant}
                                onClose={() => setSelectedRestaurant(null)}
                                isMobile={isMobile}
                            />
                        )}
                    </>
                )}
            </GoogleMap>

            {!dataLoaded && (
                <Box
                    sx={{
                        position: "fixed",
                        inset: 0,
                        bgcolor: "#fff",
                        zIndex: 9999,
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center"
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="black" mb={2}>
                            🕵️‍♂️ Inspection sanitaire en cours...
                        </Typography>
                        <Spinner />
                    </Box>
                </Box>
            )}
        </LoadScript>
    );
};

export default MapWrapper;

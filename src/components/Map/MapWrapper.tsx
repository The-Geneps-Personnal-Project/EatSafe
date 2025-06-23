import {
    GoogleMap,
    LoadScript,
    Marker,
    MarkerClusterer
} from "@react-google-maps/api";
import { useState } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { mockRestaurants } from "../../utils/mockRestaurants";
import { getSymbolIcon } from "../../utils/markerColors";
import { Restaurant } from "../../types/restaurant";
import RestaurantCard from "../UI/Card/RestaurantCard";


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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={6}
            >
            {selectedRestaurant && (
                <RestaurantCard
                    restaurant={selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    isMobile={isMobile}
                />
            )}
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
            </GoogleMap>
        </LoadScript>
    );
};

export default MapWrapper;
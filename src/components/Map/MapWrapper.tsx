import { useEffect, useState, useRef } from "react";
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
import SearchBar from "../UI/SearchBar/SearchBar";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

const center = {
    lat: 46.603354,
    lng: 1.888334
};

const MapWrapper = () => {
    const mapRef = useRef<google.maps.Map | null>(null);

    const [fallbackMarker, setFallbackMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const handleSearchSelect = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        if (mapRef.current) {
            mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
            mapRef.current.setZoom(16);
        }
    };

    const handleFallbackSearch = (query: string) => {
        const service = new google.maps.places.PlacesService(mapRef.current!);
        service.findPlaceFromQuery(
            {
                query,
                fields: ["geometry", "name"]
            },
            (results, status) => {
                if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    results &&
                    results[0].geometry?.location
                ) {
                    const loc = results[0].geometry.location;
                    const position = {
                        lat: loc.lat(),
                        lng: loc.lng()
                    };
                    mapRef.current?.panTo(position);
                    mapRef.current?.setZoom(16);
                    setFallbackMarker(position);
                }
            }
        );
    };

    // Simulate data loading while fetching part is not implemented
    useEffect(() => {
        const timer = setTimeout(() => {
            setDataLoaded(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string} libraries={["places"]}>
            <SearchBar
                onSelect={handleSearchSelect}
                onFallbackSearch={handleFallbackSearch}
            />            
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={6}
                onLoad={(map) => { mapRef.current = map }}
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
                        {fallbackMarker && (
                            <Marker
                                position={fallbackMarker}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillColor: "#000",
                                    fillOpacity: 0.8,
                                    strokeColor: "#fff",
                                    strokeWeight: 1,
                                    scale: 8
                                }}
                            />
                        )}
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

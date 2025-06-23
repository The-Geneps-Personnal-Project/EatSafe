import { useEffect, useState, useRef } from "react";
import {
    GoogleMap,
    LoadScript,
    Marker,
    MarkerClusterer
} from "@react-google-maps/api";
import { useTheme, useMediaQuery, Box, Typography } from "@mui/material";
import { mockRestaurants } from "../../utils/mockRestaurants";
import { getSymbolIcon } from "../../utils/markerColors";
import { Restaurant } from "../../types/restaurant";
import RestaurantCard from "../UI/Card/RestaurantCard";
import Spinner from "../UI/Spinner/Spinner";
import SearchBar from "../UI/SearchBar/SearchBar";
import { usePlaceDetails } from "../../hooks/usePlaceDetails";

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

    // const [fallbackMarker, setFallbackMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [googlePlace, setGooglePlace] = useState<google.maps.places.PlaceResult | null>(null);

    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const { fetchPlaceDetails } = usePlaceDetails();

    const handleSearchSelect = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        if (mapRef.current) {
            mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
            mapRef.current.setZoom(16);
        }
    };

    const handleFallbackSearch = async (query: string) => {
        if (!window.google) return;

        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
            { input: query, componentRestrictions: { country: "fr" } },
            async (predictions, status) => {
                if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions?.[0]) return;
                const place = await fetchPlaceDetails(predictions[0].place_id);
                if (!place?.geometry?.location) return;
                const position = place.geometry.location;
                mapRef.current?.panTo(position);
                mapRef.current?.setZoom(15);
                if (place.types?.includes("restaurant")) {
                    setGooglePlace(place);
                } else {
                    setGooglePlace(null);
                }
                setSelectedRestaurant(null);
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
                <SearchBar
                    onSelect={(restaurant) => {
                        mapRef.current?.panTo({ lat: restaurant.lat, lng: restaurant.lng });
                        mapRef.current?.setZoom(15);
                        setSelectedRestaurant(restaurant);
                        setGooglePlace(null);
                    }}
                    onFallbackSearch={handleFallbackSearch}
                />

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
                                            onClick={() => {
                                                setSelectedRestaurant(restaurant);
                                                setGooglePlace(null);
                                                if (mapRef.current) {
                                                    mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
                                                    mapRef.current.setZoom(16);
                                                }
                                            }}
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

                        {googlePlace?.geometry?.location && (
                            <Marker
                                position={{
                                    lat: googlePlace.geometry.location.lat(),
                                    lng: googlePlace.geometry.location.lng()
                                }}
                                title={googlePlace.name}
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

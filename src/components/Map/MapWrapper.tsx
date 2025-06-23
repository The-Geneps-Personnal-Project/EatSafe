import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, MarkerClusterer } from "@react-google-maps/api";
import { useTheme, useMediaQuery } from "@mui/material";
import { mockRestaurants } from "@utils/mockRestaurants";
import { getSymbolIcon } from "@utils/markerColors";
import RestaurantCard from "@components/UI/Card/RestaurantCard";
import SearchBar from "@components/UI/SearchBar/SearchBar";
import OverlaySpinner from "@components/UI/Spinner/OverlaySpinner";
import { useMapHandlers } from "@hooks/useMapHandler";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

const center = {
    lat: 46.603354,
    lng: 1.888334
};

const MapWrapper = () => {
    const [dataLoaded, setDataLoaded] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        mapRef,
        setMapElement,
        selectedRestaurant,
        setSelectedRestaurant,
        handleSelect,
        handleFallbackSearch
    } = useMapHandlers();

    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDataLoaded(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LoadScript googleMapsApiKey={key as string} libraries={["places"]}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={6}
                onLoad={(map) => {
                    mapRef.current = map;
                    setMapElement(map);
                }}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false
                }}
            >
                <SearchBar onSelect={handleSelect} onFallbackSearch={handleFallbackSearch} />

                {dataLoaded && (
                    <>
                        <MarkerClusterer>
                            {(clusterer) => (
                                <>
                                    {mockRestaurants.map((restaurant) => (
                                        <Marker
                                            key={restaurant.id}
                                            position={{ lat: restaurant.lat, lng: restaurant.lng }}
                                            icon={getSymbolIcon(restaurant.local_rating)}
                                            clusterer={clusterer}
                                            title={restaurant.name}
                                            onClick={() => handleSelect(restaurant)}
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

            {!dataLoaded && <OverlaySpinner />}
        </LoadScript>
    );
};

export default MapWrapper;

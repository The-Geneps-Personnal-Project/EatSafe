import { useEffect, useState } from "react";
import {
    GoogleMap,
    LoadScript,
    Marker,
    MarkerClusterer
} from "@react-google-maps/api";
import { useTheme, useMediaQuery, Zoom } from "@mui/material";
import { useRestaurantsData } from "@hooks/useRestaurantsData";
import { getSymbolIcon } from "@utils/markerColors";
import RestaurantCard from "@components/UI/Card/RestaurantCard";
import SearchBar from "@components/UI/SearchBar/SearchBar";
import OverlaySpinner from "@components/UI/Spinner/OverlaySpinner";
import { useMapHandlers } from "@hooks/useMapHandler";
import type { Restaurant } from "@schemas/restaurant";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

const DEFAULT_CENTER = {
    lat: 46.603354,
    lng: 1.888334
};

const MIN_ZOOM = 15;

const googleLibraries: (
    "places" | "drawing" | "geometry" | "visualization"
)[] = ["places"];

const MapWrapper = () => {
    const [mapReady, setMapReady] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [visibleRestaurants, setVisibleRestaurants] = useState<Restaurant[]>([]);
    const [currentZoom, setCurrentZoom] = useState<number>(6);

    const { restaurants, loading } = useRestaurantsData();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        mapRef,
        setMapElement,
        selectedRestaurant,
        setSelectedRestaurant,
        handleFallbackSearch,
        getPlaceDetailsByTextSearch
    } = useMapHandlers();

    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setMapCenter({ lat: latitude, lng: longitude });
            },
            () => setMapCenter(DEFAULT_CENTER)
        );
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDataLoaded(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const updateVisibleRestaurants = () => {
        const map = mapRef.current;
        if (!map || !map.getBounds()) return;

        const bounds = map.getBounds();
        const filtered = restaurants.filter((r) =>
            bounds && bounds.contains(new window.google.maps.LatLng(r.lat, r.lng))
        );

        setVisibleRestaurants(filtered);
    };

    const onMapLoad = (map: google.maps.Map) => {
        mapRef.current = map;
        setMapElement(map);
        setMapReady(true);
        setCurrentZoom(map.getZoom() ?? 6);

        map.addListener("zoom_changed", () => {
            const newZoom = map.getZoom() ?? 6;
            setCurrentZoom(newZoom);

            if (newZoom >= MIN_ZOOM) {
                updateVisibleRestaurants();
            } else {
                setVisibleRestaurants([]);
            }
        });
    };

    const handleSelect = async (restaurant: Restaurant) => {
        let enriched = restaurant;

        if (!restaurant.google_rating && !restaurant.photos) {
            try {
                const place = await getPlaceDetailsByTextSearch(
                    restaurant.name,
                    restaurant.lat,
                    restaurant.lng
                );

                if (place) {
                    enriched = {
                        ...restaurant,
                        google_rating: place.rating,
                        photos: place.photos,
                        reviews: place.reviews,
                        address: place.formatted_address || restaurant.address
                    };
                }
            } catch (e) {
                console.warn("Failed Google enrichment for pin:", restaurant.name);
            }
        }

        setSelectedRestaurant(enriched);

        if (mapRef.current && (currentZoom < 16)) {
            mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
            mapRef.current.setZoom(16);
        }
    };

    useEffect(() => {
        if (mapReady && restaurants.length > 0 && currentZoom >= MIN_ZOOM) {
            updateVisibleRestaurants();
        }
    }, [mapReady, restaurants, currentZoom]);

    return (
        <LoadScript googleMapsApiKey={key as string} libraries={googleLibraries}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={6}
                onLoad={onMapLoad}
                options={{
                    disableDefaultUI: true,
                    zoomControl: false,
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
                                    {visibleRestaurants.map((restaurant) => (
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

            {loading && <OverlaySpinner />}
        </LoadScript>
    );
};

export default MapWrapper;

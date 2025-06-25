import { useEffect, useState } from "react";
import {
    GoogleMap,
    LoadScript
} from "@react-google-maps/api";
import { useTheme, useMediaQuery, Box } from "@mui/material";
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
    const [currentZoom, setCurrentZoom] = useState<number>(6);
    const [visibleRestaurants, setVisibleRestaurants] = useState<Restaurant[]>([]);

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

    const handleSelect = async (restaurant: Restaurant) => {
        let enriched = restaurant;

        if (!restaurant.google_rating && !restaurant.photos) {
            try {
                const place = await getPlaceDetailsByTextSearch(
                    restaurant.name,
                    restaurant.lat,
                    restaurant.lng,
                    restaurant.city
                );

                if (place) {
                    enriched = {
                        ...restaurant,
                        google_rating: place.rating,
                        user_ratings_total: place.user_ratings_total,
                        opening_hours: place.opening_hours
                            ? {
                                    open_now: place.opening_hours.isOpen() ?? false,
                                    weekdayDescriptions: place.opening_hours.weekday_text || [],
                                    periods: place.opening_hours.periods ?? []
                                }
                            : undefined,
                        price_level: place.price_level,
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

        if (mapRef.current && currentZoom < 15) {
            mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
            mapRef.current.setZoom(15);
        }
    };

    const createNativeMarkers = (map: google.maps.Map) => {
        visibleRestaurants.forEach((restaurant) => {
            const marker = new window.google.maps.Marker({
                position: { lat: restaurant.lat, lng: restaurant.lng },
                map,
                icon: getSymbolIcon(restaurant.local_rating),
                title: restaurant.name
            });

            marker.addListener("click", () => {
                handleSelect(restaurant);
            });
        });
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

        map.addListener("bounds_changed", () => {
            if (currentZoom >= MIN_ZOOM) {
                updateVisibleRestaurants();
            }
        });
    };

    useEffect(() => {
        if (mapReady && restaurants.length > 0 && currentZoom >= MIN_ZOOM) {
            updateVisibleRestaurants();
        }
    }, [mapReady, restaurants, currentZoom]);

    useEffect(() => {
        if (mapRef.current && dataLoaded && currentZoom >= MIN_ZOOM) {
            createNativeMarkers(mapRef.current);
        }
    }, [visibleRestaurants]);

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
            </GoogleMap>

            {selectedRestaurant && (
                <RestaurantCard
                    restaurant={selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    isMobile={isMobile}
                />
            )}

            {loading && <OverlaySpinner />}
        </LoadScript>
    );
};

export default MapWrapper;

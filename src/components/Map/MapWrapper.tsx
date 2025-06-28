import { useEffect, useRef, useState } from "react";
import {
    GoogleMap,
    LoadScript
} from "@react-google-maps/api";
import { useTheme, useMediaQuery, Box, Button } from "@mui/material";
import { getSymbolIcon } from "@utils/markerColors";
import RestaurantCard from "@components/UI/Card/RestaurantCard";
import SearchBar from "@components/UI/SearchBar/SearchBar";
import OverlaySpinner from "@components/UI/Spinner/OverlaySpinner";
import FilterBar from "@components/UI/SearchBar/FilterBar";
import { useMapHandlers } from "@hooks/useMapHandler";
import type { Restaurant } from "@schemas/restaurant";
import type { FilterValues } from "@schemas/filter";
import {
    fetchFilteredRestaurants,
    fetchRestaurantDetail,
    fetchRestaurantDetailByName
} from "@services/restaurantService";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

const DEFAULT_CENTER = {
    lat: 46.603354,
    lng: 1.888334
};

const googleLibraries: (
    "places" | "drawing" | "geometry" | "visualization"
)[] = ["places"];

const MapWrapper = () => {
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [currentZoom, setCurrentZoom] = useState<number>(6);
    const [searching, setSearching] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const detailCacheRef = useRef<Map<string, Restaurant>>(new Map());

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        mapRef,
        setMapElement,
        selectedRestaurant,
        setSelectedRestaurant
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

    const handleSelect = async (restaurant: Restaurant) => {
        const cached = detailCacheRef.current.get(restaurant.siret);
        if (cached) {
            setSelectedRestaurant(cached);
            return;
        }

        try {
            const data = await fetchRestaurantDetail(restaurant.siret);
            detailCacheRef.current.set(restaurant.siret, data);
            setSelectedRestaurant(data);

            if (mapRef.current && currentZoom < 15) {
                mapRef.current.panTo({ lat: data.lat, lng: data.lng });
                mapRef.current.setZoom(15);
            }
        } catch (err) {
            console.error("Failed to fetch restaurant detail", err);
        }
    };

    const handleClearFilters = () => {
        clearMarkers();
    };

    const handleSearch = async (name: string, city: string) => {
        try {
            const restaurant = await fetchRestaurantDetailByName(name, city);
            setSelectedRestaurant(restaurant);
            if (mapRef.current) {
                createNativeMarkers(mapRef.current, [restaurant]);
                mapRef.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
                mapRef.current.setZoom(16);
            }
        } catch (err) {
            console.error("No match found in local database for:", name, city);
        }
    };

    const handleFilterSearch = async (filters: FilterValues) => {
        setSearching(true);
        try {
            const data = await fetchFilteredRestaurants(filters);
            setFiltersOpen(false);

            if (mapRef.current && data.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                data.forEach(r => bounds.extend({ lat: r.lat, lng: r.lng }));
                mapRef.current.fitBounds(bounds);

                createNativeMarkers(mapRef.current, data);
            }
        } catch (err) {
            console.error("Failed to fetch filtered restaurants", err);
        } finally {
            setSearching(false);
        }
    };

    const clearMarkers = () => {
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current = null;
        }
    }

    const createNativeMarkers = (map: google.maps.Map, restaurants: Restaurant[]) => {
        clearMarkers();

        const markers = restaurants.map((restaurant) => {
            const isSelected = selectedRestaurant?.siret === restaurant.siret;

            const marker = new window.google.maps.Marker({
                position: { lat: restaurant.lat, lng: restaurant.lng },
                icon: {
                    url: getSymbolIcon(restaurant.sanitary_score),
                    scaledSize: new window.google.maps.Size(isSelected ? 48 : 32, isSelected ? 48 : 32)
                },
                title: restaurant.name,
                zIndex: isSelected ? 1000 : undefined
            });

            marker.addListener("click", () => {
                handleSelect(restaurant);
            });

            return marker;
        });

        clustererRef.current = new MarkerClusterer({ map, markers });
        markersRef.current = markers;
    };

    const onMapLoad = (map: google.maps.Map) => {
        mapRef.current = map;
        setMapElement(map);
        setCurrentZoom(map.getZoom() ?? 6);
    };

    return (
        <LoadScript googleMapsApiKey={key as string} libraries={googleLibraries}>
            <Box sx={{ position: "absolute", top: 10, left: 10, zIndex: 9999, width: 420, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                    <SearchBar onSearch={handleSearch} />
                </Box>
                <Button variant="outlined" sx={{bgcolor: "white"}} onClick={() => setFiltersOpen(!filtersOpen)}>
                    Filtrer
                </Button>
            </Box>

            <FilterBar
                visible={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                onClear={handleClearFilters}
                onSearch={handleFilterSearch}
            />

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
            </GoogleMap>

            {selectedRestaurant && (
                <RestaurantCard
                    restaurant={selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    isMobile={isMobile}
                />
            )}

            {searching && <OverlaySpinner />}
        </LoadScript>
    );
};

export default MapWrapper;

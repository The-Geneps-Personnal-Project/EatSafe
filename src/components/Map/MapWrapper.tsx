import { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
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
    fetchRestaurantDetailByName,
} from "@services/restaurantService";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const containerStyle = { width: "100%", height: "100vh" };
const DEFAULT_CENTER = { lat: 46.603354, lng: 1.888334 };
const googleLibraries: ("places")[] = ["places"];

export default function MapWrapper() {
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [currentZoom, setCurrentZoom] = useState(6);
    const [searching, setSearching] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const detailCacheRef = useRef<Map<string, Restaurant>>(new Map());

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const { mapRef, setMapElement, selectedRestaurant, setSelectedRestaurant } =
        useMapHandlers();

    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
            setMapCenter({ lat: coords.latitude, lng: coords.longitude }),
        () => setMapCenter(DEFAULT_CENTER)
        );
    }, []);

    const handleSelect = async (r: Restaurant) => {
        const cached = detailCacheRef.current.get(r.siret);
        if (cached) return setSelectedRestaurant(cached);

        try {
        const data = await fetchRestaurantDetail(r.siret);
        detailCacheRef.current.set(r.siret, data);
        setSelectedRestaurant(data);
        if (mapRef.current && currentZoom < 15) {
            mapRef.current.panTo({ lat: data.lat, lng: data.lng });
            mapRef.current.setZoom(15);
        }
        } catch (e) {
        console.error(e);
        }
    };

    const clearMarkers = () => {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        clustererRef.current?.clearMarkers();
        clustererRef.current = null;
    };

    const handleClearFilters = () => {
        clearMarkers();
    };

    const handleSearch = async (name: string, city: string) => {
        try {
        const r = await fetchRestaurantDetailByName(name, city);
        setSelectedRestaurant(r);
        if (mapRef.current) {
            clearMarkers();
            createNativeMarkers(mapRef.current, [r]);
            mapRef.current.panTo({ lat: r.lat, lng: r.lng });
            mapRef.current.setZoom(16);
        }
        } catch {
        console.error("No match for", name, city);
        }
    };

    const handleFilterSearch = async (filters: FilterValues) => {
        setSearching(true);
        try {
        const data = await fetchFilteredRestaurants(filters);
        setFiltersOpen(false);
        if (mapRef.current && data.length) {
            const bounds = new google.maps.LatLngBounds();
            data.forEach((r) => bounds.extend({ lat: r.lat, lng: r.lng }));
            mapRef.current.fitBounds(bounds);
            createNativeMarkers(mapRef.current, data);
        }
        } catch (e) {
        console.error(e);
        } finally {
        setSearching(false);
        }
    };

    const createNativeMarkers = (
        map: google.maps.Map,
        restaurants: Restaurant[]
    ) => {
        clearMarkers();
        const markers = restaurants.map((r) => {
        const sel = selectedRestaurant?.siret === r.siret;
        const m = new google.maps.Marker({
            position: { lat: r.lat, lng: r.lng },
            icon: {
            url: getSymbolIcon(r.sanitary_score),
            scaledSize: new google.maps.Size(sel ? 48 : 32, sel ? 48 : 32),
            },
            title: r.name,
            zIndex: sel ? 1000 : undefined,
        });
        m.addListener("click", () => handleSelect(r));
        return m;
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
        <LoadScript googleMapsApiKey={key} libraries={googleLibraries}>
        <Box
            sx={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 9999,
            width: isMobile ? "90%" : 420,
            display: "flex",
            gap: 1,
            }}
        >
            <Box sx={{ flexGrow: 1 }}>
                <SearchBar onSearch={handleSearch} />
            </Box>
            <Button
                variant="outlined"
                sx={{ bgcolor: "white" }}
                onClick={() => setFiltersOpen((o) => !o)}
            >
                Filtrer
            </Button>
        </Box>

        <FilterBar
            visible={filtersOpen}
            isMobile={isMobile}
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
            fullscreenControl: false,
            }}
        />

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
}

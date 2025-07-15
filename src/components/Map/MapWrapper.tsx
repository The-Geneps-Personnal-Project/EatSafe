import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import {
    useTheme,
    useMediaQuery,
    Box,
    Button,
    Card,
    IconButton,
    AlertColor,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { getSymbolIcon } from "@utils/markerColors";
import RestaurantCard from "@components/UI/Card/RestaurantCard";
import SearchBar from "@components/UI/SearchBar/SearchBar";
import OverlaySpinner from "@components/UI/Spinner/OverlaySpinner";
import FilterBar from "@components/UI/SearchBar/FilterBar";
import ContactModal from "@components/UI/SearchBar/ContactModal";
import BuyMeACoffeeButton from "@components/UI/SearchBar/BuyMeACoffee";
import { useMapHandlers } from "@hooks/useMapHandler";
import type { Restaurant } from "@schemas/restaurant";
import type { FilterValues } from "@schemas/filter";
import Toast from "@components/UI/Toast/Toast";
import {
    fetchFilteredRestaurants,
    fetchRestaurantDetail,
    fetchRestaurantDetailByName,
} from "@services/restaurantService";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Option } from "@/types/search";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";

const containerStyle = { width: "100%", height: "100vh" };
const DEFAULT_CENTER = { lat: 46.603354, lng: 1.888334 };
const googleLibraries: ("places")[] = ["places"];

export default function MapWrapper() {
    const [isReady, setIsReady] = useState(false);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [currentZoom, setCurrentZoom] = useState(6);
    const [searching, setSearching] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastSeverity, setToastSeverity] = useState<AlertColor>("info");

    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const detailCacheRef = useRef<Map<string, Restaurant>>(new Map());

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        mapRef,
        setMapElement,
        selectedRestaurant,
        setSelectedRestaurant,
    } = useMapHandlers();

    const { getPlaceDetails } = usePlaceDetails();

    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setMapCenter({ lat: Number(coords.latitude), lng: Number(coords.longitude) });
                setIsReady(true);
            },
            () => {
                setMapCenter(DEFAULT_CENTER);
                setIsReady(true);
            }
        );
    }, []);

    const showToast = (msg: string, severity: AlertColor = "info") => {
        setToastMessage(msg);
        setToastSeverity(severity);
        setToastOpen(true);
    };

    const handleSelect = async (r: Restaurant) => {
        const cached = detailCacheRef.current.get(r.siret);
        if (cached) return setSelectedRestaurant(cached);

        try {
            const data = await fetchRestaurantDetail(r.siret);
            detailCacheRef.current.set(r.siret, data);
            setSelectedRestaurant(null);
            setSelectedRestaurant(data);
            if (mapRef.current && currentZoom < 15) {
                mapRef.current.panTo({ lat: data.lat, lng: data.lng });
                mapRef.current.setZoom(15);
            }
        } catch (e) {
            showToast("Aucun résultat trouvé pour ce restaurant.", "error");
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

    const handleSearch = async (result: Option) => {
        try {
            if (result.type === "restaurant") {
                const r = await fetchRestaurantDetailByName(result.name, result.city);
                setSelectedRestaurant(r);
                if (mapRef.current) {
                    clearMarkers();
                    createNativeMarkers(mapRef.current, [r]);
                    mapRef.current.panTo({ lat: r.lat, lng: r.lng });
                    mapRef.current.setZoom(16);
                }
                return;
            } else if (result.type === "city") {
                setSelectedRestaurant(null);
                clearMarkers();

                const place = await getPlaceDetails(result.placeId!);
                const location = place?.geometry?.location;
                const lat = location?.lat() ?? DEFAULT_CENTER.lat;
                const lng = location?.lng() ?? DEFAULT_CENTER.lng;

                setMapCenter({ lat, lng });
                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(14);
                }

                const restaurants = await fetchFilteredRestaurants({ city: result.city });

                if (restaurants.length && mapRef.current) {
                    createNativeMarkers(mapRef.current, restaurants);
                }
            }
        } catch {
            showToast("Aucun résultat trouvé pour cette recherche.", "warning");
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
            } else {
                showToast("Aucun résultat trouvé avec ces filtres.", "warning");
            }
        } catch (e) {
            console.error("Error fetching filtered restaurants:", e);
        } finally {
            setSearching(false);
        }
    };

    const createNativeMarkers = (map: google.maps.Map, restaurants: Restaurant[]) => {
        clearMarkers();
        const markers = restaurants.map((r) => {
            const sel = selectedRestaurant?.siret === r.siret;
            const marker = new google.maps.Marker({
                position: { lat: r.lat, lng: r.lng },
                icon: {
                    url: getSymbolIcon(r.sanitary_score),
                    scaledSize: new google.maps.Size(sel ? 48 : 32, sel ? 48 : 32),
                },
                title: r.name,
                zIndex: sel ? 1000 : undefined,
            });
            marker.addListener("click", () => handleSelect(r));
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
                    alignItems: "center",
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    <SearchBar onSearch={handleSearch} />
                </Box>
                {isMobile && (
                    <IconButton
                        onClick={() => setMenuOpen((prev) => !prev)}
                        sx={{ bgcolor: "white", height: 40, width: 40 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}
                {!isMobile && (
                    <Button
                        variant="outlined"
                        sx={{ bgcolor: "white" }}
                        onClick={() => setFiltersOpen((o) => !o)}
                    >
                        Filtrer
                    </Button>
                )}
            </Box>

            {isMobile && menuOpen && (
                <Card
                    sx={{
                        position: "absolute",
                        top: 70,
                        right: 10,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        zIndex: 1200,
                    }}
                >
                    <Button variant="outlined" onClick={() => { setFiltersOpen(true); setMenuOpen(false); }}>
                        🎯 Filtres
                    </Button>
                    <BuyMeACoffeeButton fullWidth />
                    <Button variant="outlined" sx={{ bgcolor: "white" }} onClick={() => { setContactOpen(true); setMenuOpen(false); }}>
                        📬 Contact
                    </Button>
                </Card>
            )}

            {!isMobile && (
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        display: "flex",
                        gap: 1,
                        zIndex: 1200,
                    }}
                >
                    <BuyMeACoffeeButton />
                    <Button
                        variant="outlined"
                        sx={{ bgcolor: "white" }}
                        onClick={() => setContactOpen(true)}
                    >
                        📬 Contact
                    </Button>
                </Box>
            )}

            <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

            <FilterBar
                visible={filtersOpen}
                isMobile={isMobile}
                onClose={() => setFiltersOpen(false)}
                onClear={handleClearFilters}
                onSearch={handleFilterSearch}
            />

            {isReady && (
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
            )}

            {selectedRestaurant && (
                <RestaurantCard
                    key={selectedRestaurant.siret}
                    restaurant={selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    isMobile={isMobile}
                />
            )}

            <Toast
                open={toastOpen}
                message={toastMessage}
                severity={toastSeverity}
                onClose={() => setToastOpen(false)}
            />

            {(searching && isReady) && <OverlaySpinner />}
        </LoadScript>
    );
}

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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
import { LoadScript } from "@react-google-maps/api";
import { getSymbolIcon } from "@utils/markerColors";
import RestaurantCard from "@components/UI/Card/RestaurantCard";
import SearchBar from "@components/UI/SearchBar/SearchBar";
import OverlaySpinner from "@components/UI/Spinner/OverlaySpinner";
import FilterBar from "@components/UI/SearchBar/FilterBar";
import ContactModal from "@components/UI/SearchBar/ContactModal";
import BuyMeACoffeeButton from "@components/UI/SearchBar/BuyMeACoffee";
import AddToHomeScreenButton from "../UI/SearchBar/HomeScreenButton";
import type { Restaurant } from "@schemas/restaurant";
import type { FilterValues } from "@schemas/filter";
import Toast from "@components/UI/Toast/Toast";
import { Recommendation } from "@schemas/recommendation";
import RecommendationChat from "@components/recommendation/RecommendationChat";
import {
    fetchFilteredRestaurants,
    fetchRestaurantDetail,
    fetchRestaurantDetailByName,
} from "@services/restaurantService";
import { Option } from "@/types/search";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";

const containerStyle = { width: "100%", height: "100vh" };
const DEFAULT_CENTER = { lat: 46.603354, lng: 1.888334 };
const googleLibraries: ("places")[] = ["places"];

export default function MapLibreWrapper() {
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

    const cityCoordCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const detailCacheRef = useRef<Map<string, Restaurant>>(new Map());

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const { getPlaceDetails } = usePlaceDetails();

    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;
    const styleUrl =
        process.env.REACT_APP_MAPLIBRE_STYLE_URL ??
        "https://demotiles.maplibre.org/style.json";

    const showToast = (msg: string, severity: AlertColor = "info") => {
        setToastMessage(msg);
        setToastSeverity(severity);
        setToastOpen(true);
    };

    const clearMarkers = () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
    };

    const createMarkers = (map: maplibregl.Map, restaurants: Restaurant[]) => {
        clearMarkers();
        const markers = restaurants.map((r) => {
            const el = document.createElement("div");
            el.style.width = "32px";
            el.style.height = "32px";
            el.style.cursor = "pointer";

            const img = document.createElement("img");
            img.src = getSymbolIcon(r.sanitary_score);
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.display = "block";
            el.appendChild(img);

            el.addEventListener("click", () => handleSelect(r));

            return new maplibregl.Marker({ element: el, anchor: "bottom" })
                .setLngLat([r.lng, r.lat])
                .addTo(map);
        });

        markersRef.current = markers;
    };

    const fitBoundsToRestaurants = (restaurants: { lat: number; lng: number }[]) => {
        if (!mapRef.current || restaurants.length === 0) return;
        const bounds = new maplibregl.LngLatBounds();
        restaurants.forEach((r) => bounds.extend([r.lng, r.lat]));
        mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 16 });
    };

    const handleSelect = async (r: Restaurant) => {
        const cached = detailCacheRef.current.get(r.siret);
        if (cached) return;

        try {
            const data = await fetchRestaurantDetail(r.siret);
            detailCacheRef.current.set(r.siret, data);
            // mimic existing behavior: clear then set to force card re-mount
            // (keeps UX consistent with the Google version)
            // eslint-disable-next-line react/no-unused-state
            setSelectedRestaurant(null);
            setSelectedRestaurant(data);

            if (mapRef.current && mapRef.current.getZoom() < 15) {
                mapRef.current.easeTo({
                    center: [data.lng, data.lat],
                    zoom: 15,
                    duration: 400,
                });
            }
        } catch {
            showToast("Aucun résultat trouvé pour ce restaurant.", "error");
        }
    };

    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: styleUrl,
            center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
            zoom: 6,
            attributionControl: false,
        });

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();

        map.on("zoomend", () => setCurrentZoom(map.getZoom()));

        mapRef.current = map;

        return () => {
            clearMarkers();
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const lat = Number(coords.latitude);
                const lng = Number(coords.longitude);

                setMapCenter({ lat, lng });
                setCurrentZoom(11);
                setIsReady(true);

                if (mapRef.current) {
                    mapRef.current.easeTo({ center: [lng, lat], zoom: 11, duration: 400 });
                }

                const geocoderCtor = (window as any).google?.maps?.Geocoder;
                if (!geocoderCtor) return;

                const geocoder = new geocoderCtor();
                geocoder.geocode({ location: { lat, lng } }, async (results: any, status: string) => {
                    if (status === "OK" && results) {
                        const postalCodeComponent = results
                            .flatMap((r: any) => r.address_components)
                            .find((c: any) => c.types.includes("postal_code"));

                        const postalCode = postalCodeComponent?.long_name;

                        if (postalCode) {
                            let depCode = postalCode.substring(0, 2);

                            if (depCode === "20") {
                                depCode = "2A";
                            }

                            try {
                                const restaurants = await fetchFilteredRestaurants({ dep_code: depCode });
                                if (restaurants.length && mapRef.current) {
                                    createMarkers(mapRef.current, restaurants);
                                    fitBoundsToRestaurants(restaurants);
                                } else {
                                    showToast(`Aucun restaurant trouvé dans le département ${depCode}.`, "warning");
                                }
                            } catch {
                                showToast("Erreur lors du chargement des restaurants à proximité.", "error");
                            }
                        }
                    }
                });
            },
            () => {
                setMapCenter(DEFAULT_CENTER);
                setCurrentZoom(6);
                setIsReady(true);
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRecommendationResults = (recs: Recommendation[]) => {
        if (!mapRef.current || !Array.isArray(recs) || !recs.length) return;

        const toNum = (v: any) => (v === null || v === undefined ? NaN : Number(v));
        const restaurants = recs
            .map((r) => {
                const lat = toNum((r as any).latitude ?? (r as any).lat);
                const lng = toNum((r as any).longitude ?? (r as any).lng);
                return {
                    siret: (r as any).siret ?? (r as any).id ?? String(Math.random()),
                    name: r.name,
                    lat,
                    lng,
                    sanitary_score: toNum((r as any).hygiene_score ?? (r as any).local_score),
                };
            })
            .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));

        if (!restaurants.length) {
            showToast("Aucune coordonnée valide reçue des recommandations.", "warning");
            return;
        }

        clearMarkers();
        createMarkers(mapRef.current, restaurants as any);
        fitBoundsToRestaurants(restaurants);
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
                    createMarkers(mapRef.current, [r]);
                    mapRef.current.easeTo({ center: [r.lng, r.lat], zoom: 16, duration: 400 });
                }
                return;
            } else if (result.type === "city") {
                setSelectedRestaurant(null);
                clearMarkers();

                let lat: number, lng: number;
                const cached = cityCoordCache.current.get(result.placeId!);
                if (cached) {
                    ({ lat, lng } = cached);
                } else {
                    const place = await getPlaceDetails(result.placeId!);
                    const location = place?.geometry?.location;
                    lat = location?.lat() ?? DEFAULT_CENTER.lat;
                    lng = location?.lng() ?? DEFAULT_CENTER.lng;
                    cityCoordCache.current.set(result.placeId!, { lat, lng });
                }

                setMapCenter({ lat, lng });
                if (mapRef.current) {
                    mapRef.current.easeTo({ center: [lng, lat], zoom: 14, duration: 400 });
                }

                const restaurants = await fetchFilteredRestaurants({ city: result.city });

                if (restaurants.length && mapRef.current) {
                    createMarkers(mapRef.current, restaurants);
                    fitBoundsToRestaurants(restaurants);
                } else {
                    showToast(`Aucun restaurant trouvé à ${result.city}.`, "warning");
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
                createMarkers(mapRef.current, data);
                fitBoundsToRestaurants(data);
            } else {
                showToast("Aucun résultat trouvé avec ces filtres.", "warning");
            }
        } catch (e) {
            console.error("Error fetching filtered restaurants:", e);
        } finally {
            setSearching(false);
        }
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
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFiltersOpen(true);
                            setMenuOpen(false);
                        }}
                    >
                        🎯 Filtres
                    </Button>
                    <BuyMeACoffeeButton fullWidth />
                    <AddToHomeScreenButton fullWidth />
                    <Button
                        variant="outlined"
                        sx={{ bgcolor: "white" }}
                        onClick={() => {
                            setContactOpen(true);
                            setMenuOpen(false);
                        }}
                    >
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

            <Box
                ref={mapContainerRef}
                sx={{
                    width: containerStyle.width,
                    height: containerStyle.height,
                    visibility: isReady ? "visible" : "hidden",
                }}
            />

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

            {searching && isReady && <OverlaySpinner />}

            <RecommendationChat initialLatLng={mapCenter} onResults={handleRecommendationResults} limit={10} />
        </LoadScript>
    );
}

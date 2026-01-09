import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import debounce from "lodash.debounce";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import type { Restaurant } from "../types/restaurant";
import { fetchRestaurantsByCity, searchRestaurants } from "../services/restaurantService";
import { searchCities } from "../services/geoService";
import { upsertMinimal } from "../storage/restaurantCache";
import { captureError, trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

type SearchItem =
    | { kind: "restaurant"; restaurant: Restaurant }
    | { kind: "city"; city: string; lat: number; lng: number };

type MapMarker =
    | { kind: "restaurant"; restaurant: Restaurant }
    | { kind: "cluster"; id: string; lat: number; lng: number; count: number };

const DEFAULT_REGION: Region = {
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 8,
    longitudeDelta: 8
};

// Google-only styling (Android by default; iOS only if you switch provider to Google).
// Kept intentionally minimal: reduce POI/labels noise so markers are easier to read.
const GOOGLE_MAP_STYLE: any[] = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
];

function buildMarkers(restaurants: Restaurant[], region: Region): MapMarker[] {
    if (restaurants.length <= 25) return restaurants.map((r) => ({ kind: "restaurant" as const, restaurant: r }));

    const grid = 10;
    const latCell = Math.max(region.latitudeDelta / grid, 0.002);
    const lngCell = Math.max(region.longitudeDelta / grid, 0.002);

    const minLat = region.latitude - region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;

    const buckets = new Map<
        string,
        {
            count: number;
            sumLat: number;
            sumLng: number;
            first: Restaurant;
        }
    >();

    for (const r of restaurants) {
        const x = Math.floor((r.lng - minLng) / lngCell);
        const y = Math.floor((r.lat - minLat) / latCell);
        const key = `${x}:${y}`;
        const prev = buckets.get(key);
        if (!prev) {
            buckets.set(key, { count: 1, sumLat: r.lat, sumLng: r.lng, first: r });
        } else {
            prev.count += 1;
            prev.sumLat += r.lat;
            prev.sumLng += r.lng;
        }
    }

    const markers: MapMarker[] = [];
    for (const [key, b] of buckets.entries()) {
        if (b.count === 1) {
            markers.push({ kind: "restaurant", restaurant: b.first });
        } else {
            markers.push({
                kind: "cluster",
                id: key,
                lat: b.sumLat / b.count,
                lng: b.sumLng / b.count,
                count: b.count
            });
        }
    }
    return markers;
}

export default function MapScreen({ navigation }: Props) {
    const mapRef = useRef<MapView | null>(null);
    const listRef = useRef<FlatList<Restaurant> | null>(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerRow}>
                    <Pressable
                        onPress={() => {
                            trackEvent({ name: "nav_open", props: { to: "Settings", from: "Map" } });
                            navigation.navigate("Settings");
                        }}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Compte</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            trackEvent({ name: "nav_open", props: { to: "MoreMenu", from: "Map" } });
                            setMoreOpen(true);
                        }}
                        style={styles.headerBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Ouvrir le menu"
                    >
                        <Text style={styles.headerBtnText}>…</Text>
                    </Pressable>
                </View>
            )
        });
    }, [navigation]);

    const [region, setRegion] = useState<Region>(DEFAULT_REGION);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedSiret, setSelectedSiret] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [citySearchUnavailable, setCitySearchUnavailable] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [minScore, setMinScore] = useState<number | null>(null);
    const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);

    const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
        const R = 6371;
        const dLat = ((b.lat - a.lat) * Math.PI) / 180;
        const dLng = ((b.lng - a.lng) * Math.PI) / 180;
        const lat1 = (a.lat * Math.PI) / 180;
        const lat2 = (b.lat * Math.PI) / 180;
        const x =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
        return R * c;
    };

    const filteredRestaurants = useMemo(() => {
        const center = { lat: region.latitude, lng: region.longitude };
        return restaurants.filter((r) => {
            if (minScore !== null && r.sanitary_score < minScore) return false;
            if (maxDistanceKm !== null) {
                const d = haversineKm(center, { lat: r.lat, lng: r.lng });
                if (d > maxDistanceKm) return false;
            }
            return true;
        });
    }, [restaurants, region.latitude, region.longitude, minScore, maxDistanceKm]);

    const markers = useMemo(
        () => buildMarkers(filteredRestaurants, region),
        [filteredRestaurants, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]
    );

    const restaurantsBySiret = useMemo(() => {
        const map = new Map<string, Restaurant>();
        for (const r of filteredRestaurants) map.set(r.siret, r);
        return map;
    }, [filteredRestaurants]);

    const selectedRestaurant = useMemo(() => {
        if (!selectedSiret) return null;
        return restaurantsBySiret.get(selectedSiret) ?? null;
    }, [restaurantsBySiret, selectedSiret]);

    const listData = useMemo(() => filteredRestaurants.slice(0, 80), [filteredRestaurants]);

    useEffect(() => {
        trackEvent({ name: "screen_view", props: { screen: "Map" } });
    }, []);

    useEffect(() => {
        void (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            trackEvent({ name: "location_permission", props: { status } });
            if (status !== "granted") return;

            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const next: Region = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                latitudeDelta: 0.25,
                longitudeDelta: 0.25
            };

            setRegion(next);
            mapRef.current?.animateToRegion(next, 350);
        })();
    }, []);

    const reverseCityFromLatLng = async (lat: number, lng: number): Promise<string | null> => {
        const url = `https://api-adresse.data.gouv.fr/reverse/?lon=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}`;
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const json: any = await res.json();
            const city = json?.features?.[0]?.properties?.city;
            return typeof city === "string" && city.trim() ? city.trim() : null;
        } catch (e) {
            captureError(e, { where: "MapScreen.reverseCityFromLatLng" });
            return null;
        }
    };

    const searchThisArea = async () => {
        trackEvent({ name: "map_search_area" });
        setLoading(true);
        try {
            const city = await reverseCityFromLatLng(region.latitude, region.longitude);
            if (!city) {
                Alert.alert("Recherche", "Impossible d’identifier la zone. Zoom un peu et réessaye.");
                return;
            }
            const data = await fetchRestaurantsByCity(city);
            setRestaurants(data);
            setSelectedSiret(null);
            trackEvent({ name: "map_search_area_results", props: { city, count: data.length } });
        } catch (e) {
            captureError(e, { where: "MapScreen.searchThisArea" });
            Alert.alert("Erreur", "Impossible de charger les restaurants pour cette zone.");
        } finally {
            setLoading(false);
        }
    };

    const runSearch = async (raw: string) => {
        const q = raw.trim();
        if (q.length < 2) {
            setResults([]);
            setCitySearchUnavailable(false);
            return;
        }

        setLoading(true);
        try {
            setCitySearchUnavailable(false);

            trackEvent({ name: "search_run", props: { q_len: q.length } });

            const [dbRestaurants, citiesResult] = await Promise.all([
                searchRestaurants(q),
                searchCities(q).then(
                    (cities) => ({ ok: true as const, cities }),
                    () => ({ ok: false as const, cities: [] })
                )
            ]);

            if (!citiesResult.ok) setCitySearchUnavailable(true);
            const cities = citiesResult.cities;

            if (!citiesResult.ok) {
                trackEvent({ name: "city_search_failed" });
            }

            const cityItems: SearchItem[] = cities.slice(0, 3).map((c) => ({
                kind: "city" as const,
                city: c.city,
                lat: c.lat,
                lng: c.lng
            }));

            const items: SearchItem[] = [
                ...dbRestaurants.map((r) => ({ kind: "restaurant" as const, restaurant: r })),
                ...cityItems
            ];

            setResults(items);
            trackEvent({
                name: "search_results",
                props: {
                    restaurants: dbRestaurants.length,
                    cities: cities.length,
                    city_api_ok: citiesResult.ok
                }
            });
        } catch (e: any) {
            // Keep previous results on transient errors.
            captureError(e, { where: "MapScreen.runSearch" });
            trackEvent({ name: "search_failed" });
        } finally {
            setLoading(false);
        }
    };

    const debounced = useMemo(() => debounce(runSearch, 350), []);

    useEffect(() => {
        debounced(query);
        return () => debounced.cancel();
    }, [query, debounced]);

    const getScoreColor = (score: number | null | undefined) => {
        const v = score === null || score === undefined ? NaN : Number(score);
        if (v === 4) return "#d11";
        if (v === 3) return "#f59e0b";
        if (v === 2) return "#22c55e";
        return "#2563eb";
    };

    const openRestaurant = async (r: Restaurant, source: "search" | "marker_callout" | "list") => {
        try {
            await upsertMinimal(r);
        } catch {
            // ignore
        }
        trackEvent({ name: "restaurant_open", props: { source } });
        navigation.navigate("Restaurant", { siret: r.siret });
    };

    const selectOnMap = (r: Restaurant, source: "marker" | "list") => {
        setSelectedSiret(r.siret);
        trackEvent({ name: "restaurant_select", props: { source } });

        const next: Region = {
            latitude: r.lat,
            longitude: r.lng,
            latitudeDelta: Math.min(region.latitudeDelta, 0.04),
            longitudeDelta: Math.min(region.longitudeDelta, 0.04)
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 300);
    };

    const selectRestaurantFromSearch = async (r: Restaurant) => {
        setRestaurants([r]);
        setSelectedSiret(r.siret);

        const next: Region = {
            latitude: r.lat,
            longitude: r.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 350);

        await openRestaurant(r, "search");
    };

    const selectCity = async (city: string, lat: number, lng: number) => {
        trackEvent({ name: "city_select", props: { source: "search" } });
        const next: Region = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.25,
            longitudeDelta: 0.25
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 350);

        setLoading(true);
        try {
            const data = await fetchRestaurantsByCity(city);
            setRestaurants(data);
            setSelectedSiret(null);
            trackEvent({ name: "city_results", props: { count: data.length } });
        } catch {
            trackEvent({ name: "city_results_failed" });
            Alert.alert("Erreur", "Impossible de charger les restaurants pour cette ville.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={(r) => {
                    mapRef.current = r;
                }}
                style={styles.map}
                initialRegion={DEFAULT_REGION}
                region={region}
                onRegionChangeComplete={setRegion}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
                showsCompass={false}
                showsUserLocation
                showsMyLocationButton={Platform.OS === "android"}
                showsPointsOfInterest={Platform.OS === "ios" ? false : undefined}
                customMapStyle={GOOGLE_MAP_STYLE}
            >
                {markers.map((m) => {
                    if (m.kind === "restaurant") {
                        const r = m.restaurant;
                        const selected = selectedSiret === r.siret;
                        return (
                            <Marker
                                key={r.siret}
                                coordinate={{ latitude: r.lat, longitude: r.lng }}
                                title={r.name}
                                description={`${r.address}, ${r.city}`}
                                pinColor={selected ? "#111" : "#2563eb"}
                                tracksViewChanges={false}
                                onPress={() => selectOnMap(r, "marker")}
                                onCalloutPress={() => void openRestaurant(r, "marker_callout")}
                                zIndex={selected ? 10 : 0}
                            />
                        );
                    }

                    return (
                        <Marker
                            key={`cluster-${m.id}`}
                            coordinate={{ latitude: m.lat, longitude: m.lng }}
                            onPress={() => {
                                const next: Region = {
                                    latitude: m.lat,
                                    longitude: m.lng,
                                    latitudeDelta: Math.max(region.latitudeDelta / 2, 0.02),
                                    longitudeDelta: Math.max(region.longitudeDelta / 2, 0.02)
                                };
                                setRegion(next);
                                mapRef.current?.animateToRegion(next, 350);
                                trackEvent({ name: "cluster_zoom", props: { count: m.count } });
                            }}
                        >
                            <View style={styles.clusterBubble}>
                                <Text style={styles.clusterText}>{m.count}</Text>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            <View style={styles.searchBox}>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Rechercher un restaurant ou une ville"
                    style={styles.input}
                    autoCapitalize="none"
                />

                <View style={styles.toolsRow}>
                    <Pressable
                        style={styles.toolBtn}
                        onPress={() => {
                            trackEvent({ name: "map_filters_open" });
                            setFiltersOpen(true);
                        }}
                    >
                        <Text style={styles.toolBtnText}>Filtres</Text>
                    </Pressable>
                    <Pressable
                        style={styles.toolBtn}
                        onPress={() => void searchThisArea()}
                    >
                        <Text style={styles.toolBtnText}>Rechercher ici</Text>
                    </Pressable>
                </View>

                {citySearchUnavailable ? (
                    <Text style={styles.hint}>Recherche de villes indisponible (API).</Text>
                ) : null}
                {loading && <ActivityIndicator />}

                {results.length > 0 && (
                    <View style={styles.results}>
                        <FlatList
                            keyboardShouldPersistTaps="handled"
                            data={results}
                            keyExtractor={(item, idx) => (item.kind === "restaurant" ? item.restaurant.siret : `${item.city}-${idx}`)}
                            renderItem={({ item }) => {
                                if (item.kind === "restaurant") {
                                    const r = item.restaurant;
                                    return (
                                        <Pressable onPress={() => void selectRestaurantFromSearch(r)} style={styles.row}>
                                            <Text style={styles.rowTitle}>{r.name}</Text>
                                            <Text style={styles.rowSub}>{r.address}, {r.city}</Text>
                                        </Pressable>
                                    );
                                }

                                return (
                                    <Pressable onPress={() => void selectCity(item.city, item.lat, item.lng)} style={styles.row}>
                                        <Text style={styles.rowTitle}>{item.city}</Text>
                                        <Text style={styles.rowSub}>Ville</Text>
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                )}
            </View>

            {listData.length > 1 && results.length === 0 ? (
                <View style={styles.bottomPanel}>
                    <View style={styles.bottomHeader}>
                        <Text style={styles.bottomTitle}>{filteredRestaurants.length} résultats</Text>
                        {selectedRestaurant ? (
                            <Pressable onPress={() => void openRestaurant(selectedRestaurant, "list")} style={styles.openBtn}>
                                <Text style={styles.openBtnText}>Ouvrir</Text>
                            </Pressable>
                        ) : null}
                    </View>

                    <FlatList
                        ref={(r) => {
                            listRef.current = r;
                        }}
                        data={listData}
                        keyExtractor={(r) => r.siret}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item, index }) => {
                            const selected = item.siret === selectedSiret;
                            return (
                                <Pressable
                                    onPress={() => {
                                        selectOnMap(item, "list");
                                        try {
                                            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
                                        } catch {
                                            // ignore
                                        }
                                    }}
                                    style={[styles.listRow, selected ? styles.listRowSelected : null]}
                                >
                                    <View style={[styles.scorePip, { backgroundColor: getScoreColor(item.sanitary_score) }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.listTitle} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.listSub} numberOfLines={1}>
                                            {item.city}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                </View>
            ) : null}

            <Modal
                visible={moreOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setMoreOpen(false)}
            >
                <Pressable style={styles.moreOverlay} onPress={() => setMoreOpen(false)}>
                    <Pressable style={styles.morePopover} onPress={() => {}}>
                        <Pressable
                            style={styles.moreItem}
                            onPress={() => {
                                setMoreOpen(false);
                                trackEvent({ name: "nav_open", props: { to: "Bookmarks", from: "Map" } });
                                navigation.navigate("Bookmarks");
                            }}
                        >
                            <Text style={styles.moreItemText}>Favoris</Text>
                        </Pressable>
                        <Pressable
                            style={styles.moreItem}
                            onPress={() => {
                                setMoreOpen(false);
                                trackEvent({ name: "nav_open", props: { to: "Visited", from: "Map" } });
                                navigation.navigate("Visited");
                            }}
                        >
                            <Text style={styles.moreItemText}>Historique</Text>
                        </Pressable>
                        <Pressable
                            style={styles.moreItem}
                            onPress={() => {
                                setMoreOpen(false);
                                trackEvent({ name: "nav_open", props: { to: "Lists", from: "Map" } });
                                navigation.navigate("Lists");
                            }}
                        >
                            <Text style={styles.moreItemText}>Listes</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={filtersOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setFiltersOpen(false)}
            >
                <Pressable style={styles.filtersOverlay} onPress={() => setFiltersOpen(false)}>
                    <Pressable style={styles.filtersCard} onPress={() => {}}>
                        <View style={styles.filtersHeader}>
                            <Text style={styles.filtersTitle}>Filtres</Text>
                            <Pressable
                                onPress={() => {
                                    setMinScore(null);
                                    setMaxDistanceKm(null);
                                    trackEvent({ name: "map_filters_clear" });
                                }}
                            >
                                <Text style={styles.filtersClear}>Réinitialiser</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.filtersLabel}>Score minimal</Text>
                        <View style={styles.filtersChips}>
                            {[null, 2, 3, 4].map((v) => {
                                const active = minScore === v;
                                const label = v === null ? "Tous" : `${v}+`;
                                return (
                                    <Pressable
                                        key={`minscore-${String(v)}`}
                                        style={[styles.chip, active ? styles.chipActive : null]}
                                        onPress={() => setMinScore(v)}
                                    >
                                        <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={styles.filtersLabel}>Distance max (depuis le centre)</Text>
                        <View style={styles.filtersChips}>
                            {[null, 5, 10, 25, 50, 100].map((v) => {
                                const active = maxDistanceKm === v;
                                const label = v === null ? "∞" : `${v} km`;
                                return (
                                    <Pressable
                                        key={`maxdist-${String(v)}`}
                                        style={[styles.chip, active ? styles.chipActive : null]}
                                        onPress={() => setMaxDistanceKm(v)}
                                    >
                                        <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <View style={{ height: 8 }} />
                        <Pressable style={styles.filtersCloseBtn} onPress={() => setFiltersOpen(false)}>
                            <Text style={styles.filtersCloseText}>Fermer</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    headerRow: { flexDirection: "row", gap: 8 },
    headerBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)"
    },
    headerBtnText: { fontWeight: "800" },
    searchBox: {
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: 10,
        gap: 8
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    toolsRow: {
        flexDirection: "row",
        gap: 8
    },
    toolBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)"
    },
    toolBtnText: { fontWeight: "800" },
    hint: {
        color: "#666",
        fontSize: 12
    },
    results: {
        maxHeight: 260,
        borderTopWidth: 1,
        borderTopColor: "#eee"
    },
    row: {
        paddingVertical: 10
    },
    rowTitle: { fontWeight: "700" },
    rowSub: { color: "#666", marginTop: 2 },
    clusterBubble: {
        minWidth: 34,
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.55)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.9)"
    },
    clusterText: {
        color: "#fff",
        fontWeight: "800"
    },
    bottomPanel: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
        maxHeight: 240,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10
    },
    bottomHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 6
    },
    bottomTitle: {
        fontWeight: "800"
    },
    openBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)"
    },
    openBtnText: {
        fontWeight: "800"
    },
    listRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10
    },
    listRowSelected: {
        backgroundColor: "rgba(0,0,0,0.04)",
        borderRadius: 10,
        paddingHorizontal: 8
    },
    scorePip: {
        width: 10,
        height: 10,
        borderRadius: 999
    },
    listTitle: { fontWeight: "800" },
    listSub: { color: "#666", marginTop: 2, fontSize: 12 },

    moreOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.08)",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        paddingTop: 92,
        paddingRight: 12
    },
    morePopover: {
        backgroundColor: "rgba(255,255,255,0.98)",
        borderRadius: 12,
        minWidth: 180,
        overflow: "hidden"
    },
    moreItem: {
        paddingVertical: 12,
        paddingHorizontal: 14
    },
    moreItemText: {
        fontWeight: "700"
    },

    filtersOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.18)",
        justifyContent: "center",
        padding: 16
    },
    filtersCard: {
        backgroundColor: "rgba(255,255,255,0.98)",
        borderRadius: 14,
        padding: 14
    },
    filtersHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10
    },
    filtersTitle: { fontWeight: "900", fontSize: 16 },
    filtersClear: { fontWeight: "800", color: "#2563eb" },
    filtersLabel: { fontWeight: "800", marginTop: 8, marginBottom: 6 },
    filtersChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)"
    },
    chipActive: {
        backgroundColor: "#111"
    },
    chipText: { fontWeight: "800" },
    chipTextActive: { color: "#fff" },
    filtersCloseBtn: {
        marginTop: 10,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.06)"
    },
    filtersCloseText: { fontWeight: "900" }
});

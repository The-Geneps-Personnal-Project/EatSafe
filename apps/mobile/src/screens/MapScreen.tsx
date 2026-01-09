import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import debounce from "lodash.debounce";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import type { Restaurant } from "../types/restaurant";
import { fetchRestaurantsByCity, searchRestaurants } from "../services/restaurantService";
import { searchCities } from "../services/geoService";
import { registerForPushNotifications, sendPushTokenToBackend } from "../services/notificationsService";
import { upsertMinimal } from "../storage/restaurantCache";
import { getPushEnabled, setPushEnabled as persistPushEnabled } from "../features/notifications/pushPrefs";
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

function buildMarkers(restaurants: Restaurant[], region: Region): MapMarker[] {
    if (restaurants.length <= 25) return restaurants.map((r) => ({ kind: "restaurant" as const, restaurant: r }));

    const grid = 10;
    const latCell = Math.max(region.latitudeDelta / grid, 0.002);
    const lngCell = Math.max(region.longitudeDelta / grid, 0.002);

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
        const x = Math.floor((r.lng + 180) / lngCell);
        const y = Math.floor((r.lat + 90) / latCell);
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

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerRow}>
                    <Pressable
                        onPress={() => {
                            trackEvent({ name: "nav_open", props: { to: "Bookmarks", from: "Map" } });
                            navigation.navigate("Bookmarks");
                        }}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Favoris</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            trackEvent({ name: "nav_open", props: { to: "Visited", from: "Map" } });
                            navigation.navigate("Visited");
                        }}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Historique</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            trackEvent({ name: "nav_open", props: { to: "Lists", from: "Map" } });
                            navigation.navigate("Lists");
                        }}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Listes</Text>
                    </Pressable>
                </View>
            )
        });
    }, [navigation]);

    const [region, setRegion] = useState<Region>(DEFAULT_REGION);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [citySearchUnavailable, setCitySearchUnavailable] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);

    const markers = useMemo(() => buildMarkers(restaurants, region), [restaurants, region.latitudeDelta, region.longitudeDelta]);

    useEffect(() => {
        trackEvent({ name: "screen_view", props: { screen: "Map" } });
        void (async () => {
            try {
                const saved = await getPushEnabled();
                setPushEnabled(saved);
            } catch {
                // ignore
            }
        })();
    }, []);

    const togglePush = async (next: boolean) => {
        setPushEnabled(next);
        void persistPushEnabled(next);

        trackEvent({ name: "push_toggle", props: { enabled: next } });
        if (!next) return;

        try {
            const token = await registerForPushNotifications();
            if (!token) {
                setPushEnabled(false);
                void persistPushEnabled(false);
                trackEvent({ name: "push_register_failed", props: { reason: "no_token" } });
                Alert.alert("Notifications", "Indisponible (permissions refusées ou simulateur). Essaye sur un téléphone.");
                return;
            }
            await sendPushTokenToBackend(token);
            trackEvent({ name: "push_register_success" });
        } catch {
            setPushEnabled(false);
            void persistPushEnabled(false);
            trackEvent({ name: "push_register_failed", props: { reason: "exception" } });
            Alert.alert("Notifications", "Impossible d'activer les notifications pour le moment.");
        }
    };

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

    const selectRestaurant = async (r: Restaurant, source: "search" | "marker") => {
        await upsertMinimal(r);
        setRestaurants([r]);

        trackEvent({ name: "restaurant_open", props: { source } });

        const next: Region = {
            latitude: r.lat,
            longitude: r.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 350);

        navigation.navigate("Restaurant", { siret: r.siret });
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
            >
                {markers.map((m) => {
                    if (m.kind === "restaurant") {
                        const r = m.restaurant;
                        return (
                            <Marker
                                key={r.siret}
                                coordinate={{ latitude: r.lat, longitude: r.lng }}
                                title={r.name}
                                description={`${r.address}, ${r.city}`}
                                onPress={() => void selectRestaurant(r, "marker")}
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
                <View style={styles.pushRow}>
                    <Text style={styles.pushLabel}>Notifications</Text>
                    <Switch value={pushEnabled} onValueChange={(v) => void togglePush(v)} />
                </View>

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Rechercher un restaurant ou une ville"
                    style={styles.input}
                    autoCapitalize="none"
                />
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
                                        <Pressable onPress={() => void selectRestaurant(r, "search")} style={styles.row}>
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
    pushRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
    },
    pushLabel: { fontWeight: "700" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
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
    }
});

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import type { RestaurantDetails } from "../types/restaurant";
import { fetchRestaurantDetailByPublicId, fetchRestaurantDetailBySiret } from "../services/restaurantService";
import { loadCachedDetailsBySiret, loadCachedMinimalBySiret, upsertFullForBookmark, upsertMinimal } from "../storage/restaurantCache";
import { useAuth } from "../auth/authState";
import { useNetwork } from "../hooks/useNetwork";
import { isBookmarked, setBookmarked } from "../storage/bookmarks";
import { isVisited, setVisited } from "../storage/visited";
import { buildShareUrl, ensurePublicIdForSiret } from "../services/shareService";
import { copyText, shareLink } from "../utils/share";
import { toErrorMessage } from "../utils/errors";
import { captureError, trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Restaurant">;

function isRestrictedGuestField(key: string) {
    return key === "reviews" || key === "photos" || key === "opening_hours";
}

export default function RestaurantScreen({ navigation, route }: Props) {
    const { publicId, siret } = route.params ?? {};
    const { isGuest } = useAuth();
    const { isOnline } = useNetwork();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
    const [minimalOffline, setMinimalOffline] = useState<{
        siret: string;
        name: string;
        address: string;
        city: string;
        sanitary_score: number | null;
    } | null>(null);

    const [bookmarked, setBookmarkedState] = useState(false);
    const [visited, setVisitedState] = useState(false);

    const title = useMemo(() => restaurant?.name ?? "Restaurant", [restaurant?.name]);

    const sharePreview = useMemo(() => {
        const baseCity = (restaurant?.city ?? minimalOffline?.city ?? "").trim();
        const sanitaryScore = restaurant?.sanitary_score ?? minimalOffline?.sanitary_score;
        const lines: string[] = [title];
        if (baseCity) lines.push(baseCity);
        if (sanitaryScore !== null && sanitaryScore !== undefined) lines.push(`Score sanitaire: ${sanitaryScore}`);
        return lines.join("\n");
    }, [title, restaurant?.city, restaurant?.sanitary_score, minimalOffline?.city, minimalOffline?.sanitary_score]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => {
                        void (async () => {
                            trackEvent({ name: "restaurant_share_tap" });
                            if (!siret && !publicId) {
                                Alert.alert("Partager", "Restaurant non partageable.");
                                return;
                            }

                            try {
                                const pid = publicId ?? (await ensurePublicIdForSiret(siret!));
                                const url = buildShareUrl(pid);
                                await shareLink(url, title, `${sharePreview}\n${url}`);
                                trackEvent({ name: "restaurant_share_success" });
                            } catch (e) {
                                captureError(e, { where: "RestaurantScreen.share" });
                                trackEvent({ name: "restaurant_share_failed" });
                                Alert.alert("Partager", toErrorMessage(e));
                            }
                        })();
                    }}
                    style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                    accessibilityRole="button"
                >
                    <Text style={{ fontWeight: "800" }}>Partager</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation, publicId, siret, title]);

    useEffect(() => {
        navigation.setOptions({ title });
    }, [navigation, title]);

    useEffect(() => {
        trackEvent({ name: "screen_view", props: { screen: "Restaurant" } });
    }, []);

    const load = async () => {
        setLoading(true);
        setLoadError(null);

        try {
            if (publicId) {
                const r = await fetchRestaurantDetailByPublicId(publicId);
                setRestaurant(r);
                await upsertMinimal(r);
                setBookmarkedState(await isBookmarked(r.siret));
                setVisitedState(await isVisited(r.siret));
                setMinimalOffline(null);

                trackEvent({ name: "restaurant_load_success", props: { by: "publicId" } });
                return;
            }

            if (!siret) {
                setLoadError("Restaurant introuvable.");
                return;
            }

            setBookmarkedState(await isBookmarked(siret));
            setVisitedState(await isVisited(siret));

            const cached = await loadCachedDetailsBySiret(siret);
            if (cached) {
                setRestaurant(cached);
                setMinimalOffline(null);
                trackEvent({ name: "restaurant_load_success", props: { by: "cache" } });
                return;
            }

            try {
                const r = await fetchRestaurantDetailBySiret(siret);
                setRestaurant(r);
                setMinimalOffline(null);
                await upsertMinimal(r);
                trackEvent({ name: "restaurant_load_success", props: { by: "siret" } });
            } catch (e) {
                const minimal = await loadCachedMinimalBySiret(siret);
                if (minimal) {
                    setRestaurant(null);
                    setMinimalOffline({
                        siret: minimal.siret,
                        name: minimal.name,
                        address: minimal.address,
                        city: minimal.city,
                        sanitary_score: minimal.sanitary_score,
                    });

                    trackEvent({ name: "restaurant_load_partial_offline", props: { by: "cached_minimal" } });
                } else {
                    captureError(e, { where: "RestaurantScreen.load" });
                    trackEvent({ name: "restaurant_load_failed", props: { by: "siret" } });
                    setLoadError(toErrorMessage(e));
                }
            }
        } catch (e: any) {
            const msg = toErrorMessage(e);
            setLoadError(msg);
            captureError(e, { where: "RestaurantScreen.load.outer" });
            trackEvent({ name: "restaurant_load_failed", props: { by: publicId ? "publicId" : (siret ? "siret" : "none") } });
            Alert.alert("Erreur", msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [publicId, siret]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    if (!restaurant && !minimalOffline) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorTitle}>Impossible de charger</Text>
                {loadError ? <Text style={styles.errorBody}>{loadError}</Text> : null}
                <View style={{ height: 10 }} />
                <Button title="Réessayer" onPress={() => void load()} />
            </View>
        );
    }

    const RestrictedInfo = () => (
        <View style={styles.restricted}>
            <View style={styles.restrictedHeaderRow}>
                <Text style={styles.restrictedTitle}>Informations limitées</Text>
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            "Pourquoi certaines infos sont limitées ?",
                            "En mode invité ou hors-ligne, certaines données (avis, photos, horaires, actions) ne sont pas disponibles.\n\nPour garder toutes les infos hors-ligne, ajoute le restaurant en favoris."
                        );
                    }}
                    accessibilityRole="button"
                >
                    <Text style={styles.questionMark}>?</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.restrictedBody}>
                Certaines informations sont disponibles uniquement en mode connecté.
                Pour un accès complet (et un mode hors-ligne complet), ajoutez ce restaurant en favoris.
            </Text>
            <Button title="Se connecter / Créer un compte" onPress={() => navigation.navigate("Auth")} />
        </View>
    );

    const base = restaurant ?? minimalOffline;
    const sanitary = base?.sanitary_score ?? "—";

    const activeSiret = restaurant?.siret ?? minimalOffline?.siret ?? siret;

    const toggleBookmark = async () => {
        if (isGuest) {
            trackEvent({ name: "guest_blocked_action", props: { action: "bookmark" } });
            navigation.navigate("Auth");
            return;
        }

        if (!activeSiret) return;
        const next = !bookmarked;
        await setBookmarked(activeSiret, next);
        setBookmarkedState(next);

        trackEvent({ name: "bookmark_toggle", props: { enabled: next } });

        if (next) {
            // Ensure we persist full details for offline if possible.
            try {
                const r = restaurant ?? (await fetchRestaurantDetailBySiret(activeSiret));
                setRestaurant(r);
                setMinimalOffline(null);
                await upsertFullForBookmark(r, true);
            } catch {
                // If offline, we keep the bookmark flag and will fill details later.
                trackEvent({ name: "bookmark_fill_failed" });
            }
        }
    };

    const toggleVisited = async () => {
        if (isGuest) {
            trackEvent({ name: "guest_blocked_action", props: { action: "visited" } });
            navigation.navigate("Auth");
            return;
        }
        if (!activeSiret) return;
        const next = !visited;
        await setVisited(activeSiret, next);
        setVisitedState(next);

        trackEvent({ name: "visited_toggle", props: { enabled: next } });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {!isOnline ? (
                <Text style={styles.offlineBanner}>Mode hors-ligne</Text>
            ) : null}

            <Text style={styles.name}>{base!.name}</Text>
            <Text style={styles.addr}>{base!.address}, {base!.city}</Text>
            <Text style={styles.score}>Score sanitaire: {sanitary}</Text>

            {isGuest ? <RestrictedInfo /> : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Détails</Text>
                {restaurant ? (
                    Object.entries(restaurant).map(([k, v]) => {
                        if (k === "name" || k === "address" || k === "city" || k === "sanitary_score" || k === "lat" || k === "lng") return null;
                        if (isGuest && isRestrictedGuestField(k)) return null;
                        if (v === null || v === undefined) return null;
                        return (
                            <Text key={k} style={styles.kv}>
                                {k}: {typeof v === "string" || typeof v === "number" ? String(v) : "[objet]"}
                            </Text>
                        );
                    })
                ) : (
                    <Text style={styles.kv}>Informations détaillées indisponibles hors-ligne.</Text>
                )}
            </View>

            <View style={styles.section}>
                <Button
                    title={isGuest ? "Favoris (compte requis)" : (bookmarked ? "Retirer des favoris" : "Ajouter aux favoris")}
                    onPress={() => {
                        void toggleBookmark();
                    }}
                />

                <View style={{ height: 10 }} />

                <Button
                    title={isGuest ? "J’ai visité (compte requis)" : (visited ? "Visité ✅" : "J’ai visité")}
                    onPress={() => {
                        void toggleVisited();
                    }}
                />

                <View style={{ height: 10 }} />

                <Button
                    title={isGuest ? "Ajouter à une liste (compte requis)" : "Ajouter à une liste"}
                    onPress={() => {
                        if (isGuest) {
                            navigation.navigate("Auth");
                            return;
                        }
                        if (!activeSiret) {
                            Alert.alert("Listes", "Restaurant introuvable.");
                            return;
                        }
                        navigation.navigate("Lists", { pickForSiret: activeSiret });
                    }}
                />

                <View style={{ height: 10 }} />

                <Button
                    title="Copier le lien"
                    onPress={() => {
                        void (async () => {
                            trackEvent({ name: "restaurant_copy_tap" });
                            if (!siret && !publicId) {
                                Alert.alert("Copier", "Restaurant non copiable.");
                                return;
                            }

                            try {
                                const pid = publicId ?? (await ensurePublicIdForSiret(siret!));
                                const url = buildShareUrl(pid);
                                await copyText(url);
                                trackEvent({ name: "restaurant_copy_success" });
                                Alert.alert("Copier", "Lien copié.");
                            } catch (e) {
                                captureError(e, { where: "RestaurantScreen.copy" });
                                trackEvent({ name: "restaurant_copy_failed" });
                                Alert.alert("Copier", toErrorMessage(e));
                            }
                        })();
                    }}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 10 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorTitle: { fontSize: 16, fontWeight: "800" },
    errorBody: { marginTop: 6, color: "#444", textAlign: "center" },
    name: { fontSize: 22, fontWeight: "800" },
    addr: { color: "#444" },
    score: { fontWeight: "700" },
    offlineBanner: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#eee",
        color: "#333",
        fontWeight: "700"
    },
    restricted: {
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#f0c36d",
        backgroundColor: "#fff7e6",
        gap: 8
    },
    restrictedHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    restrictedTitle: { fontWeight: "800" },
    questionMark: {
        width: 26,
        height: 26,
        borderRadius: 13,
        textAlign: "center",
        textAlignVertical: "center",
        backgroundColor: "rgba(0,0,0,0.08)",
        overflow: "hidden",
        fontWeight: "800"
    },
    restrictedBody: { color: "#444" },
    section: { marginTop: 10, gap: 6 },
    sectionTitle: { fontSize: 16, fontWeight: "800" },
    kv: { color: "#333" }
});

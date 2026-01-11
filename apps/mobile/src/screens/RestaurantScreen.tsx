import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import type { RestaurantDetails } from "../types/restaurant";
import { fetchRestaurantDetailByPublicId, fetchRestaurantDetailBySiret } from "../services/restaurantService";
import { loadCachedDetailsBySiret, loadCachedMinimalBySiret, upsertFullForBookmark, upsertMinimal } from "../storage/restaurantCache";
import { useAuth } from "../auth/authState";
import { useNetwork } from "../hooks/useNetwork";
import { isBookmarked, setBookmarked } from "../storage/bookmarks";
import { isVisited, setVisited } from "../storage/visited";
import { addRestaurantToList, createList, listIdsForRestaurant, listLists, removeRestaurantFromList, type ListRow } from "../storage/lists";
import { requestPinnedDetailsSync } from "../features/sync/pinnedSyncRequests";
import { buildShareUrl, ensurePublicIdForSiret } from "../services/shareService";
import { copyText, shareLink } from "../utils/share";
import { toErrorMessage } from "../utils/errors";
import { captureError, trackEvent } from "../telemetry/telemetry";
import { isDemoMode } from "../config/mode";
import { deleteRestaurantNote, getRestaurantNote, upsertRestaurantNote } from "../storage/notes";

type Props = NativeStackScreenProps<RootStackParamList, "Restaurant">;

function isRestrictedGuestField(key: string) {
    return key === "reviews" || key === "photos" || key === "opening_hours";
}

function formatDateFr(value?: string) {
    if (!value) return null;
    // Accepts ISO-ish strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
    const match = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
}

function Stars({ rating }: { rating: number }) {
    const clamped = Math.max(0, Math.min(5, Math.round(rating)));
    const full = "★".repeat(clamped);
    const empty = "☆".repeat(5 - clamped);
    return (
        <Text style={styles.stars}>
            {full}
            <Text style={styles.starsEmpty}>{empty}</Text>
        </Text>
    );
}

export default function RestaurantScreen({ navigation, route }: Props) {
    const { publicId, siret } = route.params ?? {};
    const { isGuest } = useAuth();
    const { isOnline } = useNetwork();
    const demoMode = isDemoMode();

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

    const [listsModalOpen, setListsModalOpen] = useState(false);
    const [listsLoading, setListsLoading] = useState(false);
    const [lists, setLists] = useState<ListRow[]>([]);
    const [listIdSet, setListIdSet] = useState<Set<number>>(new Set());
    const [newListName, setNewListName] = useState("");

    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteDraft, setNoteDraft] = useState("");
    const [ratingDraft, setRatingDraft] = useState<number | null>(null);
    const [savedNote, setSavedNote] = useState<{
        rating: number | null;
        note: string;
        updated_at: number;
    } | null>(null);

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
    const sanitaryLabel = restaurant?.sanitary_score_label;
    const inspectionDate = formatDateFr(restaurant?.inspection_date);

    const activeSiret = restaurant?.siret ?? minimalOffline?.siret ?? siret;

    const refreshSavedNote = useCallback(async () => {
        if (!activeSiret) return;
        try {
            const row = await getRestaurantNote(activeSiret);
            setSavedNote(row ? { rating: row.rating, note: row.note, updated_at: row.updated_at } : null);
        } catch (e) {
            captureError(e, { where: "RestaurantScreen.refreshSavedNote" });
        }
    }, [activeSiret]);

    useEffect(() => {
        void refreshSavedNote();
    }, [refreshSavedNote]);

    const refreshListsState = async (forSiret: string) => {
        setListsLoading(true);
        try {
            const [allLists, ids] = await Promise.all([listLists(), listIdsForRestaurant(forSiret)]);
            setLists(allLists);
            setListIdSet(new Set(ids));
        } finally {
            setListsLoading(false);
        }
    };

    const openListsModal = async () => {
        if (isGuest && !demoMode) {
            trackEvent({ name: "guest_blocked_action", props: { action: "lists" } });
            navigation.navigate("Auth");
            return;
        }
        if (!activeSiret) {
            Alert.alert("Listes", "Restaurant introuvable.");
            return;
        }

        trackEvent({ name: "lists_modal_open" });
        setListsModalOpen(true);
        try {
            await refreshListsState(activeSiret);
        } catch (e) {
            captureError(e, { where: "RestaurantScreen.openListsModal" });
            Alert.alert("Listes", toErrorMessage(e));
        }
    };

    const openNoteModal = async () => {
        if (isGuest && !demoMode) {
            trackEvent({ name: "guest_blocked_action", props: { action: "note" } });
            navigation.navigate("Auth");
            return;
        }
        if (!activeSiret) {
            Alert.alert("Ma note", "Restaurant introuvable.");
            return;
        }

        try {
            const row = await getRestaurantNote(activeSiret);
            setNoteDraft(row?.note ?? "");
            setRatingDraft(row?.rating ?? null);
        } catch (e) {
            captureError(e, { where: "RestaurantScreen.openNoteModal" });
        }

        trackEvent({ name: "note_modal_open" });
        setNoteModalOpen(true);
    };

    const saveNote = async () => {
        if (!activeSiret) return;
        setNoteSaving(true);
        try {
            const text = noteDraft.trim();
            const rating = ratingDraft;

            if (!text && (rating === null || rating === undefined)) {
                await deleteRestaurantNote(activeSiret);
                setSavedNote(null);
                setNoteModalOpen(false);
                trackEvent({ name: "note_deleted" });
                return;
            }

            await upsertRestaurantNote(activeSiret, rating ?? null, text);
            await refreshSavedNote();
            setNoteModalOpen(false);
            trackEvent({ name: "note_saved", props: { hasText: Boolean(text), rating: rating ?? null } });
        } catch (e) {
            captureError(e, { where: "RestaurantScreen.saveNote" });
            Alert.alert("Ma note", "Impossible d’enregistrer la note.");
        } finally {
            setNoteSaving(false);
        }
    };

    const toggleListMembership = async (listId: number) => {
        if (!activeSiret) return;

        const wasIn = listIdSet.has(listId);
        const optimistic = new Set(listIdSet);
        if (wasIn) optimistic.delete(listId);
        else optimistic.add(listId);
        setListIdSet(optimistic);

        trackEvent({ name: "list_membership_toggle", props: { enabled: !wasIn } });

        try {
            if (wasIn) await removeRestaurantFromList(listId, activeSiret);
            else {
                await addRestaurantToList(listId, activeSiret);
                requestPinnedDetailsSync("list_add");
            }
        } catch (e) {
            const rollback = new Set(optimistic);
            if (wasIn) rollback.add(listId);
            else rollback.delete(listId);
            setListIdSet(rollback);
            captureError(e, { where: "RestaurantScreen.toggleListMembership" });
            Alert.alert("Listes", toErrorMessage(e));
        }
    };

    const createListAndAdd = async () => {
        if (!activeSiret) return;
        const trimmed = newListName.trim();
        if (!trimmed) {
            Alert.alert("Listes", "Nom de liste requis.");
            return;
        }

        setListsLoading(true);
        try {
            const row = await createList(trimmed);
            await addRestaurantToList(row.id, activeSiret);
            requestPinnedDetailsSync("list_add");
            setNewListName("");
            await refreshListsState(activeSiret);
        } catch (e) {
            captureError(e, { where: "RestaurantScreen.createListAndAdd" });
            Alert.alert("Listes", toErrorMessage(e));
        } finally {
            setListsLoading(false);
        }
    };

    const toggleBookmark = async () => {
        if (isGuest && !demoMode) {
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

            // Best-effort: if details were missing (or couldn't be fetched), hydrate as soon as we're online.
            requestPinnedDetailsSync("bookmark");
        }
    };

    const toggleVisited = async () => {
        if (isGuest && !demoMode) {
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
            <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>Score: {sanitary}</Text>
                </View>
                {sanitaryLabel ? (
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>{sanitaryLabel}</Text>
                    </View>
                ) : null}
                {inspectionDate ? (
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>Inspecté: {inspectionDate}</Text>
                    </View>
                ) : null}
                {restaurant?.opening_hours && (!isGuest || demoMode) ? (
                    <View style={[styles.metaPill, restaurant.opening_hours.open_now ? styles.metaPillOpen : styles.metaPillClosed]}>
                        <Text style={styles.metaPillText}>{restaurant.opening_hours.open_now ? "Ouvert" : "Fermé"}</Text>
                    </View>
                ) : null}
            </View>

            {isGuest && !demoMode ? <RestrictedInfo /> : null}

            {restaurant?.opening_hours && (!isGuest || demoMode) ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Horaires</Text>
                    {restaurant.opening_hours.weekdayDescriptions?.length ? (
                        restaurant.opening_hours.weekdayDescriptions.map((line, idx) => (
                            <Text key={`${idx}-${line}`} style={styles.kv}>{line}</Text>
                        ))
                    ) : (
                        <Text style={styles.kv}>Horaires indisponibles.</Text>
                    )}
                </View>
            ) : null}

            {restaurant?.photos && (!isGuest || demoMode) ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    {restaurant.photos.some((p) => "url" in p && Boolean((p as any).url)) ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                            {restaurant.photos
                                .filter((p): p is { url: string } => ("url" in p) && Boolean((p as any).url))
                                .slice(0, 12)
                                .map((p, idx) => (
                                    <Image
                                        key={`${idx}-${p.url}`}
                                        source={{ uri: p.url }}
                                        style={styles.photo}
                                    />
                                ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.kv}>Photos indisponibles.</Text>
                    )}
                </View>
            ) : null}

            {restaurant?.reviews && (!isGuest || demoMode) ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Avis</Text>
                    {restaurant.reviews.length ? (
                        restaurant.reviews.slice(0, 10).map((r, idx) => (
                            <View key={`${idx}-${r.author_name}`} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                                    <Stars rating={r.rating} />
                                </View>
                                {r.relative_time_description ? (
                                    <Text style={styles.reviewTime}>{r.relative_time_description}</Text>
                                ) : null}
                                {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.kv}>Aucun avis.</Text>
                    )}
                </View>
            ) : null}

            {restaurant && __DEV__ ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Debug (dev)</Text>
                    {Object.entries(restaurant).map(([k, v]) => {
                        if (k === "name" || k === "address" || k === "city" || k === "sanitary_score" || k === "lat" || k === "lng") return null;
                        if (isGuest && isRestrictedGuestField(k)) return null;
                        if (v === null || v === undefined) return null;
                        if (typeof v === "object") return null;
                        return (
                            <Text key={k} style={styles.kv}>
                                {k}: {String(v)}
                            </Text>
                        );
                    })}
                </View>
            ) : null}

            <View style={styles.section}>
                {savedNote ? (
                    <View style={styles.noteSummary}>
                        <Text style={styles.noteSummaryTitle}>Ma note</Text>
                        <Text style={styles.noteSummaryBody} numberOfLines={2}>
                            {savedNote.rating ? `Note: ${savedNote.rating}/5` : ""}
                            {savedNote.rating && savedNote.note ? " · " : ""}
                            {savedNote.note ? savedNote.note : ""}
                        </Text>
                    </View>
                ) : null}

                <Button
                    title={isGuest && !demoMode
                        ? "Favoris (compte requis)"
                        : (bookmarked ? "Retirer des favoris" : "Ajouter aux favoris")}
                    onPress={() => {
                        void toggleBookmark();
                    }}
                />

                <View style={{ height: 10 }} />

                <Button
                    title={isGuest && !demoMode
                        ? "J’ai visité (compte requis)"
                        : (visited ? "Visité ✅" : "J’ai visité")}
                    onPress={() => {
                        void toggleVisited();
                    }}
                />

                <View style={{ height: 10 }} />

                <Button
                    title={isGuest && !demoMode ? "Ajouter à une liste (compte requis)" : "Ajouter à une liste"}
                    onPress={() => {
                        void openListsModal();
                    }}
                />

                <View style={{ height: 10 }} />

                <Button
                    title={isGuest && !demoMode ? "Ma note (compte requis)" : (savedNote ? "Modifier ma note" : "Ajouter une note")}
                    onPress={() => {
                        void openNoteModal();
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

            <Modal
                visible={listsModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setListsModalOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setListsModalOpen(false)} />
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Listes</Text>
                        <TouchableOpacity onPress={() => setListsModalOpen(false)} accessibilityRole="button">
                            <Text style={styles.modalClose}>Fermer</Text>
                        </TouchableOpacity>
                    </View>

                    {listsLoading ? (
                        <View style={{ paddingVertical: 18 }}>
                            <ActivityIndicator />
                        </View>
                    ) : (
                        <>
                            <View style={styles.modalCreateRow}>
                                <TextInput
                                    value={newListName}
                                    onChangeText={setNewListName}
                                    placeholder="Nouvelle liste"
                                    autoCapitalize="sentences"
                                    style={styles.modalInput}
                                />
                                <TouchableOpacity
                                    onPress={() => void createListAndAdd()}
                                    style={styles.modalAddButton}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.modalAddButtonText}>Créer</Text>
                                </TouchableOpacity>
                            </View>

                            {lists.length ? (
                                <View style={styles.modalList}>
                                    {lists.map((l) => {
                                        const enabled = listIdSet.has(l.id);
                                        return (
                                            <TouchableOpacity
                                                key={l.id}
                                                style={styles.modalListRow}
                                                onPress={() => void toggleListMembership(l.id)}
                                                accessibilityRole="button"
                                            >
                                                <Text style={styles.modalListName}>{l.name}</Text>
                                                <View style={[styles.modalChip, enabled ? styles.modalChipOn : styles.modalChipOff]}>
                                                    <Text style={styles.modalChipText}>{enabled ? "Ajouté" : "Ajouter"}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <Text style={styles.modalEmpty}>Aucune liste. Créez-en une ci-dessus.</Text>
                            )}
                        </>
                    )}
                </View>
            </Modal>

            <Modal
                visible={noteModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setNoteModalOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setNoteModalOpen(false)} />
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Ma note</Text>
                        <TouchableOpacity onPress={() => setNoteModalOpen(false)} accessibilityRole="button">
                            <Text style={styles.modalClose}>Fermer</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalHint}>Note (optionnel)</Text>
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((n) => {
                            const on = ratingDraft === n;
                            return (
                                <TouchableOpacity
                                    key={n}
                                    onPress={() => setRatingDraft(on ? null : n)}
                                    style={[styles.ratingChip, on ? styles.ratingChipOn : styles.ratingChipOff]}
                                    accessibilityRole="button"
                                >
                                    <Text style={[styles.ratingChipText, on ? styles.ratingChipTextOn : styles.ratingChipTextOff]}>{n}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.modalHint}>Commentaire (optionnel)</Text>
                    <TextInput
                        value={noteDraft}
                        onChangeText={setNoteDraft}
                        placeholder="Ex: Plutôt propre, service ok, à retenter..."
                        style={styles.noteInput}
                        multiline
                    />

                    <View style={{ height: 12 }} />
                    <View style={styles.modalActionsRow}>
                        <TouchableOpacity
                            onPress={() => {
                                void (async () => {
                                    if (!activeSiret) return;
                                    try {
                                        setNoteSaving(true);
                                        await deleteRestaurantNote(activeSiret);
                                        setSavedNote(null);
                                        setNoteDraft("");
                                        setRatingDraft(null);
                                        setNoteModalOpen(false);
                                        trackEvent({ name: "note_deleted" });
                                    } catch (e) {
                                        captureError(e, { where: "RestaurantScreen.deleteNote" });
                                        Alert.alert("Ma note", "Impossible de supprimer la note.");
                                    } finally {
                                        setNoteSaving(false);
                                    }
                                })();
                            }}
                            style={[styles.modalActionBtn, styles.modalActionBtnDanger]}
                            accessibilityRole="button"
                            disabled={noteSaving}
                        >
                            <Text style={styles.modalActionBtnText}>Supprimer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => void saveNote()}
                            style={[styles.modalActionBtn, styles.modalActionBtnPrimary]}
                            accessibilityRole="button"
                            disabled={noteSaving}
                        >
                            <Text style={styles.modalActionBtnText}>{noteSaving ? "Enregistrement…" : "Enregistrer"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    metaPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#f2f2f2",
        borderWidth: 1,
        borderColor: "#e3e3e3",
    },
    metaPillOpen: { backgroundColor: "#e7f8ee", borderColor: "#bfe8cf" },
    metaPillClosed: { backgroundColor: "#fdecec", borderColor: "#f5c2c7" },
    metaPillText: { fontWeight: "800", color: "#222" },
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
    kv: { color: "#333" },
    photosRow: { gap: 10, paddingVertical: 4 },
    photo: { width: 220, height: 140, borderRadius: 12, backgroundColor: "#eee" },
    reviewCard: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#eee",
        gap: 6,
    },
    reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    reviewAuthor: { fontWeight: "800", flexShrink: 1 },
    reviewTime: { color: "#666" },
    reviewText: { color: "#222" },
    stars: { fontWeight: "800" },
    starsEmpty: { color: "#bbb" },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalCard: {
        position: "absolute",
        left: 16,
        right: 16,
        top: 120,
        borderRadius: 14,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#eee",
        padding: 14,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    modalTitle: { fontSize: 16, fontWeight: "800" },
    modalClose: { fontWeight: "800", color: "#333" },
    modalCreateRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 12 },
    modalInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fafafa",
    },
    modalAddButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: "#111",
    },
    modalAddButtonText: { color: "#fff", fontWeight: "800" },
    modalList: { gap: 8 },
    modalListRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
    },
    modalListName: { fontWeight: "800", color: "#222", flexShrink: 1, paddingRight: 10 },
    modalChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    modalChipOn: { backgroundColor: "#e7f8ee", borderColor: "#bfe8cf" },
    modalChipOff: { backgroundColor: "#f2f2f2", borderColor: "#e3e3e3" },
    modalChipText: { fontWeight: "800", color: "#222" },
    modalEmpty: { color: "#444" },

    noteSummary: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        gap: 4,
    },
    noteSummaryTitle: { fontWeight: "800", color: "#111" },
    noteSummaryBody: { color: "#444" },

    modalHint: { color: "#444", fontWeight: "700", marginBottom: 6 },
    ratingRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    ratingChip: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    ratingChipOn: { backgroundColor: "#111", borderColor: "#111" },
    ratingChipOff: { backgroundColor: "#fff", borderColor: "#e5e5e5" },
    ratingChipText: { fontWeight: "800" },
    ratingChipTextOn: { color: "#fff" },
    ratingChipTextOff: { color: "#111" },
    noteInput: {
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fafafa",
        minHeight: 110,
        textAlignVertical: "top",
    },
    modalActionsRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
    modalActionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    modalActionBtnPrimary: { backgroundColor: "#111" },
    modalActionBtnDanger: { backgroundColor: "#b00020" },
    modalActionBtnText: { color: "#fff", fontWeight: "800" },
});

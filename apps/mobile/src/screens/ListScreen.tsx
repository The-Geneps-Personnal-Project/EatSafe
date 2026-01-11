import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { isDemoMode } from "../config/mode";
import {
  deleteList,
  listRestaurantsInList,
  removeRestaurantFromList,
  type ListItemRow,
} from "../storage/lists";
import { requestPinnedDetailsSync } from "../features/sync/pinnedSyncRequests";
import { trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "List">;

export default function ListScreen({ navigation, route }: Props) {
  const { listId, name } = route.params;
  const { isGuest } = useAuth();
  const demoMode = isDemoMode();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ListItemRow[]>([]);

  useLayoutEffect(() => {
    if (isGuest && !demoMode) {
      navigation.setOptions({ title: name, headerRight: undefined });
      return;
    }

    navigation.setOptions({
      title: name,
      headerRight: () => (
        <Pressable
          onPress={() => {
            Alert.alert(
              "Supprimer la liste",
              "Supprimer cette liste ? Cette action est irréversible.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer",
                  style: "destructive",
                  onPress: () => {
                    void (async () => {
                      trackEvent({ name: "list_delete_tap" });
                      await deleteList(listId);
                      trackEvent({ name: "list_delete_success" });
                      navigation.goBack();
                    })();
                  },
                },
              ]
            );
          }}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: "800", color: "#b00020" }}>Supprimer</Text>
        </Pressable>
      ),
    });
  }, [isGuest, listId, name, navigation]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      requestPinnedDetailsSync("manual");
      const rows = await listRestaurantsInList(listId);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "List" } });
    requestPinnedDetailsSync("manual");
    void refresh();
  }, [refresh]);

  const hasIncomplete = items.some(
    (it) => !it.name?.trim() || !it.address?.trim() || !it.city?.trim()
  );

  if (isGuest && !demoMode) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Liste</Text>
        <Text style={styles.body}>Connecte-toi pour accéder à tes listes.</Text>
        <View style={{ height: 12 }} />
        <Button title="Se connecter" onPress={() => navigation.navigate("Auth")} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasIncomplete ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Certaines fiches sont en cours de téléchargement. Tirez pour rafraîchir.
          </Text>
        </View>
      ) : null}

      <View style={styles.listActionsBar}>
        <Pressable
          style={[styles.showAllBtn, items.length === 0 && styles.showAllBtnDisabled]}
          disabled={items.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Afficher toute la liste sur la carte"
          onPress={() => {
            const uniqueSirets = Array.from(new Set(items.map((it) => it.siret))).filter(Boolean);
            trackEvent({
              name: "nav_open",
              props: { to: "Map", from: "List", action: "focus_sirets", count: uniqueSirets.length },
            });
            navigation.navigate("Map", { focusSirets: uniqueSirets });
          }}
        >
          <MaterialIcons name="place" size={20} color={items.length ? "#2563eb" : "#9ca3af"} />
          <Text style={[styles.showAllBtnText, items.length === 0 && styles.showAllBtnTextDisabled]}>
            Tout voir sur la carte
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.siret}
        onRefresh={() => void refresh()}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.body}>Liste vide.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => navigation.navigate("Restaurant", { siret: item.siret })}
            >
              <View style={styles.rowBody}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name?.trim() ? item.name : "Restaurant (en cours…)"}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.address?.trim() || item.city?.trim()
                    ? `${item.address || ""}${item.city ? `, ${item.city}` : ""}`
                    : `SIRET: ${item.siret}`}
                </Text>
                {item.note_rating !== null || (item.note_text && item.note_text.trim()) ? (
                  <View style={styles.badgesRow}>
                    <Text style={styles.noteBadge} numberOfLines={1}>
                      {item.note_rating !== null ? `Ma note: ${item.note_rating}/5` : "Ma note"}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.sub}>Score: {item.sanitary_score ?? "—"}</Text>
              </View>
            </Pressable>

            <View style={styles.rowActions}>
              <Pressable
                style={[styles.iconBtn, styles.iconBtnPrimary]}
                accessibilityRole="button"
                accessibilityLabel="Voir sur la carte"
                onPress={() => {
                  trackEvent({ name: "nav_open", props: { to: "Map", from: "List", action: "focus_siret" } });
                  navigation.navigate("Map", { focusSiret: item.siret });
                }}
              >
                <MaterialIcons name="place" size={20} color="#2563eb" />
              </Pressable>

              <Pressable
                style={[styles.iconBtn, styles.iconBtnDanger]}
                accessibilityRole="button"
                accessibilityLabel="Retirer de la liste"
                onPress={() => {
                  void (async () => {
                    await removeRestaurantFromList(listId, item.siret);
                    await refresh();
                  })();
                }}
              >
                <Text style={[styles.iconText, styles.iconTextDanger]}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff7e6",
    borderBottomWidth: 1,
    borderBottomColor: "#f0c36d",
  },
  bannerText: { color: "#444", fontWeight: "700" },
  listActionsBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
  },
  showAllBtnDisabled: {
    backgroundColor: "#f3f4f6",
  },
  showAllBtnText: {
    fontWeight: "800",
    color: "#1d4ed8",
  },
  showAllBtnTextDisabled: {
    color: "#6b7280",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800" },
  body: { color: "#444", textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPrimary: {
    backgroundColor: "#dbeafe",
  },
  iconBtnDanger: {
    backgroundColor: "#fee2e2",
  },
  iconText: {
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 16,
  },
  iconTextDanger: {
    color: "#b00020",
  },
  rowBody: { gap: 2 },
  name: { fontWeight: "800" },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  noteBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    color: "#3730a3",
    fontWeight: "800",
  },
  sub: { color: "#666" },
});

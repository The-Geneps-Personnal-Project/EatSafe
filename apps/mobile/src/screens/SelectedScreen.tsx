import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { listRestaurantsInAnyList, type ListItemRow } from "../storage/lists";
import { requestPinnedDetailsSync } from "../features/sync/pinnedSyncRequests";
import { trackEvent } from "../telemetry/telemetry";
import { isDemoMode } from "../config/mode";

type Props = NativeStackScreenProps<RootStackParamList, "Selected">;

export default function SelectedScreen({ navigation }: Props) {
  const { isGuest } = useAuth();
  const demoMode = isDemoMode();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ListItemRow[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Sélectionnés" });
  }, [navigation]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      requestPinnedDetailsSync("manual");
      const rows = await listRestaurantsInAnyList();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "Selected" } });
    requestPinnedDetailsSync("manual");
    void refresh();
  }, [refresh]);

  const hasIncomplete = items.some(
    (it) => !it.name?.trim() || !it.address?.trim() || !it.city?.trim()
  );

  if (isGuest && !demoMode) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sélectionnés</Text>
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
      <FlatList
        data={items}
        keyExtractor={(it) => it.siret}
        onRefresh={() => void refresh()}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.body}>Aucun restaurant sélectionné pour le moment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("Restaurant", { siret: item.siret })}
          >
            <View style={styles.rowBody}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name?.trim() ? item.name : "Restaurant (en cours…)"}
              </Text>
              {item.note_rating !== null || (item.note_text && item.note_text.trim()) ? (
                <View style={styles.badgesRow}>
                  <Text style={styles.noteBadge} numberOfLines={1}>
                    {item.note_rating !== null ? `Ma note: ${item.note_rating}/5` : "Ma note"}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.sub} numberOfLines={1}>
                {item.address?.trim() || item.city?.trim()
                  ? `${item.address || ""}${item.city ? `, ${item.city}` : ""}`
                  : `SIRET: ${item.siret}`}
              </Text>
              <Text style={styles.sub}>Score: {item.sanitary_score ?? "—"}</Text>
            </View>
          </Pressable>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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

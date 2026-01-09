import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { listBookmarkedRestaurants, type BookmarkedRow } from "../storage/bookmarksQuery";
import { captureError, trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Bookmarks">;

export default function BookmarksScreen({ navigation }: Props) {
  const { isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BookmarkedRow[]>([]);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "Bookmarks" } });
  }, []);

  useEffect(() => {
    if (!isGuest) return;
    trackEvent({ name: "guest_blocked_view", props: { screen: "Bookmarks" } });
  }, [isGuest]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listBookmarkedRestaurants();
      setItems(rows);
      trackEvent({ name: "bookmarks_loaded", props: { count: rows.length } });
    } catch (e) {
      captureError(e, { where: "BookmarksScreen.refresh" });
      trackEvent({ name: "bookmarks_load_failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (isGuest) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Favoris</Text>
        <Text style={styles.body}>
          Connecte-toi pour accéder à tes favoris.
        </Text>
        <View style={{ height: 12 }} />
        <Button
          title="Se connecter"
          onPress={() => {
            trackEvent({ name: "nav_open", props: { to: "Auth", from: "Bookmarks" } });
            navigation.navigate("Auth");
          }}
        />
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
      <FlatList
        data={items}
        keyExtractor={(it) => it.siret}
        onRefresh={() => void refresh()}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.body}>Aucun favori pour l’instant.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              trackEvent({ name: "restaurant_open", props: { source: "bookmarks_list" } });
              navigation.navigate("Restaurant", { siret: item.siret });
            }}
          >
            <View style={styles.thumb} />
            <View style={styles.rowBody}>
              <Text style={styles.name} numberOfLines={1}>{item.name || "Restaurant"}</Text>
              <Text style={styles.sub} numberOfLines={1}>{item.address}{item.city ? `, ${item.city}` : ""}</Text>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "800" },
  body: { color: "#444", textAlign: "center" },
  row: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center"
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#e9e9e9"
  },
  rowBody: { flex: 1, gap: 2 },
  name: { fontWeight: "800" },
  sub: { color: "#666" }
});

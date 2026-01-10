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
import { trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Selected">;

export default function SelectedScreen({ navigation }: Props) {
  const { isGuest } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ListItemRow[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Sélectionnés" });
  }, [navigation]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listRestaurantsInAnyList();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "Selected" } });
    void refresh();
  }, [refresh]);

  if (isGuest) {
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
                {item.name || "Restaurant"}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {item.address}
                {item.city ? `, ${item.city}` : ""}
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
  sub: { color: "#666" },
});

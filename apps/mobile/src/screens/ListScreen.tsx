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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import {
  deleteList,
  listRestaurantsInList,
  removeRestaurantFromList,
  type ListItemRow,
} from "../storage/lists";
import { trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "List">;

export default function ListScreen({ navigation, route }: Props) {
  const { listId, name } = route.params;
  const { isGuest } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ListItemRow[]>([]);

  useLayoutEffect(() => {
    if (isGuest) {
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
      const rows = await listRestaurantsInList(listId);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "List" } });
    void refresh();
  }, [refresh]);

  if (isGuest) {
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
            <View style={{ height: 8 }} />
            <Button
              title="Retirer"
              onPress={() => {
                void (async () => {
                  await removeRestaurantFromList(listId, item.siret);
                  await refresh();
                })();
              }}
            />
          </View>
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

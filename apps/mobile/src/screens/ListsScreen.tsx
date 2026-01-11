import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { isDemoMode } from "../config/mode";
import {
  addRestaurantToList,
  createList,
  listIdsForRestaurant,
  listListsWithCounts,
  removeRestaurantFromList,
  type ListWithCountRow,
} from "../storage/lists";
import { requestPinnedDetailsSync } from "../features/sync/pinnedSyncRequests";
import { trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Lists">;

export default function ListsScreen({ navigation, route }: Props) {
  const pickForSiret = route.params?.pickForSiret;
  const { isGuest } = useAuth();

  const demoMode = isDemoMode();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ListWithCountRow[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const title = pickForSiret ? "Ajouter à une liste" : "Listes";

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listListsWithCounts();
      setItems(rows);

      if (pickForSiret) {
        const ids = await listIdsForRestaurant(pickForSiret);
        setSelectedIds(new Set(ids));
      } else {
        setSelectedIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, [pickForSiret]);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "Lists" } });
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    const n = newName.trim();
    if (!n) {
      Alert.alert("Erreur", "Nom de liste requis.");
      return;
    }

    try {
      const row = await createList(n);
      setNewName("");

      if (pickForSiret) {
        await addRestaurantToList(row.id, pickForSiret);
        requestPinnedDetailsSync("list_add");
        setSelectedIds((prev) => new Set(prev).add(row.id));
      }

      await refresh();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de créer la liste.");
    }
  };

  const toggleMembership = async (listId: number) => {
    if (!pickForSiret) return;

    const isSelected = selectedIds.has(listId);
    const next = new Set(selectedIds);

    if (isSelected) {
      await removeRestaurantFromList(listId, pickForSiret);
      next.delete(listId);
    } else {
      await addRestaurantToList(listId, pickForSiret);
      requestPinnedDetailsSync("list_add");
      next.add(listId);
    }

    setSelectedIds(next);
  };

  const listEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Aucune liste pour l’instant.</Text>
      </View>
    );
  }, [loading]);

  if (isGuest && !demoMode) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Listes</Text>
        <Text style={styles.body}>Connecte-toi pour gérer tes listes.</Text>
        <View style={{ height: 12 }} />
        <Button title="Se connecter" onPress={() => navigation.navigate("Auth")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.createRow}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Nouvelle liste"
          style={styles.input}
          autoCapitalize="sentences"
        />
        <Button title="Créer" onPress={() => void onCreate()} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          onRefresh={() => void refresh()}
          refreshing={loading}
          ListHeaderComponent={
            pickForSiret ? null : (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate("Selected")}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.name} numberOfLines={1}>
                    Tous les restaurants sélectionnés
                  </Text>
                  <Text style={styles.sub}>Voir tous ceux ajoutés à une liste</Text>
                </View>
              </Pressable>
            )
          }
          ListEmptyComponent={listEmpty}
          renderItem={({ item }) => {
            const selected = pickForSiret ? selectedIds.has(item.id) : false;

            if (pickForSiret) {
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => void toggleMembership(item.id)}
                >
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.sub}>
                      {selected
                        ? "Ajouté ✅"
                        : `Appuie pour ajouter • ${item.item_count} dans la liste`}
                    </Text>
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate("List", { listId: item.id, name: item.name })}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.sub}>{item.item_count} restaurant(s)</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 12 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800" },
  body: { color: "#444", textAlign: "center" },
  createRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  rowBody: { gap: 2 },
  name: { fontWeight: "800" },
  sub: { color: "#666" },
});

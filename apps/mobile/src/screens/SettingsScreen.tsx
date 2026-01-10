import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { useConsent } from "../features/consent/ConsentContext";
import { saveConsent, type ConsentState } from "../features/consent/consentStorage";
import { loadPushState, enablePush, disablePush } from "../features/notifications/pushManager";
import { clearSearchQueries } from "../storage/searchHistory";
import { clearNonPinnedCache } from "../storage/restaurantCache";
import { getDevMockApiEnabled, setDevMockApiEnabled } from "../features/dev/devPrefs";
import { seedDemoData } from "../dev/seedDemo";
import { resetLocalData } from "../storage/debugReset";
import { captureError, trackEvent } from "../telemetry/telemetry";
import { toErrorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { user, isGuest, logout, firebaseEnabled, firebaseDisabledReason } = useAuth();
  const { consent, setConsent } = useConsent();

  const [savingConsent, setSavingConsent] = useState(false);
  const [pushEnabled, setPushEnabledState] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [mockApiEnabled, setMockApiEnabled] = useState(false);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "Settings" } });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setPushEnabledState(await loadPushState());
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    void (async () => {
      try {
        setMockApiEnabled(await getDevMockApiEnabled());
      } catch {
        // ignore
      }
    })();
  }, []);

  const updateConsent = useCallback(
    async (analytics: boolean) => {
      const next: ConsentState = { decided: true, analytics };
      setConsent(next);
      setSavingConsent(true);
      try {
        await saveConsent(next);
        trackEvent({ name: "consent_update", props: { analytics } });
      } catch (e) {
        captureError(e, { where: "SettingsScreen.updateConsent" });
        trackEvent({ name: "consent_update_failed" });
        Alert.alert("Erreur", "Impossible d’enregistrer tes préférences pour le moment.");
        setConsent(consent);
      } finally {
        setSavingConsent(false);
      }
    },
    [consent, setConsent]
  );

  const onLogout = useCallback(async () => {
    trackEvent({ name: "auth_logout_tap" });
    try {
      await logout();
      trackEvent({ name: "auth_logout_success" });
      navigation.popToTop();
    } catch (e) {
      captureError(e, { where: "SettingsScreen.logout" });
      trackEvent({ name: "auth_logout_failed" });
      Alert.alert("Erreur", "Impossible de se déconnecter pour le moment.");
    }
  }, [logout, navigation]);

  if (isGuest) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <Text style={styles.body}>Connecte-toi pour accéder à ton compte.</Text>
          {firebaseEnabled ? null : (
            <Text style={styles.body}>
              Connexion indisponible{__DEV__ ? `: ${firebaseDisabledReason ?? "—"}` : ""}
            </Text>
          )}
          <View style={{ height: 10 }} />
          <Button
            title="Se connecter"
            disabled={!firebaseEnabled}
            onPress={() => {
              trackEvent({ name: "nav_open", props: { to: "Auth", from: "Settings" } });
              navigation.navigate("Auth");
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Statistiques & crash</Text>
              <Text style={styles.rowSub}>Aide à améliorer l’app (optionnel).</Text>
            </View>
            <Switch
              value={Boolean(consent.decided && consent.analytics)}
              onValueChange={(v) => void updateConsent(v)}
              disabled={savingConsent}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Alertes (compte requis)</Text>
              <Text style={styles.rowSub}>Active les notifications après connexion.</Text>
            </View>
            <Switch value={false} disabled />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Données & offline</Text>

          <Button
            title="Vider le cache (hors favoris/listes)"
            onPress={() => {
              Alert.alert(
                "Cache",
                "Supprimer le cache local des restaurants (hors favoris et listes) ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Vider",
                    style: "destructive",
                    onPress: () => {
                      void (async () => {
                        try {
                          trackEvent({ name: "cache_clear_non_pinned" });
                          await clearNonPinnedCache();
                          Alert.alert("Cache", "OK.");
                        } catch (e) {
                          captureError(e, { where: "SettingsScreen.clearNonPinnedCache.guest" });
                          Alert.alert("Cache", __DEV__ ? toErrorMessage(e) : "Échec.");
                        }
                      })();
                    },
                  },
                ]
              );
            }}
          />

          <View style={{ height: 8 }} />

          <Button
            title="Vider les recherches récentes"
            onPress={() => {
              void (async () => {
                try {
                  await clearSearchQueries();
                  Alert.alert("OK", "Recherches récentes supprimées.");
                } catch (e) {
                  captureError(e, { where: "SettingsScreen.clearSearchQueries.guest" });
                  Alert.alert("Erreur", __DEV__ ? toErrorMessage(e) : "Impossible pour le moment.");
                }
              })();
            }}
          />
        </View>

        {__DEV__ ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dev</Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Mock API (données locales)</Text>
                <Text style={styles.rowSub}>Permet de tester sans backend.</Text>
              </View>
              <Switch
                value={mockApiEnabled}
                onValueChange={(v) => {
                  void (async () => {
                    try {
                      await setDevMockApiEnabled(v);
                      setMockApiEnabled(v);
                      trackEvent({ name: "dev_mock_api_toggle", props: { enabled: v } });
                    } catch (e) {
                      captureError(e, { where: "SettingsScreen.setDevMockApiEnabled.guest" });
                      Alert.alert("Dev", "Impossible d’enregistrer la préférence.");
                    }
                  })();
                }}
              />
            </View>

            <Button
              title="Créer des données de démo"
              onPress={() => {
                void (async () => {
                  try {
                    trackEvent({ name: "dev_seed_demo" });
                    await seedDemoData();
                    Alert.alert(
                      "Dev",
                      "Données de démo créées (reset + remplissage). Va sur la carte puis Favoris / Listes / Historique / Récents."
                    );
                  } catch (e) {
                    captureError(e, { where: "SettingsScreen.seedDemoData.guest" });
                    Alert.alert("Dev", "Impossible de créer les données de démo.");
                  }
                })();
              }}
            />

            <View style={{ height: 8 }} />

            <Button
              title="Reset données locales (SQLite)"
              onPress={() => {
                Alert.alert(
                  "Reset",
                  "Supprimer toutes les données locales (favoris, listes, cache, historique) ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Reset",
                      style: "destructive",
                      onPress: () => {
                        void (async () => {
                          try {
                            trackEvent({ name: "dev_reset_local_data" });
                            await resetLocalData();
                            Alert.alert("Reset", "OK.");
                          } catch (e) {
                            captureError(e, { where: "SettingsScreen.resetLocalData.guest" });
                            Alert.alert("Reset", "Échec.");
                          }
                        })();
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.body}>Connecté{user?.email ? `: ${user.email}` : ""}</Text>
        <View style={{ height: 10 }} />
        <Button title="Se déconnecter" onPress={() => void onLogout()} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Raccourcis</Text>
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            trackEvent({ name: "nav_open", props: { to: "Bookmarks", from: "Settings" } });
            navigation.navigate("Bookmarks");
          }}
        >
          <Text style={styles.linkText}>Favoris</Text>
        </Pressable>
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            trackEvent({ name: "nav_open", props: { to: "Visited", from: "Settings" } });
            navigation.navigate("Visited");
          }}
        >
          <Text style={styles.linkText}>Historique</Text>
        </Pressable>
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            trackEvent({ name: "nav_open", props: { to: "Lists", from: "Settings" } });
            navigation.navigate("Lists");
          }}
        >
          <Text style={styles.linkText}>Listes</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Statistiques & crash</Text>
            <Text style={styles.rowSub}>Aide à améliorer l’app (optionnel).</Text>
          </View>
          <Switch
            value={Boolean(consent.decided && consent.analytics)}
            onValueChange={(v) => void updateConsent(v)}
            disabled={savingConsent}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Activer les notifications</Text>
            <Text style={styles.rowSub}>Nécessite l’autorisation système.</Text>
          </View>
          <Switch
            value={pushEnabled}
            disabled={pushBusy}
            onValueChange={(v) => {
              void (async () => {
                setPushBusy(true);
                try {
                  trackEvent({ name: "push_toggle", props: { enabled: v } });
                  if (v) {
                    const res = await enablePush();
                    setPushEnabledState(res.enabled);
                    if (!res.enabled) {
                      Alert.alert(
                        "Notifications",
                        "Autorisation refusée ou appareil non compatible."
                      );
                    } else {
                      Alert.alert("Notifications", "Activées.");
                    }
                  } else {
                    await disablePush();
                    setPushEnabledState(false);
                    Alert.alert("Notifications", "Désactivées.");
                  }
                } catch (e) {
                  captureError(e, { where: "SettingsScreen.pushToggle" });
                  Alert.alert(
                    "Notifications",
                    __DEV__ ? toErrorMessage(e) : "Impossible de modifier pour le moment."
                  );
                } finally {
                  setPushBusy(false);
                }
              })();
            }}
          />
        </View>
        <Text style={styles.hint}>Note: sur Expo Go, les notifications peuvent être limitées.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Données & offline</Text>

        <Button
          title="Vider le cache (hors favoris/listes)"
          onPress={() => {
            Alert.alert(
              "Cache",
              "Supprimer le cache local des restaurants (hors favoris et listes) ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Vider",
                  style: "destructive",
                  onPress: () => {
                    void (async () => {
                      try {
                        trackEvent({ name: "cache_clear_non_pinned" });
                        await clearNonPinnedCache();
                        Alert.alert("Cache", "OK.");
                      } catch (e) {
                        captureError(e, { where: "SettingsScreen.clearNonPinnedCache" });
                        Alert.alert("Cache", __DEV__ ? toErrorMessage(e) : "Échec.");
                      }
                    })();
                  },
                },
              ]
            );
          }}
        />

        <View style={{ height: 8 }} />

        <Button
          title="Vider les recherches récentes"
          onPress={() => {
            void (async () => {
              try {
                trackEvent({ name: "search_recent_clear_settings" });
                await clearSearchQueries();
                Alert.alert("OK", "Recherches récentes supprimées.");
              } catch (e) {
                captureError(e, { where: "SettingsScreen.clearSearchQueries" });
                Alert.alert("Erreur", __DEV__ ? toErrorMessage(e) : "Impossible pour le moment.");
              }
            })();
          }}
        />
      </View>

      {__DEV__ ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dev</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Mock API (données locales)</Text>
              <Text style={styles.rowSub}>Permet de tester sans backend.</Text>
            </View>
            <Switch
              value={mockApiEnabled}
              onValueChange={(v) => {
                void (async () => {
                  try {
                    await setDevMockApiEnabled(v);
                    setMockApiEnabled(v);
                    trackEvent({ name: "dev_mock_api_toggle", props: { enabled: v } });
                  } catch (e) {
                    captureError(e, { where: "SettingsScreen.setDevMockApiEnabled" });
                    Alert.alert("Dev", "Impossible d’enregistrer la préférence.");
                  }
                })();
              }}
            />
          </View>

          <Button
            title="Créer des données de démo"
            onPress={() => {
              void (async () => {
                try {
                  trackEvent({ name: "dev_seed_demo" });
                  await seedDemoData();
                  Alert.alert(
                    "Dev",
                    "Données de démo créées (reset + remplissage). Va sur la carte puis Favoris / Listes / Historique / Récents."
                  );
                } catch (e) {
                  captureError(e, { where: "SettingsScreen.seedDemoData" });
                  Alert.alert("Dev", "Impossible de créer les données de démo.");
                }
              })();
            }}
          />

          <View style={{ height: 8 }} />

          <Button
            title="Reset données locales (SQLite)"
            onPress={() => {
              Alert.alert(
                "Reset",
                "Supprimer toutes les données locales (favoris, listes, cache, historique) ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                      void (async () => {
                        try {
                          trackEvent({ name: "dev_reset_local_data" });
                          await resetLocalData();
                          Alert.alert("Reset", "OK.");
                        } catch (e) {
                          captureError(e, { where: "SettingsScreen.resetLocalData" });
                          Alert.alert("Reset", "Échec.");
                        }
                      })();
                    },
                  },
                ]
              );
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  body: { color: "#444", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  rowTitle: { fontWeight: "800" },
  rowSub: { color: "#666" },
  hint: { color: "#666", fontSize: 12 },
  linkRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  linkText: { fontWeight: "800" },
});

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { useConsent } from "../features/consent/ConsentContext";
import { saveConsent, type ConsentState } from "../features/consent/consentStorage";
import { captureError, trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { user, isGuest, logout, firebaseEnabled, firebaseDisabledReason } = useAuth();
  const { consent, setConsent } = useConsent();

  const [savingConsent, setSavingConsent] = useState(false);

  useEffect(() => {
    trackEvent({ name: "screen_view", props: { screen: "Settings" } });
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
      <View style={styles.center}>
        <Text style={styles.title}>Compte</Text>
        <Text style={styles.body}>Connecte-toi pour accéder à ton compte.</Text>
        {firebaseEnabled ? null : (
          <Text style={styles.body}>Connexion indisponible: {firebaseDisabledReason ?? "—"}</Text>
        )}
        <View style={{ height: 12 }} />
        <Button
          title="Se connecter"
          disabled={!firebaseEnabled}
          onPress={() => {
            trackEvent({ name: "nav_open", props: { to: "Auth", from: "Settings" } });
            navigation.navigate("Auth");
          }}
        />
        <View style={{ height: 12 }} />
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
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
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
  linkRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  linkText: { fontWeight: "800" },
});

import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { toErrorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export default function AuthScreen({ navigation, route }: Props) {
    const mode = route.params?.mode ?? "login";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login, signup, firebaseEnabled, firebaseDisabledReason } = useAuth();

    const onSubmit = async () => {
        if (!firebaseEnabled) {
            Alert.alert("Configuration", firebaseDisabledReason ?? "Firebase n’est pas configuré.");
            return;
        }

        const e = email.trim();
        if (!e || !password) {
            Alert.alert("Erreur", "Email et mot de passe requis.");
            return;
        }

        try {
            if (mode === "signup") {
                await signup(e, password);
            } else {
                await login(e, password);
            }
            navigation.goBack();
        } catch (err) {
            Alert.alert("Erreur", toErrorMessage(err));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{mode === "signup" ? "Créer un compte" : "Connexion"}</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Button title={mode === "signup" ? "Créer" : "Se connecter"} onPress={() => void onSubmit()} />

            <View style={{ height: 12 }} />
            {mode === "login" ? (
                <Button title="Créer un compte" onPress={() => navigation.setParams({ mode: "signup" })} />
            ) : (
                <Button title="J’ai déjà un compte" onPress={() => navigation.setParams({ mode: "login" })} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    title: { fontSize: 20, fontWeight: "700" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10
    }
});

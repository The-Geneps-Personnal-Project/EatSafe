import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/authState";
import { env } from "../config/env";
import { toErrorMessage } from "../utils/errors";
import { captureError, trackEvent } from "../telemetry/telemetry";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

WebBrowser.maybeCompleteAuthSession();

function bytesToHex(bytes: Uint8Array) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

async function makeAppleNonce() {
    const raw = bytesToHex(await Crypto.getRandomBytesAsync(16));
    const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        raw
    );
    return { raw, hashed };
}

export default function AuthScreen({ navigation, route }: Props) {
    const mode = route.params?.mode ?? "login";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [appleAvailable, setAppleAvailable] = useState(false);

    const {
        login,
        signup,
        requestPasswordReset,
        resendEmailVerification,
        reloadUser,
        signInWithApple,
        signInWithGoogle,
        firebaseEnabled,
        firebaseDisabledReason,
    } = useAuth();

    const googleConfigured = useMemo(() => {
        return Boolean(
            env.google.iosClientId ||
                env.google.androidClientId ||
                env.google.webClientId
        );
    }, []);

    const [googleRequest, googleResponse, googlePromptAsync] =
        Google.useIdTokenAuthRequest({
            iosClientId: env.google.iosClientId,
            androidClientId: env.google.androidClientId,
            webClientId: env.google.webClientId,
        });

    useEffect(() => {
        trackEvent({ name: "screen_view", props: { screen: "Auth", mode } });
    }, [mode]);

    useEffect(() => {
        if (Platform.OS !== "ios") return;
        void (async () => {
            try {
                setAppleAvailable(await AppleAuthentication.isAvailableAsync());
            } catch {
                setAppleAvailable(false);
            }
        })();
    }, []);

    const showVerifyPrompt = () => {
        Alert.alert(
            "Vérification email",
            "Vérifie ton email pour finaliser ton compte. Tu peux aussi renvoyer l’email de vérification.",
            [
                {
                    text: "Renvoyer",
                    onPress: () => {
                        void (async () => {
                            try {
                                await resendEmailVerification();
                                Alert.alert(
                                    "Vérification",
                                    "Email de vérification renvoyé."
                                );
                            } catch (e) {
                                captureError(e, {
                                    where: "AuthScreen.resendEmailVerification",
                                });
                                Alert.alert("Erreur", toErrorMessage(e));
                            }
                        })();
                    },
                },
                {
                    text: "J’ai vérifié",
                    onPress: () => {
                        void (async () => {
                            try {
                                const res = await reloadUser();
                                if (res?.emailVerified) {
                                    Alert.alert(
                                        "Vérification",
                                        "Merci ! Ton email est vérifié."
                                    );
                                } else {
                                    Alert.alert(
                                        "Vérification",
                                        "Pas encore vérifié. Réessaie dans quelques secondes."
                                    );
                                }
                            } catch (e) {
                                captureError(e, { where: "AuthScreen.reloadUser" });
                                Alert.alert("Erreur", toErrorMessage(e));
                            }
                        })();
                    },
                },
                { text: "Plus tard", style: "cancel" },
            ]
        );
    };

    const onSubmit = async () => {
        trackEvent({ name: "auth_submit", props: { mode } });
        if (!firebaseEnabled) {
            Alert.alert(
                "Connexion",
                __DEV__ ? firebaseDisabledReason ?? "Firebase n’est pas configuré." : "Connexion indisponible pour le moment."
            );
            return;
        }

        const e = email.trim();
        if (!e || !password) {
            Alert.alert("Erreur", "Email et mot de passe requis.");
            return;
        }

        try {
            setBusy(true);
            if (mode === "signup") {
                const res = await signup(e, password);
                if (!res.emailVerified) showVerifyPrompt();
            } else {
                const res = await login(e, password);
                if (!res.emailVerified) showVerifyPrompt();
            }

            trackEvent({ name: "auth_success", props: { mode } });
            navigation.goBack();
        } catch (err) {
            captureError(err, { where: "AuthScreen.onSubmit", mode });
            trackEvent({ name: "auth_failed", props: { mode } });
            Alert.alert("Erreur", toErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        if (!googleResponse) return;
        if (googleResponse.type !== "success") return;

        void (async () => {
            try {
                const params: any = (googleResponse as any).params;
                const idToken: string | undefined =
                    params?.id_token ?? (googleResponse as any).authentication?.idToken;
                const accessToken: string | undefined =
                    params?.access_token ?? (googleResponse as any).authentication?.accessToken;

                if (!idToken) throw new Error("Google: id_token manquant");

                setBusy(true);
                await signInWithGoogle({ idToken, accessToken });
                trackEvent({ name: "auth_success", props: { mode: "google" } });
                navigation.goBack();
            } catch (e) {
                captureError(e, { where: "AuthScreen.googleSignIn" });
                Alert.alert("Erreur", toErrorMessage(e));
            } finally {
                setBusy(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [googleResponse]);

    const onForgotPassword = async () => {
        if (!firebaseEnabled) {
            Alert.alert(
                "Connexion",
                __DEV__ ? firebaseDisabledReason ?? "Firebase n’est pas configuré." : "Connexion indisponible pour le moment."
            );
            return;
        }

        const e = email.trim();
        if (!e) {
            Alert.alert("Mot de passe", "Entre ton email d’abord.");
            return;
        }

        try {
            setBusy(true);
            await requestPasswordReset(e);
            trackEvent({ name: "auth_password_reset_sent" });
            Alert.alert(
                "Mot de passe",
                "Si un compte existe, un email de réinitialisation a été envoyé."
            );
        } catch (err) {
            captureError(err, { where: "AuthScreen.onForgotPassword" });
            Alert.alert("Erreur", toErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const onAppleSignIn = async () => {
        if (!firebaseEnabled) {
            Alert.alert(
                "Connexion",
                __DEV__ ? firebaseDisabledReason ?? "Firebase n’est pas configuré." : "Connexion indisponible pour le moment."
            );
            return;
        }

        try {
            setBusy(true);
            const nonce = await makeAppleNonce();
            const res = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                ],
                nonce: nonce.hashed,
            });

            if (!res.identityToken) {
                throw new Error("Apple: identityToken manquant");
            }

            await signInWithApple({ idToken: res.identityToken, rawNonce: nonce.raw });
            trackEvent({ name: "auth_success", props: { mode: "apple" } });
            navigation.goBack();
        } catch (e: any) {
            if (e?.code === "ERR_REQUEST_CANCELED") return;
            captureError(e, { where: "AuthScreen.appleSignIn" });
            Alert.alert("Erreur", toErrorMessage(e));
        } finally {
            setBusy(false);
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

            <Button
                title={mode === "signup" ? "Créer" : "Se connecter"}
                onPress={() => void onSubmit()}
                disabled={busy}
            />

            {mode === "login" ? (
                <Pressable onPress={() => void onForgotPassword()} disabled={busy}>
                    <Text style={styles.link}>Mot de passe oublié ?</Text>
                </Pressable>
            ) : null}

            <View style={{ height: 12 }} />
            {mode === "login" ? (
                <Button
                    title="Créer un compte"
                    onPress={() => navigation.setParams({ mode: "signup" })}
                    disabled={busy}
                />
            ) : (
                <Button
                    title="J’ai déjà un compte"
                    onPress={() => navigation.setParams({ mode: "login" })}
                    disabled={busy}
                />
            )}

            <View style={{ height: 12 }} />

            {Platform.OS === "ios" && appleAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                        AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                    }
                    buttonStyle={
                        AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={10}
                    style={{ height: 44, opacity: busy ? 0.6 : 1 }}
                    onPress={() => {
                        if (busy) return;
                        void onAppleSignIn();
                    }}
                />
            ) : null}

            <View style={{ height: 8 }} />

            <Button
                title={
                    googleConfigured
                        ? "Continuer avec Google"
                        : "Google (non configuré)"
                }
                disabled={busy || !googleConfigured || !googleRequest}
                onPress={() => {
                    if (!googleConfigured) {
                        Alert.alert(
                            "Google",
                            "Configure les variables EXPO_PUBLIC_GOOGLE_*_CLIENT_ID pour activer Google Sign-In."
                        );
                        return;
                    }
                    void googlePromptAsync();
                }}
            />
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
    },
    link: {
        color: "#2563eb",
        fontWeight: "700",
        paddingVertical: 4,
    },
});

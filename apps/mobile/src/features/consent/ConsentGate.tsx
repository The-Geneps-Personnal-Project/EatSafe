import { PropsWithChildren, useEffect, useState } from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";

import { loadConsent, saveConsent, type ConsentState } from "./consentStorage";
import { ConsentProvider } from "./ConsentContext";

export function ConsentGate({ children }: PropsWithChildren) {
    const [ready, setReady] = useState(false);
    const [state, setState] = useState<ConsentState>({ decided: false, analytics: false });

    useEffect(() => {
        void (async () => {
            const s = await loadConsent();
            setState(s);
            setReady(true);
        })();
    }, []);

    const decide = async (analytics: boolean) => {
        const next: ConsentState = { decided: true, analytics };
        setState(next);
        await saveConsent(next);
    };

    if (!ready) return null;

    return (
        <ConsentProvider consent={state}>
            {children}
            <Modal visible={!state.decided} transparent animationType="fade">
                <View style={styles.backdrop}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Confidentialité</Text>
                        <Text style={styles.body}>
                            Nous pouvons collecter des statistiques d’utilisation et des rapports de crash afin d’améliorer l’app.
                            Vous pouvez refuser, l’app fonctionnera quand même.
                        </Text>
                        <View style={styles.row}>
                            <Button title="Refuser" onPress={() => void decide(false)} />
                            <Button title="Accepter" onPress={() => void decide(true)} />
                        </View>
                    </View>
                </View>
            </Modal>
        </ConsentProvider>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
    },
    card: {
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8
    },
    body: {
        fontSize: 14,
        marginBottom: 12
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12
    }
});

import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./navigation/RootNavigator";
import { linking } from "./navigation/linking";
import { ConsentGate } from "./features/consent/ConsentGate";
import { AuthProvider } from "./auth/authState";
import { TelemetryProvider } from "./telemetry/TelemetryProvider";

export default function App() {
    return (
        <SafeAreaProvider>
            <ConsentGate>
                <TelemetryProvider>
                    <NavigationContainer linking={linking}>
                        <AuthProvider>
                            <RootNavigator />
                        </AuthProvider>
                    </NavigationContainer>
                </TelemetryProvider>
            </ConsentGate>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    );
}

import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./navigation/RootNavigator";
import { linking } from "./navigation/linking";
import { ConsentGate } from "./features/consent/ConsentGate";
import { AuthProvider } from "./auth/authState";
import { TelemetryProvider } from "./telemetry/TelemetryProvider";
import { PushRegistrationManager } from "./features/notifications/PushRegistrationManager";
import { NotificationRouter } from "./features/notifications/NotificationRouter";

export default function App() {
    return (
        <SafeAreaProvider>
            <ConsentGate>
                <TelemetryProvider>
                    <PushRegistrationManager>
                        <NavigationContainer linking={linking}>
                            <NotificationRouter />
                            <AuthProvider>
                                <RootNavigator />
                            </AuthProvider>
                        </NavigationContainer>
                    </PushRegistrationManager>
                </TelemetryProvider>
            </ConsentGate>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    );
}

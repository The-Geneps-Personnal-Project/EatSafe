import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList } from "./types";
import MapScreen from "../screens/MapScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import ListsScreen from "../screens/ListsScreen";
import ListScreen from "../screens/ListScreen";
import RestaurantScreen from "../screens/RestaurantScreen";
import AuthScreen from "../screens/AuthScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Map" component={MapScreen} options={{ title: "EatSafe" }} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: "Favoris" }} />
            <Stack.Screen name="Lists" component={ListsScreen} options={{ title: "Listes" }} />
            <Stack.Screen name="List" component={ListScreen} options={{ title: "Liste" }} />
            <Stack.Screen name="Restaurant" component={RestaurantScreen} options={{ title: "Restaurant" }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Connexion" }} />
        </Stack.Navigator>
    );
}

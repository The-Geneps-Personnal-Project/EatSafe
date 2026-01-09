import * as Linking from "expo-linking";
import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

const prefix = Linking.createURL("/");

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, "https://eatsafe.adabin.fr", "http://eatsafe.adabin.fr"],
  config: {
    screens: {
      Map: "",
      Restaurant: {
        path: "r/:publicId",
        parse: { publicId: (v: string) => String(v) },
      },
      Auth: "auth",
    },
  },
};

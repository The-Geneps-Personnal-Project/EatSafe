import { Platform } from "react-native";

export const platform = {
  isAndroid: Platform.OS === "android",
  isIOS: Platform.OS === "ios",
};

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "push.enabled.v1";

export async function getPushEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === "1";
}

export async function setPushEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, enabled ? "1" : "0");
}

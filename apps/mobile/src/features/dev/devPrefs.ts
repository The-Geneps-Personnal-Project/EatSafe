import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_MOCK_API = "dev.mockApiEnabled";

export async function getDevMockApiEnabled(): Promise<boolean> {
  if (!__DEV__) return false;
  const raw = await AsyncStorage.getItem(KEY_MOCK_API);
  if (raw === null) return false;
  return raw === "1" || raw === "true";
}

export async function setDevMockApiEnabled(enabled: boolean): Promise<void> {
  if (!__DEV__) return;
  await AsyncStorage.setItem(KEY_MOCK_API, enabled ? "1" : "0");
}

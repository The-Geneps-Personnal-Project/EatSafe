import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "consent.v1";

export type ConsentState = {
  decided: boolean;
  analytics: boolean;
};

export async function loadConsent(): Promise<ConsentState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { decided: false, analytics: false };

  try {
    const parsed = JSON.parse(raw) as ConsentState;
    return {
      decided: Boolean(parsed.decided),
      analytics: Boolean(parsed.analytics),
    };
  } catch {
    return { decided: false, analytics: false };
  }
}

export async function saveConsent(next: ConsentState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

import { z } from "zod";

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().optional(),

  // If true, the app must never call the backend API (use local/mock only).
  EXPO_PUBLIC_FORCE_MOCK_API: z.string().optional(),

  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

function parseBool(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export const env = {
  apiUrl:
    parsed.success && parsed.data.EXPO_PUBLIC_API_URL
      ? parsed.data.EXPO_PUBLIC_API_URL
      : "http://10.0.2.2:8000",
  forceMockApi: parsed.success
    ? parseBool(parsed.data.EXPO_PUBLIC_FORCE_MOCK_API)
    : false,
  firebase: parsed.success
    ? {
        apiKey: parsed.data.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: parsed.data.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: parsed.data.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        appId: parsed.data.EXPO_PUBLIC_FIREBASE_APP_ID,
        messagingSenderId: parsed.data.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      }
    : {},
};

import { z } from "zod";

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().optional(),

  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

export const env = {
  apiUrl:
    parsed.success && parsed.data.EXPO_PUBLIC_API_URL
      ? parsed.data.EXPO_PUBLIC_API_URL
      : "http://10.0.2.2:8000",
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

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";

import { env } from "../config/env";

export type FirebaseInitResult = {
  app: FirebaseApp | null;
  enabled: boolean;
  reasonDisabled?: string;
};

export function initFirebase(): FirebaseInitResult {
  const cfg = env.firebase;

  const missing = [
    !cfg.apiKey && "EXPO_PUBLIC_FIREBASE_API_KEY",
    !cfg.authDomain && "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    !cfg.projectId && "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    !cfg.appId && "EXPO_PUBLIC_FIREBASE_APP_ID",
  ].filter(Boolean) as string[];

  if (missing.length) {
    return {
      app: null,
      enabled: false,
      reasonDisabled: `Firebase désactivé (variables manquantes: ${missing.join(
        ", "
      )})`,
    };
  }

  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: cfg.apiKey!,
        authDomain: cfg.authDomain!,
        projectId: cfg.projectId!,
        appId: cfg.appId!,
        messagingSenderId: cfg.messagingSenderId,
      });

  return { app, enabled: true };
}

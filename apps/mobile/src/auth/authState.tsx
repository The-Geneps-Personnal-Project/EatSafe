import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginEmailPassword,
  logout as firebaseLogout,
  reloadCurrentUser as firebaseReloadCurrentUser,
  requestPasswordReset as firebaseRequestPasswordReset,
  resendCurrentUserEmailVerification as firebaseResendEmailVerification,
  signInWithAppleIdToken as firebaseSignInWithAppleIdToken,
  signInWithGoogleTokens as firebaseSignInWithGoogleTokens,
  signupEmailPassword,
  subscribeAuth,
} from "../firebase/auth";
import { useConsent } from "../features/consent/ConsentContext";
import { setUser as telemetrySetUser } from "../telemetry/telemetry";
import { toErrorMessage } from "../utils/errors";

export type AuthUser = {
  uid: string;
  email?: string | null;
  emailVerified: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isGuest: boolean;
  setUser: (u: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<{ emailVerified: boolean }>;
  signup: (email: string, password: string) => Promise<{ emailVerified: boolean }>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  reloadUser: () => Promise<{ emailVerified: boolean } | null>;
  signInWithApple: (params: { idToken: string; rawNonce?: string }) => Promise<{ emailVerified: boolean }>;
  signInWithGoogle: (params: { idToken: string; accessToken?: string }) => Promise<{ emailVerified: boolean }>;
  logout: () => Promise<void>;
  firebaseEnabled: boolean;
  firebaseDisabledReason?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { consent } = useConsent();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [firebaseEnabled, setFirebaseEnabled] = useState(true);
  const [firebaseDisabledReason, setFirebaseDisabledReason] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    try {
      const unsub = subscribeAuth((u) => {
        if (!u) {
          setUserState(null);
          return;
        }
        setUserState({ uid: u.uid, email: u.email, emailVerified: Boolean(u.emailVerified) });
      });
      setFirebaseEnabled(true);
      setFirebaseDisabledReason(undefined);
      return unsub;
    } catch (e) {
      setFirebaseEnabled(false);
      setFirebaseDisabledReason(__DEV__ ? toErrorMessage(e) : undefined);
      setUserState(null);
      return;
    }
  }, []);

  useEffect(() => {
    telemetrySetUser(user ? { id: user.uid } : null);
  }, [consent, user?.uid]);

  const login = async (email: string, password: string) => {
    const u = await loginEmailPassword(email, password);
    return { emailVerified: Boolean(u.emailVerified) };
  };

  const signup = async (email: string, password: string) => {
    const u = await signupEmailPassword(email, password);
    return { emailVerified: Boolean(u.emailVerified) };
  };

  const requestPasswordReset = async (email: string) => {
    await firebaseRequestPasswordReset(email);
  };

  const resendEmailVerification = async () => {
    await firebaseResendEmailVerification();
  };

  const reloadUser = async () => {
    const u = await firebaseReloadCurrentUser();
    if (!u) return null;
    return { emailVerified: Boolean(u.emailVerified) };
  };

  const signInWithApple = async (params: { idToken: string; rawNonce?: string }) => {
    const u = await firebaseSignInWithAppleIdToken(params);
    return { emailVerified: Boolean(u.emailVerified) };
  };

  const signInWithGoogle = async (params: { idToken: string; accessToken?: string }) => {
    const u = await firebaseSignInWithGoogleTokens(params);
    return { emailVerified: Boolean(u.emailVerified) };
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest: !user,
      setUser: setUserState,
      login,
      signup,
      requestPasswordReset,
      resendEmailVerification,
      reloadUser,
      signInWithApple,
      signInWithGoogle,
      logout,
      firebaseEnabled,
      firebaseDisabledReason,
    }),
    [user, firebaseEnabled, firebaseDisabledReason]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

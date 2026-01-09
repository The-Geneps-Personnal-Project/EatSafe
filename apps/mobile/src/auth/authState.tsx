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
  signupEmailPassword,
  subscribeAuth,
} from "../firebase/auth";
import { toErrorMessage } from "../utils/errors";

export type AuthUser = {
  uid: string;
  email?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isGuest: boolean;
  setUser: (u: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  firebaseEnabled: boolean;
  firebaseDisabledReason?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseEnabled, setFirebaseEnabled] = useState(true);
  const [firebaseDisabledReason, setFirebaseDisabledReason] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    try {
      const unsub = subscribeAuth((u) => {
        if (!u) {
          setUser(null);
          return;
        }
        setUser({ uid: u.uid, email: u.email });
      });
      setFirebaseEnabled(true);
      setFirebaseDisabledReason(undefined);
      return unsub;
    } catch (e) {
      setFirebaseEnabled(false);
      setFirebaseDisabledReason(toErrorMessage(e));
      setUser(null);
      return;
    }
  }, []);

  const login = async (email: string, password: string) => {
    await loginEmailPassword(email, password);
  };

  const signup = async (email: string, password: string) => {
    await signupEmailPassword(email, password);
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest: !user,
      setUser,
      login,
      signup,
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

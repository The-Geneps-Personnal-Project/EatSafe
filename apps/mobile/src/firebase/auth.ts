import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  type User,
} from "firebase/auth";

import { initFirebase } from "./firebaseApp";

export function getFirebaseAuth() {
  const { app, enabled, reasonDisabled } = initFirebase();
  if (!enabled || !app) {
    throw new Error(reasonDisabled ?? "Firebase désactivé");
  }
  return getAuth(app);
}

export function subscribeAuth(cb: (u: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, cb);
}

export async function loginEmailPassword(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signupEmailPassword(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Best-effort: send email verification for email/password accounts.
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // ignore
  }

  return cred.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function resendCurrentUserEmailVerification(): Promise<void> {
  const auth = getFirebaseAuth();
  const u = auth.currentUser;
  if (!u) throw new Error("Aucun utilisateur connecté");
  await sendEmailVerification(u);
}

export async function reloadCurrentUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const u = auth.currentUser;
  if (!u) return null;
  await reload(u);
  return auth.currentUser;
}

export async function signInWithAppleIdToken(params: {
  idToken: string;
  rawNonce?: string;
}): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken: params.idToken,
    rawNonce: params.rawNonce,
  });
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
}

export async function signInWithGoogleTokens(params: {
  idToken: string;
  accessToken?: string;
}): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(
    params.idToken,
    params.accessToken
  );
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
}

export async function logout() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

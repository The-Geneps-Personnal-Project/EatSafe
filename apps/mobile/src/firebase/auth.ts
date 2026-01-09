import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  return cred.user;
}

export async function logout() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

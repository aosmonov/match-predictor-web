import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBc9Ld2JvXyRCj4KU84X3Xd7hxqHp5jkoE",
  authDomain: "buddy-league.firebaseapp.com",
  projectId: "buddy-league",
  storageBucket: "buddy-league.firebasestorage.app",
  messagingSenderId: "354840968598",
  appId: "1:354840968598:android:ca95972045db2e7c0e71b7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

void setPersistence(auth, browserLocalPersistence);

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function createEmailAccount(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  await signInWithPopup(auth, provider);
}

export async function signInWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  await signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
}

export async function removeCurrentAccount() {
  if (!auth.currentUser) {
    throw new Error("No signed-in user");
  }
  await deleteUser(auth.currentUser);
}

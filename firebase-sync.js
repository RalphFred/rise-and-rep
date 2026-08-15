import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8H-FgW4MtbHeurzRhv2oXTIxKzwd7wnI",
  authDomain: "rise-and-rep.firebaseapp.com",
  projectId: "rise-and-rep",
  storageBucket: "rise-and-rep.firebasestorage.app",
  messagingSenderId: "288769890364",
  appId: "1:288769890364:web:37737a5069c36c17fb4b39",
  measurementId: "G-TQ1WBC2RD1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
let stopProgressListener = null;
let callbacks = {};

function publicUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || "Rise & Rep player",
    email: user.email || "",
    photoURL: user.photoURL || ""
  };
}

function progressDocument(user = currentUser) {
  if (!user) throw new Error("Sign in before syncing progress.");
  return doc(database, "users", user.uid);
}

function watchProgress(user) {
  stopProgressListener?.();
  stopProgressListener = null;
  if (!user) return;

  stopProgressListener = onSnapshot(progressDocument(user), { includeMetadataChanges: true }, (snapshot) => {
    if (!snapshot.exists()) return;
    callbacks.onRemoteProgress?.(snapshot.data(), { fromCache: snapshot.metadata.fromCache });
  }, (error) => {
    callbacks.onStatus?.("error", error.message);
  });
}

export async function initializeCloud(nextCallbacks = {}) {
  callbacks = nextCallbacks;
  await setPersistence(auth, browserLocalPersistence);
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    watchProgress(user);
    callbacks.onAuthChange?.(publicUser(user));
  }, (error) => callbacks.onStatus?.("error", error.message));
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return publicUser(result.user);
}

export async function signOutCurrentUser() {
  await signOut(auth);
}

export async function syncProgress(localProgress) {
  const reference = progressDocument();
  const profile = publicUser(currentUser);
  callbacks.onStatus?.("syncing");

  const merged = await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const remote = snapshot.exists() ? snapshot.data() : {};
    const progress = window.RiseRepProgress.mergeDurableProgress(remote, localProgress);
    transaction.set(reference, {
      ...progress,
      profile: {
        displayName: profile.displayName,
        email: profile.email,
        photoURL: profile.photoURL
      },
      updatedAt: serverTimestamp()
    });
    return progress;
  });

  callbacks.onStatus?.("synced");
  return merged;
}

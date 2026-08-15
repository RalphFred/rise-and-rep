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

let auth = null;
let database = null;
let provider = null;
let servicesPromise = null;

let currentUser = null;
let stopProgressListener = null;
let callbacks = {};

async function initializeServices() {
  if (auth && database && provider) return;
  if (servicesPromise) return servicesPromise;

  servicesPromise = fetch("/api/firebase-config", { cache: "no-store" }).then(async (response) => {
    const config = await response.json().catch(() => ({}));
    if (!response.ok || !config.apiKey) throw new Error(config.message || "Cloud sync is not configured yet.");
    const app = initializeApp(config);
    auth = getAuth(app);
    database = getFirestore(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
  }).catch((error) => {
    servicesPromise = null;
    throw error;
  });

  return servicesPromise;
}

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
  await initializeServices();
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

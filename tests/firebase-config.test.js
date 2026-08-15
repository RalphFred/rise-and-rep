const test = require("node:test");
const assert = require("node:assert/strict");

const { publicFirebaseConfig } = require("../api/firebase-config");

test("Firebase config reports missing environment without exposing variable names to clients", () => {
  const result = publicFirebaseConfig({});
  assert.equal(result.configured, false);
  assert.ok(result.missing.includes("FIREBASE_API_KEY"));
});

test("Firebase config maps Vercel environment names to browser SDK fields", () => {
  const result = publicFirebaseConfig({
    FIREBASE_API_KEY: "test-public-key",
    FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
    FIREBASE_PROJECT_ID: "example",
    FIREBASE_STORAGE_BUCKET: "example.firebasestorage.app",
    FIREBASE_MESSAGING_SENDER_ID: "123",
    FIREBASE_APP_ID: "1:123:web:abc",
    FIREBASE_MEASUREMENT_ID: "G-ABC"
  });

  assert.equal(result.configured, true);
  assert.deepEqual(result.config, {
    apiKey: "test-public-key",
    authDomain: "example.firebaseapp.com",
    projectId: "example",
    storageBucket: "example.firebasestorage.app",
    messagingSenderId: "123",
    appId: "1:123:web:abc",
    measurementId: "G-ABC"
  });
});

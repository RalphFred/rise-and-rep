const REQUIRED_FIREBASE_ENV = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID"
};

function publicFirebaseConfig(environment = process.env) {
  const missing = Object.values(REQUIRED_FIREBASE_ENV).filter((name) => !environment[name]);
  if (missing.length) return { configured: false, missing };

  const config = Object.fromEntries(Object.entries(REQUIRED_FIREBASE_ENV).map(([field, name]) => [field, environment[name]]));
  if (environment.FIREBASE_MEASUREMENT_ID) config.measurementId = environment.FIREBASE_MEASUREMENT_ID;
  return { configured: true, config };
}

module.exports = function handler(_request, response) {
  const result = publicFirebaseConfig();
  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  if (!result.configured) {
    return response.status(503).json({ configured: false, message: "Cloud sync is not configured yet." });
  }
  return response.status(200).json(result.config);
};

module.exports.publicFirebaseConfig = publicFirebaseConfig;

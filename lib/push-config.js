const REQUIRED_PUSH_ENV = [
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
];

function missingPushEnvironment() {
  return REQUIRED_PUSH_ENV.filter((name) => !process.env[name]);
}

function pushIsConfigured() {
  return missingPushEnvironment().length === 0;
}

function vapidSubject() {
  return process.env.VAPID_SUBJECT || "mailto:hello@rise-and-rep.app";
}

module.exports = { missingPushEnvironment, pushIsConfigured, vapidSubject };

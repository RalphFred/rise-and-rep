const test = require("node:test");
const assert = require("node:assert/strict");

const { reminderPayload } = require("../api/send-reminders");
const pushConfigHandler = require("../api/push-config");
const sendRemindersHandler = require("../api/send-reminders");
const { getSubscriptions, saveSubscription, subscriptionId } = require("../lib/push-redis");

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

test("builds a circuit reminder on a Lagos workout day", () => {
  const payload = JSON.parse(reminderPayload(new Date("2026-08-17T05:30:00.000Z")));
  assert.match(payload.title, /circuit day/);
  assert.equal(payload.url, "/?from=morning-reminder");
  assert.equal(payload.tag, "rise-and-rep-morning");
});

test("builds a recovery reminder on a Lagos recovery day", () => {
  const payload = JSON.parse(reminderPayload(new Date("2026-08-18T05:30:00.000Z")));
  assert.match(payload.title, /recovery day/);
  assert.match(payload.body, /recovery quest/);
});

test("subscription identifiers are stable without exposing the endpoint", () => {
  const endpoint = "https://push.example.test/subscription/private-value";
  const id = subscriptionId(endpoint);
  assert.equal(id, subscriptionId(endpoint));
  assert.equal(id.length, 43);
  assert.equal(id.includes("private-value"), false);
});

test("push config fails safely when deployment secrets are missing", () => {
  const response = mockResponse();
  pushConfigHandler({}, response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.configured, false);
  assert.equal(response.headers["Cache-Control"], "no-store");
});

test("the reminder job rejects requests without the cron secret", async () => {
  const response = mockResponse();
  await sendRemindersHandler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 401);
});

test("subscriptions round-trip through the Redis REST contract", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const subscription = {
    endpoint: "https://push.example.test/device/abc",
    keys: { p256dh: "public-key", auth: "auth-key" }
  };
  const id = subscriptionId(subscription.endpoint);
  const commands = [];

  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  global.fetch = async (_url, options) => {
    const command = JSON.parse(options.body);
    commands.push(command);
    const result = command[0] === "HGETALL"
      ? [id, JSON.stringify({ subscription, createdAt: "2026-08-15T00:00:00.000Z" })]
      : 1;
    return { ok: true, json: async () => ({ result }) };
  };

  try {
    assert.equal(await saveSubscription(subscription), id);
    const records = await getSubscriptions();
    assert.equal(records.length, 1);
    assert.equal(records[0].id, id);
    assert.equal(records[0].subscription.endpoint, subscription.endpoint);
    assert.deepEqual(commands.map((command) => command[0]), ["HSET", "HGETALL"]);
  } finally {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  }
});

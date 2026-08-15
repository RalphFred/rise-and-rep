const crypto = require("node:crypto");

const SUBSCRIPTIONS_KEY = "rise-and-rep:push-subscriptions:v1";

function redisEnvironment() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis is not configured");
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand(command) {
  const { url, token } = redisEnvironment();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) throw new Error(`Redis request failed with ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

function subscriptionId(endpoint) {
  return crypto.createHash("sha256").update(endpoint).digest("base64url");
}

async function saveSubscription(subscription) {
  const id = subscriptionId(subscription.endpoint);
  const record = JSON.stringify({ subscription, createdAt: new Date().toISOString() });
  await redisCommand(["HSET", SUBSCRIPTIONS_KEY, id, record]);
  return id;
}

async function deleteSubscription(endpoint) {
  return redisCommand(["HDEL", SUBSCRIPTIONS_KEY, subscriptionId(endpoint)]);
}

async function deleteSubscriptionById(id) {
  return redisCommand(["HDEL", SUBSCRIPTIONS_KEY, id]);
}

async function getSubscriptions() {
  const values = await redisCommand(["HGETALL", SUBSCRIPTIONS_KEY]);
  if (!Array.isArray(values)) return [];

  const subscriptions = [];
  for (let index = 0; index < values.length; index += 2) {
    try {
      const record = JSON.parse(values[index + 1]);
      if (record?.subscription?.endpoint) subscriptions.push({ id: values[index], ...record });
    } catch {
      // Ignore malformed records; valid subscriptions should still be notified.
    }
  }
  return subscriptions;
}

module.exports = {
  deleteSubscription,
  deleteSubscriptionById,
  getSubscriptions,
  redisCommand,
  saveSubscription,
  subscriptionId
};

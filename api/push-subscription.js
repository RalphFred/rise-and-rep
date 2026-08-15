const { pushIsConfigured } = require("../lib/push-config");
const { deleteSubscription, saveSubscription } = require("../lib/push-redis");

function validSubscription(subscription) {
  return Boolean(
    subscription?.endpoint &&
    subscription?.keys?.p256dh &&
    subscription?.keys?.auth
  );
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (!pushIsConfigured()) return response.status(503).json({ error: "Morning reminders are not configured yet." });

  try {
    if (request.method === "POST") {
      const subscription = request.body?.subscription;
      if (!validSubscription(subscription)) return response.status(400).json({ error: "Invalid push subscription." });
      await saveSubscription(subscription);
      return response.status(201).json({ subscribed: true });
    }

    if (request.method === "DELETE") {
      const endpoint = request.body?.endpoint;
      if (!endpoint || typeof endpoint !== "string") return response.status(400).json({ error: "A subscription endpoint is required." });
      await deleteSubscription(endpoint);
      return response.status(200).json({ subscribed: false });
    }

    response.setHeader("Allow", "POST, DELETE");
    return response.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Push subscription update failed", error);
    return response.status(500).json({ error: "Could not update this device’s reminder." });
  }
};

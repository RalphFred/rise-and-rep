const webpush = require("web-push");
const { pushIsConfigured, vapidSubject } = require("../lib/push-config");
const { deleteSubscriptionById, getSubscriptions } = require("../lib/push-redis");

const WORKOUT_DAYS = new Set(["Mon", "Wed", "Fri", "Sat"]);

function reminderPayload(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short"
  }).format(date);
  const workout = WORKOUT_DAYS.has(weekday);

  return JSON.stringify({
    title: workout ? "Rise & Rep — circuit day" : "Rise & Rep — recovery day",
    body: workout
      ? "Your morning circuit is ready. Show up, keep the streak, own the day."
      : "Keep the promise with today’s short recovery quest.",
    icon: "/assets/icon-192.png",
    badge: "/assets/icon-180.png",
    tag: "rise-and-rep-morning",
    url: "/?from=morning-reminder"
  });
}

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.authorization === `Bearer ${secret}`);
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  if (!authorized(request)) return response.status(401).json({ error: "Unauthorized." });
  if (!pushIsConfigured()) return response.status(503).json({ error: "Morning reminders are not configured yet." });

  webpush.setVapidDetails(vapidSubject(), process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  try {
    const records = await getSubscriptions();
    const payload = reminderPayload();
    let sent = 0;
    let removed = 0;
    let failed = 0;

    await Promise.all(records.map(async ({ id, subscription }) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 6 });
        sent += 1;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await deleteSubscriptionById(id);
          removed += 1;
        } else {
          failed += 1;
          console.error("Push delivery failed", error.statusCode || error.message);
        }
      }
    }));

    return response.status(200).json({ sent, removed, failed, subscriptions: records.length });
  } catch (error) {
    console.error("Morning reminder job failed", error);
    return response.status(500).json({ error: "Morning reminder job failed." });
  }
};

module.exports.reminderPayload = reminderPayload;

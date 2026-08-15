const { pushIsConfigured } = require("../lib/push-config");

module.exports = function handler(_request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (!pushIsConfigured()) {
    return response.status(503).json({ configured: false, message: "Morning reminders are not configured yet." });
  }

  return response.status(200).json({
    configured: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
    schedule: { label: "6:30 AM", timeZone: "Africa/Lagos" }
  });
};

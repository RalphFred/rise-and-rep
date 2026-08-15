const test = require("node:test");
const assert = require("node:assert/strict");

const {
  deriveTotals,
  fingerprint,
  mergeDurableProgress,
  normalizeCompletedDays
} = require("../progress-sync-core");

const monday = {
  type: "workout",
  xp: 300,
  segments: 22,
  completedAt: "2026-08-17T06:15:00.000Z"
};

const tuesday = {
  type: "recovery",
  xp: 120,
  segments: 5,
  completedAt: "2026-08-18T06:10:00.000Z"
};

test("merges completed history from two devices without dropping either day", () => {
  const merged = mergeDurableProgress(
    { completedDays: { "2026-08-17": monday }, earnedAchievements: { first: "2026-08-17T06:15:00.000Z" } },
    { completedDays: { "2026-08-18": tuesday }, earnedAchievements: { streak3: "2026-08-19T06:15:00.000Z" } }
  );

  assert.deepEqual(Object.keys(merged.completedDays), ["2026-08-17", "2026-08-18"]);
  assert.deepEqual(Object.keys(merged.earnedAchievements), ["first", "streak3"]);
  assert.deepEqual(deriveTotals(merged.completedDays), { totalSessions: 2, totalSets: 27, xp: 420 });
});

test("keeps the latest version when both devices contain the same day", () => {
  const laterMonday = { ...monday, xp: 320, completedAt: "2026-08-17T07:00:00.000Z" };
  const merged = mergeDurableProgress(
    { completedDays: { "2026-08-17": monday } },
    { completedDays: { "2026-08-17": laterMonday } }
  );
  assert.equal(merged.completedDays["2026-08-17"].xp, 320);
});

test("rejects malformed date keys from cloud data", () => {
  const normalized = normalizeCompletedDays({
    "2026-08-17": monday,
    "__proto__": monday,
    "not-a-date": monday,
    "2026-08-18": "bad-value"
  });
  assert.deepEqual(Object.keys(normalized), ["2026-08-17"]);
});

test("creates a stable fingerprint regardless of input map order", () => {
  const first = { completedDays: { "2026-08-18": tuesday, "2026-08-17": monday } };
  const second = { completedDays: { "2026-08-17": monday, "2026-08-18": tuesday } };
  assert.equal(fingerprint(first), fingerprint(second));
});

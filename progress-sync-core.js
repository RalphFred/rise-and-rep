(function exposeProgressSync(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RiseRepProgress = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function createProgressSync() {
  function validObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeCompletedDays(days) {
    if (!validObject(days)) return {};
    return Object.fromEntries(Object.entries(days).filter(([key, entry]) => (
      /^\d{4}-\d{2}-\d{2}$/.test(key) && validObject(entry)
    )));
  }

  function normalizeAchievements(achievements) {
    if (!validObject(achievements)) return {};
    return Object.fromEntries(Object.entries(achievements).filter(([key, earnedAt]) => (
      /^[a-zA-Z0-9_-]{1,40}$/.test(key) && typeof earnedAt === "string"
    )));
  }

  function laterCompletion(first, second) {
    if (!first) return second;
    if (!second) return first;
    const firstTime = Date.parse(first.completedAt || "") || 0;
    const secondTime = Date.parse(second.completedAt || "") || 0;
    if (secondTime !== firstTime) return secondTime > firstTime ? second : first;
    return Number(second.xp || 0) > Number(first.xp || 0) ? second : first;
  }

  function mergeCompletedDays(first, second) {
    const left = normalizeCompletedDays(first);
    const right = normalizeCompletedDays(second);
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return Object.fromEntries([...keys].sort().map((key) => [key, laterCompletion(left[key], right[key])]));
  }

  function mergeAchievements(first, second) {
    const left = normalizeAchievements(first);
    const right = normalizeAchievements(second);
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return Object.fromEntries([...keys].sort().map((key) => {
      const dates = [left[key], right[key]].filter(Boolean).sort();
      return [key, dates[0]];
    }));
  }

  function mergeDurableProgress(first = {}, second = {}) {
    return {
      schemaVersion: 1,
      completedDays: mergeCompletedDays(first.completedDays, second.completedDays),
      earnedAchievements: mergeAchievements(first.earnedAchievements, second.earnedAchievements)
    };
  }

  function deriveTotals(completedDays) {
    const entries = Object.values(normalizeCompletedDays(completedDays));
    return {
      totalSessions: entries.length,
      totalSets: entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.segments) || 0), 0),
      xp: entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.xp) || 0), 0)
    };
  }

  function fingerprint(progress) {
    return JSON.stringify(mergeDurableProgress({}, progress));
  }

  return {
    deriveTotals,
    fingerprint,
    mergeAchievements,
    mergeCompletedDays,
    mergeDurableProgress,
    normalizeAchievements,
    normalizeCompletedDays
  };
}));

/* Super Tab Out metrics service.
   Pure local counters for health and future retention features. */
(function (global) {
  'use strict';

  function countDuplicateExtras(tabs) {
    const counts = new Map();
    for (const tab of tabs || []) {
      if (!tab?.url) continue;
      counts.set(tab.url, (counts.get(tab.url) || 0) + 1);
    }
    let extras = 0;
    for (const count of counts.values()) {
      if (count > 1) extras += count - 1;
    }
    return extras;
  }

  function calculateTabHealth(tabs) {
    const realTabs = tabs || [];
    const tabCount = realTabs.length;
    const duplicateExtras = countDuplicateExtras(realTabs);
    const ungroupedCount = realTabs.filter(tab => tab.groupId === -1).length;

    let score = 100;
    score -= Math.max(0, tabCount - 10) * 2;
    score -= duplicateExtras * 6;
    score -= Math.max(0, ungroupedCount - 8);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      tabCount,
      duplicateExtras,
      ungroupedCount,
    };
  }

  function summarizeActivity(stats = {}) {
    const weekly = stats.weekly || {};
    const latestWeek = Object.keys(weekly).sort().pop();
    const weekStats = latestWeek ? weekly[latestWeek] : {};
    const domains = Object.entries(stats.domains || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));
    return {
      latestWeek,
      closedThisWeek: weekStats.closed || 0,
      savedThisWeek: weekStats.saved || 0,
      duplicateClosedThisWeek: weekStats.duplicateClosed || 0,
      sessionsSavedThisWeek: weekStats.sessionsSaved || 0,
      topDomains: domains,
    };
  }

  function evaluateAchievements(stats = {}, health = {}) {
    const unlocked = [];
    if ((stats.closedTotal || 0) >= 10) unlocked.push('closed-10');
    if ((stats.closedTotal || 0) >= 100) unlocked.push('closed-100');
    if ((stats.savedTotal || 0) >= 10) unlocked.push('saved-10');
    if ((stats.duplicateClosedTotal || 0) >= 10) unlocked.push('dedupe-10');
    if ((stats.sessionsSavedTotal || 0) >= 1) unlocked.push('session-saver');
    if ((health.score || 0) >= 90 && (health.tabCount || 0) <= 10) unlocked.push('calm-deck');
    return unlocked;
  }

  const api = {
    countDuplicateExtras,
    calculateTabHealth,
    summarizeActivity,
    evaluateAchievements,
  };

  global.SuperTabOutMetrics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

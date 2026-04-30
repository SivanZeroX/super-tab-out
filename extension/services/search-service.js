/* Super Tab Out search service.
   Builds a unified local index for open tabs, saved tabs, and future sessions. */
(function (global) {
  'use strict';

  const FILTERS = new Set(['domain', 'group', 'url', 'saved']);

  function normalizeText(value) {
    return String(value == null ? '' : value).toLowerCase().trim();
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function parseQuery(query) {
    const filters = {};
    const terms = [];

    for (const rawPart of String(query || '').trim().split(/\s+/).filter(Boolean)) {
      const match = rawPart.match(/^([a-z]+):(.*)$/i);
      if (match && FILTERS.has(match[1].toLowerCase())) {
        const key = match[1].toLowerCase();
        const value = normalizeText(match[2]);
        if (value) {
          if (!filters[key]) filters[key] = [];
          filters[key].push(value);
        }
      } else {
        terms.push(normalizeText(rawPart));
      }
    }

    return {
      raw: String(query || ''),
      text: terms.join(' '),
      terms,
      filters,
    };
  }

  function fuzzyIncludes(haystack, needle) {
    const text = normalizeText(haystack);
    const query = normalizeText(needle);
    if (!query) return true;
    if (text.includes(query)) return true;

    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) queryIndex += 1;
    }
    return queryIndex === query.length;
  }

  function makeOpenTabRecord(tab, groupTitle = '') {
    const domain = getDomain(tab.url);
    return {
      id: `tab:${tab.id}`,
      type: 'tab',
      tabId: tab.id,
      title: tab.title || tab.url || '',
      url: tab.url || '',
      domain,
      group: groupTitle || '',
      saved: false,
      source: tab,
      text: normalizeText([tab.title, tab.url, domain, groupTitle].join(' ')),
    };
  }

  function makeSavedRecord(item) {
    const domain = getDomain(item.url);
    return {
      id: `saved:${item.id}`,
      type: 'saved',
      title: item.title || item.url || '',
      url: item.url || '',
      domain,
      group: '',
      saved: true,
      source: item,
      text: normalizeText([item.title, item.url, domain, 'saved'].join(' ')),
    };
  }

  function makeSessionRecord(session) {
    const explicitUrls = Array.isArray(session.urls) ? session.urls : [];
    const tabUrls = Array.isArray(session.tabs) ? session.tabs.map(tab => tab.url).filter(Boolean) : [];
    const urls = [...explicitUrls, ...tabUrls].filter(Boolean);
    const domains = Array.from(new Set(urls.map(getDomain).filter(Boolean)));
    const groupTitles = Array.isArray(session.tabs)
      ? session.tabs.map(tab => tab.groupTitle).filter(Boolean)
      : [];
    const group = [session.group, ...groupTitles].filter(Boolean).join(' ');
    return {
      id: `session:${session.id}`,
      type: 'session',
      title: session.title || session.name || 'Saved session',
      url: urls.join(' '),
      domain: domains.join(' '),
      group,
      saved: true,
      source: session,
      text: normalizeText([session.title, session.name, group, urls.join(' '), domains.join(' '), 'saved session'].join(' ')),
    };
  }

  function buildSearchIndex({ tabs = [], tabGroups = [], savedTabs = [], savedSessions = [] } = {}) {
    const groupTitleById = new Map();
    for (const group of tabGroups || []) {
      groupTitleById.set(group.id, group.title || '');
    }

    return [
      ...tabs.map(tab => makeOpenTabRecord(tab, groupTitleById.get(tab.groupId) || '')),
      ...savedTabs.map(makeSavedRecord),
      ...savedSessions.map(makeSessionRecord),
    ];
  }

  function filterMatches(record, filters) {
    if (filters.domain && !filters.domain.some(value => fuzzyIncludes(record.domain, value))) return false;
    if (filters.group && !filters.group.some(value => fuzzyIncludes(record.group, value))) return false;
    if (filters.url && !filters.url.some(value => fuzzyIncludes(record.url, value))) return false;
    if (filters.saved) {
      const wantsSaved = filters.saved.some(value => ['1', 'true', 'yes', 'y'].includes(value));
      const wantsOpen = filters.saved.some(value => ['0', 'false', 'no', 'n'].includes(value));
      if (wantsSaved && !record.saved) return false;
      if (wantsOpen && record.saved) return false;
    }
    return true;
  }

  function scoreRecord(record, parsedQuery) {
    if (!filterMatches(record, parsedQuery.filters)) return -1;
    if (parsedQuery.terms.length === 0) return 1;

    let score = 0;
    for (const term of parsedQuery.terms) {
      if (normalizeText(record.title).includes(term)) score += 8;
      else if (normalizeText(record.domain).includes(term)) score += 6;
      else if (normalizeText(record.url).includes(term)) score += 4;
      else if (normalizeText(record.group).includes(term)) score += 4;
      else if (fuzzyIncludes(record.text, term)) score += 1;
      else return -1;
    }
    return score;
  }

  function searchIndex(index, query) {
    const parsed = parseQuery(query);
    return (index || [])
      .map(record => ({ record, score: scoreRecord(record, parsed) }))
      .filter(result => result.score >= 0)
      .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
      .map(result => result.record);
  }

  function getHighlightTerms(query) {
    const parsed = typeof query === 'string' ? parseQuery(query) : (query || parseQuery(''));
    const terms = [...parsed.terms];
    for (const [key, values] of Object.entries(parsed.filters || {})) {
      if (key === 'saved') continue;
      terms.push(...values);
    }
    return Array.from(new Set(terms.filter(Boolean)));
  }

  function getHighlightSegments(text, query) {
    const source = String(text == null ? '' : text);
    const lower = source.toLowerCase();
    const ranges = [];

    for (const term of getHighlightTerms(query).sort((a, b) => b.length - a.length)) {
      const needle = normalizeText(term);
      if (!needle) continue;
      let start = 0;
      while (start < lower.length) {
        const index = lower.indexOf(needle, start);
        if (index === -1) break;
        ranges.push([index, index + needle.length]);
        start = index + needle.length;
      }
    }

    if (ranges.length === 0) return [{ text: source, match: false }];

    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    for (const range of ranges) {
      const last = merged[merged.length - 1];
      if (!last || range[0] > last[1]) merged.push([...range]);
      else last[1] = Math.max(last[1], range[1]);
    }

    const segments = [];
    let cursor = 0;
    for (const [start, end] of merged) {
      if (start > cursor) segments.push({ text: source.slice(cursor, start), match: false });
      segments.push({ text: source.slice(start, end), match: true });
      cursor = end;
    }
    if (cursor < source.length) segments.push({ text: source.slice(cursor), match: false });
    return segments;
  }

  const api = {
    parseQuery,
    fuzzyIncludes,
    buildSearchIndex,
    searchIndex,
    getHighlightTerms,
    getHighlightSegments,
    getDomain,
  };

  global.SuperTabOutSearch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

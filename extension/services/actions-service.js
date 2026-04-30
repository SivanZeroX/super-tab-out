/* Super Tab Out actions service.
   Shared action names keep renderers and event handling aligned. */
(function (global) {
  'use strict';

  const ACTIONS = Object.freeze({
    SET_THEME: 'set-theme',
    TOGGLE_THEME_MENU: 'toggle-theme-menu',
    SET_FONT_PRESET: 'set-font-preset',
    TOGGLE_FONT_MENU: 'toggle-font-menu',
    SET_FONT_SIZE: 'set-font-size',
    SET_LANGUAGE: 'set-language',
    CLOSE_TABOUT_DUPES: 'close-tabout-dupes',
    EXPAND_CHIPS: 'expand-chips',
    FOCUS_TAB: 'focus-tab',
    CLOSE_SINGLE_TAB: 'close-single-tab',
    DEFER_SINGLE_TAB: 'defer-single-tab',
    CHECK_DEFERRED: 'check-deferred',
    DISMISS_DEFERRED: 'dismiss-deferred',
    CLOSE_DOMAIN_TABS: 'close-domain-tabs',
    DEDUP_KEEP_ONE: 'dedup-keep-one',
    SWITCH_VIEW: 'switch-view',
    CLOSE_GROUP_TABS: 'close-group-tabs',
    UNGROUP_TABS: 'ungroup-tabs',
    CLOSE_ALL_OPEN_TABS: 'close-all-open-tabs',
  });

  function isKnownAction(action) {
    return Object.values(ACTIONS).includes(action);
  }

  const api = {
    ACTIONS,
    isKnownAction,
  };

  global.SuperTabOutActions = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

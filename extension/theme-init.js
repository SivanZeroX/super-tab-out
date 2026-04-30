/* Runs synchronously in <head> so stored appearance choices are applied
   before the body paints — avoids a flash of the default palette on reload. */
(function () {
  document.documentElement.dataset.theme = 'system';
  try {
    var themes = ['system', 'white', 'material', 'cupertino', 'warm', 'midnight', 'arctic', 'forest', 'graphite', 'coast', 'plum', 'matcha', 'ember', 'lavender'];
    var t = localStorage.getItem('tab-out-theme');
    if (themes.indexOf(t) !== -1) document.documentElement.dataset.theme = t;
  } catch (e) { /* localStorage unavailable — fall back to default */ }

  try {
    var lang = localStorage.getItem('tab-out-language');
    if (lang === 'zh' || lang === 'en') {
      document.documentElement.dataset.lang = lang;
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }
  } catch (e) { /* localStorage unavailable — fall back to default */ }

  try {
    var fontPreset = localStorage.getItem('tab-out-font-preset');
    if (['system', 'readable', 'compact', 'editorial'].indexOf(fontPreset) !== -1) {
      document.documentElement.dataset.fontPreset = fontPreset;
    }
  } catch (e) { /* localStorage unavailable — fall back to default */ }

  try {
    var rawSizes = localStorage.getItem('tab-out-font-size-overrides');
    var sizes = rawSizes ? JSON.parse(rawSizes) : {};
    var values = ['small', 'default', 'large'];
    ['header', 'cards', 'tabs'].forEach(function (area) {
      var value = sizes && values.indexOf(sizes[area]) !== -1 ? sizes[area] : 'default';
      var key = 'size' + area.charAt(0).toUpperCase() + area.slice(1);
      document.documentElement.dataset[key] = value;
    });
  } catch (e) { /* localStorage unavailable — fall back to default */ }
})();

(function () {
  'use strict';

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      document.documentElement.setAttribute(
        'data-ryu-ext-origin',
        chrome.runtime.getURL('').replace(/\/$/, '')
      );
    }
  } catch (_) {}
})();

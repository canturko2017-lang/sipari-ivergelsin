'use strict';

(() => {
  const key = 'canturko-last-suggested-mode';
  let mode = Math.random() < 0.5 ? 'kurye' : 'market';

  try {
    const last = localStorage.getItem(key);
    if (last === 'market') mode = 'kurye';
    if (last === 'kurye') mode = 'market';
    localStorage.setItem(key, mode);
  } catch {
    // Fresh suggestions still work when browser storage is unavailable.
  }

  const suggestions = {
    kurye: { text: 'Bu tur sürpriz mod kurye.', url: 'teslimat.html?gorev=yeni&mod=kurye' },
    market: { text: 'Bu tur sürpriz mod Süper Market.', url: 'super-market.html' },
  };

  document.getElementById('suggestion').textContent = suggestions[mode].text;
  document.getElementById('quickStart').href = suggestions[mode].url;
  if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();

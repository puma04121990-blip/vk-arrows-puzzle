// Cloud status lives in the menu header (Menu.js). Keep this file as a
// no-op patch so older HTML caches that still load it do not draw a
// second overlapping footer toast.
(function () {
  window.__pulseCloudUiV2 = true;
})();

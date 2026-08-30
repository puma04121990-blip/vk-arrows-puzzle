// Sharper Phaser text on phones. Do NOT resize the canvas backing store:
// VK WebView (often Canvas renderer) then shows the game in a corner on black.
(function () {
  function getDpr() {
    const raw = Number(window.devicePixelRatio || 1);
    if (!isFinite(raw) || raw < 1) return 1;
    return Math.min(raw, 2);
  }
  window.getUiDpr = getDpr;

  function patchText() {
    if (!Phaser.GameObjects || !Phaser.GameObjects.GameObjectFactory) return;
    const fac = Phaser.GameObjects.GameObjectFactory.prototype;
    if (fac.__pulseHiDpiText) return;
    fac.__pulseHiDpiText = true;
    const orig = fac.text;
    fac.text = function (x, y, content, style) {
      const next = Object.assign({}, style || {});
      if (next.resolution == null) next.resolution = getDpr();
      return orig.call(this, x, y, content, next);
    };
  }

  function install() {
    if (typeof Phaser === 'undefined') {
      setTimeout(install, 20);
      return;
    }
    try { patchText(); } catch (e) { console.warn('[ArrowPulse] hidpi text', e); }
  }
  install();
})();

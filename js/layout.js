/** Shared safe layout so UI never collides in VK portrait or landscape iframes. */
window.pulseLayout = function (scene) {
  const w = Math.max(1, Math.round(scene.scale.width || scene.sys.game.config.width || 720));
  const h = Math.max(1, Math.round(scene.scale.height || scene.sys.game.config.height || 1280));
  const wide = w >= h;
  const short = h < 560;
  const padT = Math.max(wide ? 16 : 24, Math.round(h * 0.025));
  const padB = Math.max(wide ? 18 : 28, Math.round(h * 0.035));
  const padX = Math.max(16, Math.round(w * 0.05));
  return {
    w: w,
    h: h,
    cx: w / 2,
    wide: wide,
    short: short,
    padT: padT,
    padB: padB,
    padX: padX
  };
};

window.pulseGap = function (aBottom, bTop) {
  return Math.max(0, bTop - aBottom);
};

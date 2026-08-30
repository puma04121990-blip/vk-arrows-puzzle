/** Shared safe layout so UI never collides in VK portrait or landscape iframes. */
window.pulseLayout = function (scene) {
  const w = Math.max(1, Math.round(scene.scale.width || scene.sys.game.config.width || 720));
  const h = Math.max(1, Math.round(scene.scale.height || scene.sys.game.config.height || 1280));
  const wide = w >= h;
  const short = h < 560;
  const padT = Math.max(wide ? 16 : 24, Math.round(h * 0.025));
  const padB = Math.max(wide ? 28 : 40, Math.round(h * 0.05));
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

/** Header/footer so «МЕНЮ» sits above the iframe edge, not under VK chrome. */
window.pulseChrome = function (scene) {
  const w = Math.max(1, Math.round(scene.scale.width || 720));
  const h = Math.max(1, Math.round(scene.scale.height || 1280));
  const wide = w >= h;
  const headerH = wide ? 70 : 92;
  const footerH = wide ? 92 : 108;
  const btnY = h - Math.round(footerH * 0.5);
  return { w: w, h: h, wide: wide, headerH: headerH, footerH: footerH, btnY: btnY };
};

window.pulseWasDrag = function (scene) {
  return !!(scene && scene._pulseDragMoved);
};

window.pulseBindScroll = function (scene, container, opts) {
  opts = opts || {};
  const headerH = opts.headerH || 0;
  const footerTop = opts.footerTop != null ? opts.footerTop : scene.scale.height;
  const maxScroll = Math.max(0, opts.maxScroll || 0);
  scene._pulseDragMoved = false;
  let dragging = false;
  let lastY = 0;
  let startX = 0;
  let startY = 0;
  const thresh = 14;
  scene.input.on('pointerdown', (p) => {
    if (p.y < headerH || p.y > footerTop) return;
    dragging = true;
    lastY = p.y;
    startX = p.x;
    startY = p.y;
    scene._pulseDragMoved = false;
  });
  scene.input.on('pointermove', (p) => {
    if (!dragging) return;
    if (Math.abs(p.y - startY) > thresh || Math.abs(p.x - startX) > thresh) {
      scene._pulseDragMoved = true;
    }
    if (maxScroll > 0 && container) {
      const dy = p.y - lastY;
      lastY = p.y;
      container.y = Phaser.Math.Clamp(container.y + dy, -maxScroll, 0);
    }
  });
  const endDrag = () => { dragging = false; };
  scene.input.on('pointerup', endDrag);
  scene.input.on('pointerupoutside', endDrag);
  scene.input.on('wheel', (pointer, over, dx, dy) => {
    if (maxScroll <= 0 || !container) return;
    container.y = Phaser.Math.Clamp(container.y - dy * 0.55, -maxScroll, 0);
  });
};

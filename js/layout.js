/** Extra bottom inset: VK web iframe / browser chrome often covers the last pixels. */
window.pulseWebInset = function () {
  let extra = 12;
  try {
    const q = String(window.location.search || '') + String(window.location.hash || '');
    const platform = ((q.match(/[?&]vk_platform=([a-z0-9_]+)/i) || [])[1] || '').toLowerCase();
    if (platform === 'desktop_web') extra = 40;
    else if (platform === 'mobile_web' || platform === 'html5' || platform === 'html5_mobile') extra = 34;
    else if (platform === 'mobile_android' || platform === 'mobile_iphone' || platform === 'mobile_ipad') extra = 10;
    else extra = 24;
    if (window.visualViewport && window.innerHeight) {
      const delta = Math.round(window.innerHeight - window.visualViewport.height);
      if (delta > extra) extra = Math.min(52, delta);
    }
  } catch (e) {}
  return extra;
};

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
  const web = (window.pulseWebInset && window.pulseWebInset()) || 0;
  const headerH = wide ? 70 : 92;
  const footerH = (wide ? 92 : 108) + Math.max(0, web - 10);
  let btnY = h - Math.round(footerH * 0.5);
  const btnHalf = wide ? 20 : 24;
  const maxBtnY = h - web - 8 - btnHalf;
  if (btnY > maxBtnY) btnY = maxBtnY;
  if (btnY < headerH + btnHalf + 8) btnY = Math.max(btnHalf + 8, h - footerH + btnHalf);
  return { w: w, h: h, wide: wide, headerH: headerH, footerH: footerH, btnY: btnY, webInset: web };
};

/** Game-scene action dock (ЗАНОВО / подсказка / МЕНЮ) — always fully on-screen. */
window.pulseGameDock = function (scene) {
  const w = Math.max(1, Math.round(scene.scale.width || 720));
  const h = Math.max(1, Math.round(scene.scale.height || 1280));
  const wide = w >= h;
  const short = h < 560;
  const web = (window.pulseWebInset && window.pulseWebInset()) || 12;
  const btnH = short ? 36 : (wide ? 40 : 46);
  const gapTop = short ? 6 : 8;
  const gapBot = 8;
  const footerH = gapTop + btnH + gapBot + web;
  const dockY = Math.max(0, h - footerH);
  let btnY = dockY + gapTop + btnH / 2;
  const maxBtnY = h - web - gapBot - btnH / 2;
  if (btnY > maxBtnY) btnY = maxBtnY;
  if (btnY < btnH / 2 + 4) btnY = btnH / 2 + 4;
  return {
    w: w,
    h: h,
    wide: wide,
    short: short,
    webInset: web,
    btnH: btnH,
    footerH: footerH,
    dockY: dockY,
    btnY: btnY,
    topPad: wide ? (short ? 72 : 88) : 80
  };
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

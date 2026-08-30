/** Extra bottom inset: VK web iframe / browser chrome often covers the last pixels. */
window.pulseWebInset = function () {
  let extra = 16;
  try {
    const q = String(window.location.search || '') + String(window.location.hash || '');
    const platform = ((q.match(/[?&]vk_platform=([a-z0-9_]+)/i) || [])[1] || '').toLowerCase();
    if (platform === 'desktop_web') extra = 48;
    else if (platform === 'mobile_web' || platform === 'html5' || platform === 'html5_mobile') extra = 40;
    else if (platform === 'mobile_android' || platform === 'mobile_iphone' || platform === 'mobile_ipad') extra = 12;
    else extra = 32;
    if (window.visualViewport && window.innerHeight) {
      const delta = Math.round(window.innerHeight - window.visualViewport.height);
      if (delta > extra) extra = Math.min(64, delta);
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

/** Header/footer so «МЕНЮ» sits fully above the iframe edge, not under VK chrome. */
window.pulseChrome = function (scene) {
  const w = Math.max(1, Math.round(scene.scale.width || 720));
  const h = Math.max(1, Math.round(scene.scale.height || 1280));
  const wide = w >= h;
  const short = h < 560;
  const web = (window.pulseWebInset && window.pulseWebInset()) || 16;
  const headerH = wide ? 70 : 92;
  const btnH = short ? 38 : (wide ? 42 : 46);
  const gapTop = 8;
  const gapBot = 10;
  const footerH = gapTop + btnH + gapBot + web;
  const dockY = Math.max(0, h - footerH);
  let btnY = dockY + gapTop + btnH / 2;
  const maxBtnY = h - web - gapBot - btnH / 2;
  if (btnY > maxBtnY) btnY = maxBtnY;
  if (btnY < headerH + btnH / 2 + 8) btnY = Math.max(btnH / 2 + 8, dockY + btnH / 2);
  return {
    w: w,
    h: h,
    wide: wide,
    short: short,
    headerH: headerH,
    footerH: footerH,
    btnY: btnY,
    btnH: btnH,
    webInset: web,
    dockY: dockY
  };
};

/** Same pill back-button on every sub-menu (Settings / Shop / Help / …). */
window.pulseBackButton = function (scene, onClick, opts) {
  opts = opts || {};
  const chrome = opts.chrome || (window.pulseChrome && window.pulseChrome(scene)) || {};
  const x = opts.x != null ? opts.x : (chrome.w || scene.scale.width) / 2;
  const y = opts.y != null ? opts.y : (chrome.btnY || scene.scale.height - 56);
  const label = opts.label || '← МЕНЮ';
  const wide = chrome.wide != null ? chrome.wide : scene.scale.width >= scene.scale.height;
  const btnH = opts.h || chrome.btnH || (wide ? 42 : 46);
  const btnW = opts.w || 220;
  const primary = !!opts.primary;
  const depth = opts.depth != null ? opts.depth : 60;
  if (window.createNiceButton) {
    return window.createNiceButton(scene, x, y, label, onClick, {
      w: btnW,
      h: btnH,
      color: primary ? 0x00e8c8 : 0x222238,
      secondary: !primary,
      fontSize: opts.fontSize || (wide ? '15px' : '16px'),
      depth: depth
    });
  }
  const t = scene.add.text(x, y, label, {
    fontFamily: 'Manrope, Arial, sans-serif',
    fontSize: wide ? '16px' : '18px',
    color: primary ? '#0b0b14' : '#d0d0e8',
    backgroundColor: primary ? '#00e8c8' : '#1e1e32',
    padding: { x: 22, y: 12 }
  }).setOrigin(0.5).setDepth(depth).setInteractive({ useHandCursor: true });
  t.on('pointerup', onClick);
  return t;
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

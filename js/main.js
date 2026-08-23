window.vkUser = null;
const host = String(window.location.hostname || '');
const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(host);
const launchQuery = String(window.location.search || '') + String(window.location.hash || '');
const hasVkLaunch = /vk_user_id=|vk_app_id=|sign=/.test(launchQuery);
const inIframe = (function () {
  try { return window.parent !== window; } catch (e) { return true; }
})();
window.isVK = typeof vkBridge !== 'undefined' && !isLocalHost && (
  inIframe || hasVkLaunch || /(^|\.)vk\.(com|ru)$/i.test(host) || /vk-apps/i.test(host)
);

window.hasConsentAccepted = function () {
  return !!(window.gameProgress && window.gameProgress.consentAccepted);
};

window.setConsentAccepted = function (value) {
  const on = !!value;
  if (window.gameProgress) window.gameProgress.consentAccepted = on;
  if (on && window.persistProgress) {
    try { window.persistProgress(true); } catch (e) {}
  }
};

function detectLayout() {
  const w = window.innerWidth || 720;
  const h = window.innerHeight || 1280;
  return w > h;
}

window.isLandscapeLayout = detectLayout();
window.GAME_W = window.isLandscapeLayout ? 1280 : 720;
window.GAME_H = window.isLandscapeLayout ? 720 : 1280;

function initVK() {
  const load = () => {
    if (!window.loadProgress) {
      window.gameProgress = window.gameProgress || { loaded: true };
      window.gameProgress.loaded = true;
      if (window.markProgressReady) window.markProgressReady();
      return Promise.resolve();
    }
    return window.loadProgress().then(() => {
      if (window.markProgressReady) window.markProgressReady();
    });
  };

  if (!window.isVK && typeof vkBridge === 'undefined') {
    return load();
  }

  if (typeof vkBridge === 'undefined') {
    return load();
  }

  return vkBridge.send('VKWebAppInit')
    .then(() => vkBridge.send('VKWebAppSetViewSettings', {
      status_bar_style: 'light',
      action_bar_color: '#0b0b14',
      navigation_bar_color: '#0b0b14'
    }).catch(() => null))
    .then(() => vkBridge.send('VKWebAppGetUserInfo').catch(() => null))
    .then((user) => {
      if (user && user.id) {
        window.vkUser = user;
        window.isVK = true;
      }
      if (!window.vkUser || !window.vkUser.id) {
        try {
          const m = launchQuery.match(/vk_user_id=(\d+)/);
          if (m) {
            window.vkUser = Object.assign({}, window.vkUser || {}, { id: Number(m[1]) });
            window.isVK = true;
          }
        } catch (e) {}
      }
    })
    .then(() => {
      if (window.preloadVKAds) return window.preloadVKAds().catch(() => null);
    })
    .catch((err) => {
      console.warn('[ArrowPulse] VK init error:', err);
    })
    .then(() => load());
}

function setupLifecycle() {
  try {
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  } catch (e) {}
}

setupLifecycle();

const progressInitPromise = Promise.race([
  Promise.resolve().then(() => initVK()),
  new Promise((resolve) => setTimeout(() => {
    if (window.gameProgress && window.gameProgress.loaded) {
      resolve();
      return;
    }
    console.warn('[ArrowPulse] cloud load timed out after 12s');
    if (window.gameProgress) window.gameProgress.loaded = true;
    if (window.markProgressReady) window.markProgressReady();
    resolve();
  }, 12000))
]);
window.progressInitPromise = progressInitPromise;

function stripLegacySupportButton(scene) {
  if (!scene || !scene.children || !scene.children.list) return;
  const supportText = scene.children.list.find((child) => child && child.text === 'ПОДДЕРЖКА');
  if (!supportText) return;
  const supportButton = supportText.parentContainer || supportText;
  const legalText = scene.children.list.find((child) => child && child.text === 'ПРАВОВАЯ');
  const helpText = scene.children.list.find((child) => child && child.text === 'КАК ИГРАТЬ');
  if (legalText && helpText) {
    const legalButton = legalText.parentContainer || legalText;
    const step = Number(legalButton.y) - Number((helpText.parentContainer || helpText).y);
    if (Number.isFinite(step) && Math.abs(step) > 0) legalButton.y -= step;
  }
  try { supportButton.destroy(true); } catch (e) { try { supportButton.destroy(); } catch (ignore) {} }
}

if (typeof MenuScene !== 'undefined' && MenuScene.prototype && !MenuScene.prototype.__legacySupportGuard) {
  const originalMenuCreate = MenuScene.prototype.create;
  MenuScene.prototype.create = function () {
    originalMenuCreate.apply(this, arguments);
    this.time.delayedCall(0, () => stripLegacySupportButton(this));
  };
  MenuScene.prototype.__legacySupportGuard = true;
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME_W,
  height: window.GAME_H,
  backgroundColor: '#0b0b14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.GAME_W,
    height: window.GAME_H,
    expandParent: true
  },
  render: {
    roundPixels: true,
    antialias: true
  },
  input: {
    activePointers: 3,
    mouse: { preventDefaultWheel: true }
  },
  scene: [
    BootScene,
    ConsentScene,
    MenuScene,
    LevelsMapScene,
    AchievementsScene,
    SkinsScene,
    ShopScene,
    SettingsScene,
    HelpScene,
    SupportScene,
    LegalScene,
    GameScene,
    WinScene
  ],
  audio: { disableWebAudio: false },
  banner: false,
  disableContextMenu: true
};

window.gameData = {
  currentLevel: 0,
  totalLevels: typeof LEVELS !== 'undefined' ? LEVELS.length : 50,
  stars: 0,
  moves: 0,
  mistakes: 0
};

const game = new Phaser.Game(config);
window.game = game;

function centerCanvas() {
  if (!game || !game.canvas) return;
  const canvas = game.canvas;
  canvas.style.cursor = 'default';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  try {
    const sw = parseFloat(canvas.style.width) || canvas.clientWidth;
    const sh = parseFloat(canvas.style.height) || canvas.clientHeight;
    if (sw > 0) canvas.style.width = Math.round(sw) + 'px';
    if (sh > 0) canvas.style.height = Math.round(sh) + 'px';
  } catch (e) {}
  const parent = canvas.parentElement;
  if (parent) {
    parent.style.display = 'flex';
    parent.style.justifyContent = 'center';
    parent.style.alignItems = 'center';
  }
}

if (game.canvas) {
  game.events.once('ready', () => {
    if (game.scale) game.scale.refresh();
    centerCanvas();
    setTimeout(centerCanvas, 50);
    setTimeout(centerCanvas, 200);
  });
}

let lastLandscape = window.isLandscapeLayout;
function checkOrientation() {
  const now = detectLayout();
  if (now !== lastLandscape) {
    lastLandscape = now;
    window.location.reload();
  } else if (game && game.scale) {
    game.scale.refresh();
    centerCanvas();
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(checkOrientation, 150);
});

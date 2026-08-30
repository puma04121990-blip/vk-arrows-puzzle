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

function withTimeout(promise, ms) {
  return Promise.race([
    Promise.resolve(promise).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), ms))
  ]);
}

function initVK() {
  const load = () => {
    if (!window.loadProgress) {
      window.gameProgress = window.gameProgress || { loaded: true };
      window.gameProgress.loaded = true;
      if (window.markProgressReady) window.markProgressReady();
      return Promise.resolve();
    }
    return withTimeout(window.loadProgress(), 3500).then(() => {
      if (window.gameProgress) window.gameProgress.loaded = true;
      if (window.markProgressReady) window.markProgressReady();
    });
  };

  if (typeof vkBridge === 'undefined' || isLocalHost) {
    return load();
  }

  return withTimeout(vkBridge.send('VKWebAppInit'), 2000)
    .then(() => withTimeout(vkBridge.send('VKWebAppSetViewSettings', {
      status_bar_style: 'light',
      action_bar_color: '#0b0b14',
      navigation_bar_color: '#0b0b14'
    }), 1500))
    .then(() => {
      try {
        const m = launchQuery.match(/vk_user_id=(\d+)/);
        if (m) {
          window.vkUser = Object.assign({}, window.vkUser || {}, { id: Number(m[1]) });
          window.isVK = true;
        }
      } catch (e) {}
      vkBridge.send('VKWebAppGetUserInfo').then((user) => {
        if (user && user.id) {
          window.vkUser = user;
          window.isVK = true;
        }
      }).catch(() => {});
    })
    .catch((err) => {
      console.warn('[ArrowPulse] VK init error:', err);
    })
    .then(() => load())
    .then(() => {
      if (window.preloadVKAds) window.preloadVKAds().catch(() => {});
    });
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
    console.warn('[ArrowPulse] boot timed out');
    if (window.gameProgress) window.gameProgress.loaded = true;
    if (window.markProgressReady) window.markProgressReady();
    resolve();
  }, 4000))
]);
window.progressInitPromise = progressInitPromise;

const parent = document.getElementById('game-container');
window.GAME_W = Math.max(320, (parent && parent.clientWidth) || window.innerWidth || 720);
window.GAME_H = Math.max(480, (parent && parent.clientHeight) || window.innerHeight || 1280);

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME_W,
  height: window.GAME_H,
  backgroundColor: '#0b0b14',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    expandParent: false
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

let resizeTimer = 0;
function relayoutOnResize() {
  if (!game || !game.scale) return;
  game.scale.refresh();
  const live = game.scene.getScenes(true)[0];
  if (!live || !live.scene) return;
  const key = live.scene.key;
  if (key === 'Game' || key === 'Win') return;
  try { live.scene.restart(); } catch (e) {}
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(relayoutOnResize, 180);
});
window.addEventListener('orientationchange', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(relayoutOnResize, 220);
});

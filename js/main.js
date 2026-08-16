window.vkUser = null;
const host = String(window.location.hostname || '');
const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(host);
window.isVK = typeof vkBridge !== 'undefined' && !isLocalHost && (
  window.parent !== window ||
  /vk_user_id=|vk_app_id=|sign=/.test(String(window.location.search || ''))
);

const CONSENT_KEY = 'arrow_pulse_consent_v1';
const VK_CONSENT_KEY = 'ap_consent';

window.hasConsentAccepted = function () {
  try {
    if (localStorage.getItem(CONSENT_KEY) === '1') return true;
  } catch (e) {}
  if (window.gameProgress && window.gameProgress.consentAccepted) return true;
  return false;
};

window.setConsentAccepted = function (value) {
  const on = !!value;
  if (window.gameProgress) window.gameProgress.consentAccepted = on;
  try {
    if (on) localStorage.setItem(CONSENT_KEY, '1');
    else localStorage.removeItem(CONSENT_KEY);
  } catch (e) {}
  if (window.isVK && typeof vkBridge !== 'undefined' && on) {
    vkBridge.send('VKWebAppStorageSet', { key: VK_CONSENT_KEY, value: '1' }).catch(() => {});
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
      if (window.isVK && typeof vkBridge !== 'undefined') {
        return vkBridge.send('VKWebAppStorageGet', { keys: [VK_CONSENT_KEY] })
          .then((result) => {
            const list = (result && result.keys) || [];
            for (let i = 0; i < list.length; i++) {
              if (list[i] && list[i].key === VK_CONSENT_KEY && list[i].value === '1') {
                window.setConsentAccepted(true);
              }
            }
          })
          .catch(() => {})
          .then(() => {
            if (window.markProgressReady) window.markProgressReady();
          });
      }
      if (window.markProgressReady) window.markProgressReady();
    });
  };

  if (!window.isVK) {
    return load();
  }

  return vkBridge.send('VKWebAppInit')
    .then(() => vkBridge.send('VKWebAppSetViewSettings', {
      status_bar_style: 'light',
      action_bar_color: '#0b0b14',
      navigation_bar_color: '#0b0b14'
    }).catch(() => null))
    .then(() => vkBridge.send('VKWebAppGetUserInfo').catch(() => null))
    .then((user) => { if (user) window.vkUser = user; })
    .then(() => {
      if (window.preloadVKAds) return window.preloadVKAds().catch(() => null);
    })
    .catch((err) => {
      console.warn('[ArrowPulse] VK init error:', err);
    })
    .then(() => Promise.race([
      load(),
      new Promise((resolve) => setTimeout(resolve, 3500))
    ]));
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
    if (window.gameProgress) window.gameProgress.loaded = true;
    if (window.markProgressReady) window.markProgressReady();
    resolve();
  }, 4000))
]);
window.progressInitPromise = progressInitPromise;

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

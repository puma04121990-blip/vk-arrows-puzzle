window.vkUser = null;

/** True when running inside VK client / iframe (not just because bridge script is loaded). */
window.isVK = (function detectVK() {
  if (typeof vkBridge === 'undefined' || typeof vkBridge.send !== 'function') return false;
  try {
    const s = String(window.location.search || '') + String(window.location.hash || '');
    if (/vk_user_id=|vk_app_id=|sign=/.test(s)) return true;
  } catch (e) {}
  try {
    const ref = String(document.referrer || '');
    if (/(\.|^)(vk\.com|vk\.ru|vkontakte\.ru)/i.test(ref)) return true;
  } catch (e) {}
  // Bridge present in iframe — still try VK APIs
  try {
    if (window.parent && window.parent !== window) return true;
  } catch (e) {
    return true; // cross-origin parent ⇒ likely VK iframe
  }
  return false;
})();

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
  const w = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 720);
  const h = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1280);
  return w > h;
}

window.isLandscapeLayout = detectLayout();
window.GAME_W = window.isLandscapeLayout ? 1280 : 720;
window.GAME_H = window.isLandscapeLayout ? 720 : 1280;

/**
 * Snap canvas CSS size to whole pixels — kills subpixel blur
 * that moderators flagged as "избыточное размытие".
 */
function snapCanvasPixels(game) {
  if (!game || !game.canvas || !game.scale) return;
  try {
    const canvas = game.canvas;
    const styleW = parseFloat(canvas.style.width) || canvas.clientWidth;
    const styleH = parseFloat(canvas.style.height) || canvas.clientHeight;
    if (styleW > 0 && styleH > 0) {
      canvas.style.width = Math.round(styleW) + 'px';
      canvas.style.height = Math.round(styleH) + 'px';
    }
    // Center explicitly inside parent
    const parent = canvas.parentElement;
    if (parent) {
      parent.style.display = 'flex';
      parent.style.justifyContent = 'center';
      parent.style.alignItems = 'center';
    }
  } catch (e) {}
}

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

  if (!window.isVK || typeof vkBridge === 'undefined') {
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
      if (window.preloadVKAds) return window.preloadVKAds().catch(() => {});
    })
    .catch((err) => console.warn('[ArrowPulse] VK Bridge error:', err))
    .then(() => load());
}

function setupLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'running') {
        window.gameAudioCtx.suspend().catch(() => {});
      }
      if (window.persistProgress) window.persistProgress();
    } else {
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'suspended') {
        window.gameAudioCtx.resume().catch(() => {});
      }
      // Re-pull cloud progress when returning to the app (2.3.8)
      if (window.loadProgress) {
        window.loadProgress().catch(() => {});
      }
    }
  });

  // VK: mute audio when WebView is hidden
  if (window.isVK && typeof vkBridge !== 'undefined' && vkBridge.subscribe) {
    try {
      vkBridge.subscribe((e) => {
        const t = e && e.detail && e.detail.type;
        if (t === 'VKWebAppViewHide' || t === 'VKWebAppViewRestore') {
          if (t === 'VKWebAppViewHide') {
            if (window.gameAudioCtx && window.gameAudioCtx.state === 'running') {
              window.gameAudioCtx.suspend().catch(() => {});
            }
            if (window.persistProgress) window.persistProgress();
          } else if (window.loadProgress) {
            window.loadProgress().catch(() => {});
          }
        }
      });
    } catch (e) {}
  }

  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  window.addEventListener('pagehide', () => {
    if (window.persistProgress) window.persistProgress();
  });
}

setupLifecycle();

const progressInitPromise = initVK();
window.progressInitPromise = progressInitPromise;

const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME_W,
  height: window.GAME_H,
  backgroundColor: '#0b0b14',
  resolution: dpr,
  render: {
    antialias: true,
    roundPixels: true,
    pixelArt: false,
    transparent: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.GAME_W,
    height: window.GAME_H,
    expandParent: true
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
    HelpScene,
    LegalScene,
    GameScene,
    WinScene
  ],
  audio: { disableWebAudio: false },
  banner: false,
  disableContextMenu: true,
  fps: { target: 60, forceSetTimeOut: false }
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

if (game.canvas) {
  game.canvas.style.cursor = 'default';
  // Center + snap after first layout
  game.events.once('ready', () => {
    snapCanvasPixels(game);
    if (game.scale) game.scale.refresh();
    setTimeout(() => snapCanvasPixels(game), 50);
    setTimeout(() => snapCanvasPixels(game), 250);
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
    snapCanvasPixels(game);
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(checkOrientation, 150);
});

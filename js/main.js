window.vkUser = null;
window.isVK = typeof vkBridge !== 'undefined';

function detectLayout() {
  const w = window.innerWidth || 720;
  const h = window.innerHeight || 1280;
  return w > h;
}

window.isLandscapeLayout = detectLayout();
window.GAME_W = window.isLandscapeLayout ? 1280 : 720;
window.GAME_H = window.isLandscapeLayout ? 720 : 1280;

/**
 * Init VK Bridge, then load cloud progress BEFORE game UI relies on it.
 * Progress must sync across Android / iOS / Web (rule 2.3.8).
 */
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
    .catch((err) => console.warn('[ArrowPulse] VK Bridge error:', err))
    .then(() => load());
}

function setupLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'running') {
        window.gameAudioCtx.suspend().catch(() => {});
      }
      // Flush progress when app is backgrounded
      if (window.persistProgress) window.persistProgress();
    } else {
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'suspended') {
        window.gameAudioCtx.resume().catch(() => {});
      }
    }
  });

  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Extra flush on page hide (mobile WebView)
  window.addEventListener('pagehide', () => {
    if (window.persistProgress) window.persistProgress();
  });
}

setupLifecycle();

// Start progress load immediately (in parallel with Phaser boot)
const progressInitPromise = initVK();
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
    height: window.GAME_H
  },
  input: {
    activePointers: 3,
    mouse: { preventDefaultWheel: true }
  },
  scene: [
    BootScene,
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

if (game.canvas) game.canvas.style.cursor = 'default';

let lastLandscape = window.isLandscapeLayout;
function checkOrientation() {
  const now = detectLayout();
  if (now !== lastLandscape) {
    lastLandscape = now;
    window.location.reload();
  } else if (game && game.scale) {
    game.scale.refresh();
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(checkOrientation, 150);
});

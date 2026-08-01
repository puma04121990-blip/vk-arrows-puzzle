window.vkUser = null;
window.isVK = typeof vkBridge !== 'undefined';

function initVK() {
  if (!window.isVK) {
    if (window.loadProgress) window.loadProgress();
    return Promise.resolve();
  }

  return vkBridge.send('VKWebAppInit')
    .then(() => vkBridge.send('VKWebAppSetViewSettings', {
      status_bar_style: 'light',
      action_bar_color: '#0b0b14',
      navigation_bar_color: '#0b0b14'
    }))
    .then(() => vkBridge.send('VKWebAppGetUserInfo').catch(() => null))
    .then((user) => { if (user) window.vkUser = user; })
    .catch((err) => console.warn('[ArrowPulse] VK Bridge error:', err))
    .finally(() => { if (window.loadProgress) window.loadProgress(); });
}

function setupLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'running') {
        window.gameAudioCtx.suspend().catch(() => {});
      }
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
}

setupLifecycle();
initVK();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 720,
  height: 1280,
  backgroundColor: '#0b0b14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
    // На больших мониторах не растягиваем бесконечно — удобный размер
    max: {
      width: 540,
      height: 960
    }
  },
  input: {
    activePointers: 3,
    mouse: {
      preventDefaultWheel: true
    }
  },
  scene: [BootScene, MenuScene, LevelsMapScene, AchievementsScene, SkinsScene, GameScene, WinScene],
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

// Курсор-рука на интерактиве (ПК)
game.canvas.style.cursor = 'default';

window.addEventListener('resize', () => {
  if (game && game.scale) game.scale.refresh();
});

// На ПК колесо мыши не скроллит страницу
window.addEventListener('wheel', (e) => {
  e.preventDefault();
}, { passive: false });

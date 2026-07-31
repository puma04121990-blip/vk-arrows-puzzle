// ============================================
// VK Games / Mini Apps — инициализация
// ============================================

window.vkUser = null;
window.isVK = typeof vkBridge !== 'undefined';

function initVK() {
  if (!window.isVK) {
    console.log('[ArrowPulse] Running outside VK');
    if (window.loadProgress) window.loadProgress();
    return Promise.resolve();
  }

  return vkBridge.send('VKWebAppInit')
    .then(() => {
      // Тёмная тема под интерфейс игры
      return vkBridge.send('VKWebAppSetViewSettings', {
        status_bar_style: 'light',
        action_bar_color: '#0b0b14',
        navigation_bar_color: '#0b0b14'
      });
    })
    .then(() => vkBridge.send('VKWebAppGetUserInfo').catch(() => null))
    .then((user) => {
      if (user) window.vkUser = user;
    })
    .catch((err) => {
      console.warn('[ArrowPulse] VK Bridge error:', err);
    })
    .finally(() => {
      if (window.loadProgress) window.loadProgress();
    });
}

// Сворачивание / возврат игры (iframe VK)
function setupLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Игра свернута — можно поставить звук на паузу
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'running') {
        window.gameAudioCtx.suspend().catch(() => {});
      }
    } else {
      if (window.gameAudioCtx && window.gameAudioCtx.state === 'suspended') {
        window.gameAudioCtx.resume().catch(() => {});
      }
    }
  });

  // Запрет контекстного меню (мешает на мобильных)
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Блокировка жеста «потянуть вниз = обновить» где возможно
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
}

setupLifecycle();
initVK();

// ============================================
// Phaser
// ============================================

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
    height: 1280
  },
  // Важно для мобильных VK-клиентов
  input: {
    activePointers: 3
  },
  scene: [BootScene, MenuScene, GameScene, WinScene],
  audio: {
    disableWebAudio: false
  },
  banner: false
};

window.gameData = {
  currentLevel: 0,
  totalLevels: typeof LEVELS !== 'undefined' ? LEVELS.length : 50,
  stars: 0,
  moves: 0
};

const game = new Phaser.Game(config);

// Подстройка при изменении размера окна / ориентации в VK
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.refresh();
  }
});

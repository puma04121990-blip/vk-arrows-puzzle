// ============================================
// VK Bridge init
// ============================================

window.vkUser = null;

function initVK() {
  if (typeof vkBridge === 'undefined') {
    console.log('VK Bridge not found — running outside VK');
    // Вне VK сразу грузим прогресс из localStorage
    if (window.loadProgress) window.loadProgress();
    return;
  }

  vkBridge.send('VKWebAppInit')
    .then(() => {
      return vkBridge.send('VKWebAppSetViewSettings', {
        status_bar_style: 'light',
        action_bar_color: '#0b0b14',
        navigation_bar_color: '#0b0b14'
      });
    })
    .then(() => vkBridge.send('VKWebAppGetUserInfo'))
    .then((user) => {
      window.vkUser = user;
    })
    .catch((err) => {
      console.warn('VK Bridge error:', err);
    })
    .finally(() => {
      // После инициализации VK загружаем прогресс
      if (window.loadProgress) window.loadProgress();
    });
}

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
  scene: [BootScene, MenuScene, GameScene, WinScene],
  audio: {
    disableWebAudio: false
  }
};

window.gameData = {
  currentLevel: 0,
  totalLevels: typeof LEVELS !== 'undefined' ? LEVELS.length : 50,
  stars: 0,
  moves: 0
};

const game = new Phaser.Game(config);

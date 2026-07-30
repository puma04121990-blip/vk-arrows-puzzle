// ============================================
// VK Bridge init (обязательно для каталога VK)
// ============================================

window.vkUser = null;

function initVK() {
  if (typeof vkBridge === 'undefined') {
    console.log('VK Bridge not found — running outside VK');
    return;
  }

  // Обязательная инициализация
  vkBridge.send('VKWebAppInit')
    .then(() => {
      console.log('VKWebAppInit OK');

      // Настройка статус-бара под тёмную тему игры
      return vkBridge.send('VKWebAppSetViewSettings', {
        status_bar_style: 'light',
        action_bar_color: '#0b0b14',
        navigation_bar_color: '#0b0b14'
      });
    })
    .then(() => {
      // Получаем данные пользователя (для приветствия в меню)
      return vkBridge.send('VKWebAppGetUserInfo');
    })
    .then((user) => {
      window.vkUser = user;
      console.log('VK user:', user.first_name);
    })
    .catch((err) => {
      console.warn('VK Bridge error:', err);
    });
}

initVK();

// ============================================
// Phaser config
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

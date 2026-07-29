// Main Phaser configuration

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 720,
  height: 1280,
  backgroundColor: '#0a0a12',
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

// Global game state
window.gameData = {
  currentLevel: 0,
  totalLevels: LEVELS.length,
  stars: 0,
  moves: 0
};

// Optional VK Bridge init (uncomment + add script in index.html when publishing)
/*
if (typeof vkBridge !== 'undefined') {
  vkBridge.send('VKWebAppInit');
  vkBridge.send('VKWebAppSetViewSettings', {
    status_bar_style: 'light',
    action_bar_color: '#0a0a12'
  });
}
*/

const game = new Phaser.Game(config);

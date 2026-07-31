class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  create() {
    const { width, height } = this.scale;
    const stars = window.gameData.stars || 1;
    const level = window.gameData.currentLevel + 1;
    const mistakes = window.gameData.mistakes || 0;
    const levelIndex = window.gameData.currentLevel;

    // Сохраняем: открыть следующий + лучшие звёзды за этот уровень
    const nextLevel = levelIndex + 1;
    if (window.saveProgress) {
      try {
        window.saveProgress(nextLevel, levelIndex, stars);
      } catch (e) {}
    }

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.06);
    glow.fillCircle(width / 2, height * 0.28, 180);

    const phrases = ['ПРЕВОСХОДНО!', 'ОТЛИЧНО!', 'СУПЕР!'];
    const phrase = stars >= 3 ? phrases[0] : stars === 2 ? phrases[1] : phrases[2];

    const title = this.add.text(width / 2, height * 0.2, phrase, {
      fontFamily: 'Arial Black',
      fontSize: '44px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: { from: 0.85, to: 1 },
      duration: 280,
      ease: 'Back.easeOut'
    });

    this.add.text(width / 2, height * 0.3, `Уровень ${level} пройден`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    const starY = height * 0.42;
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(width / 2 + (i - 1) * 68, starY, '★', {
        fontSize: '56px',
        color: i < stars ? '#ffd166' : '#2a2a40'
      }).setOrigin(0.5).setScale(0.5).setAlpha(0);

      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: 1,
        duration: 200,
        delay: 120 + i * 90,
        ease: 'Back.easeOut'
      });
    }

    this.add.text(width / 2, height * 0.54, `Ошибок: ${mistakes}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: mistakes === 0 ? '#2ec4b6' : '#ff6b6b'
    }).setOrigin(0.5);

    const isLast = levelIndex >= LEVELS.length - 1;

    if (!isLast) {
      this.createButton(width / 2, height * 0.66, 'ДАЛЬШЕ →', 0x00e8c8, () => {
        window.gameData.currentLevel++;
        this.scene.start('Game');
      });
    }

    this.createButton(width / 2, height * 0.78, 'УРОВНИ', 0x2a2a45, () => {
      this.scene.start('LevelsMap');
    });

    this.createButton(width / 2, height * 0.9, 'МЕНЮ', 0x222238, () => {
      this.scene.start('Menu');
    });

    this.playWinMelody();
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 30);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(240, 60);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.94,
        duration: 60,
        yoyo: true,
        onComplete: callback
      });
    });

    return btn;
  }

  playWinMelody() {
    const ctx = window.gameAudioCtx;
    if (!ctx) return;

    const play = () => {
      [523, 659, 784, 1046].forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.1;
          osc.connect(gain);
          gain.connect(ctx.destination);
          const t = ctx.currentTime + i * 0.11;
          osc.start(t);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.stop(t + 0.3);
        } catch (e) {}
      });
    };

    if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {});
    else play();
  }
}

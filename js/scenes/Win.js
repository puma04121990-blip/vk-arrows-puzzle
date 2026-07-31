class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  create() {
    const { width, height } = this.scale;
    const stars = window.gameData.stars || 1;
    const level = window.gameData.currentLevel + 1;
    const mistakes = window.gameData.mistakes || 0;

    const nextLevel = window.gameData.currentLevel + 1;
    if (window.saveProgress) {
      try {
        window.saveProgress(nextLevel);
      } catch (e) {}
    }

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.06);
    glow.fillCircle(width / 2, height * 0.28, 180);

    const phrases = ['ПРЕВОСХОДНО!', 'ОТЛИЧНО!', 'ФАНТАСТИКА!', 'СУПЕР!', 'БЛЕСТЯЩЕ!'];
    // phrase by stars: 3->best, 1->ok
    const phraseIndex = stars >= 3 ? 0 : stars === 2 ? 1 : 3;
    const phrase = phrases[phraseIndex];

    const title = this.add.text(width / 2, height * 0.22, phrase, {
      fontFamily: 'Arial Black',
      fontSize: '46px',
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

    this.add.text(width / 2, height * 0.32, `Уровень ${level} пройден`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    // Stars
    const starY = height * 0.44;
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

    this.add.text(width / 2, height * 0.56, `Ошибок: ${mistakes}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: mistakes === 0 ? '#2ec4b6' : '#ff6b6b'
    }).setOrigin(0.5);

    // Hint under mistakes
    let hint = 'Идеально!';
    if (mistakes === 0) hint = 'Без ошибок — 3 звезды';
    else if (mistakes <= 3) hint = '1–3 ошибки — 2 звезды';
    else hint = '4+ ошибок — 1 звезда';

    this.add.text(width / 2, height * 0.61, hint, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5a5a72'
    }).setOrigin(0.5);

    const isLast = window.gameData.currentLevel >= LEVELS.length - 1;

    if (!isLast) {
      this.createButton(width / 2, height * 0.72, 'ДАЛЬШЕ →', 0x00e8c8, () => {
        window.gameData.currentLevel++;
        this.scene.start('Game');
      });
    }

    this.createButton(width / 2, height * 0.84, isLast ? 'В МЕНЮ' : 'МЕНЮ', 0x222238, () => {
      this.scene.start('Menu');
    });

    this.playWinMelody();
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-120, -32, 240, 64, 32);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '26px',
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(240, 64);
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
      const notes = [523, 659, 784, 1046];
      notes.forEach((freq, i) => {
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

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  }
}

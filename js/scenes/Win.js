class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  create() {
    const { width, height } = this.scale;
    const stars = window.gameData.stars || 3;
    const level = window.gameData.currentLevel + 1;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0a0a12).setOrigin(0);

    // Confetti-like particles
    this.add.particles(width / 2, -20, 'particle', {
      speed: { min: 100, max: 300 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.5, end: 0 },
      lifespan: 2500,
      quantity: 2,
      frequency: 40,
      tint: [0x00f5d4, 0xff6b6b, 0xfeca57, 0x48dbfb, 0xff9ff3],
      blendMode: 'ADD'
    });

    // Big title
    const phrases = ['ПРЕВОСХОДНО!', 'ОТЛИЧНО!', 'ФАНТАСТИКА!', 'СУПЕР!', 'БЛЕСТЯЩЕ!'];
    const phrase = phrases[Math.min(stars, phrases.length - 1)];

    this.add.text(width / 2, height * 0.25, phrase, {
      fontFamily: 'Arial Black',
      fontSize: '52px',
      color: '#00f5d4',
      align: 'center',
      stroke: '#0a0a12',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f5d4', blur: 25, fill: true }
    }).setOrigin(0.5);

    // Level complete
    this.add.text(width / 2, height * 0.35, `Уровень ${level} пройден`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#c0c0e0'
    }).setOrigin(0.5);

    // Stars
    const starY = height * 0.48;
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(width / 2 + (i - 1) * 70, starY, '★', {
        fontSize: '64px',
        color: i < stars ? '#feca57' : '#2a2a4a'
      }).setOrigin(0.5);

      if (i < stars) {
        this.tweens.add({
          targets: star,
          scale: 1.3,
          duration: 200,
          yoyo: true,
          delay: i * 120,
          ease: 'Back.easeOut'
        });
      }
    }

    // Moves
    this.add.text(width / 2, height * 0.58, `Ходов: ${window.gameData.moves}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#8080a0'
    }).setOrigin(0.5);

    // Next / Restart buttons
    const isLast = window.gameData.currentLevel >= LEVELS.length - 1;

    if (!isLast) {
      const nextBtn = this.createButton(width / 2, height * 0.72, 'ДАЛЬШЕ →', 0x00f5d4, () => {
        window.gameData.currentLevel++;
        this.scene.start('Game');
      });
    }

    const menuBtn = this.createButton(width / 2, height * 0.84, isLast ? 'В МЕНЮ' : 'МЕНЮ', 0x2a2a4a, () => {
      this.scene.start('Menu');
    });

    // Play win sound
    this.playWinMelody();
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-130, -36, 260, 72, 36);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: color === 0x00f5d4 ? '#0a0a12' : '#e0e0ff'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(260, 72);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', callback);

    return btn;
  }

  playWinMelody() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1046];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.12;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } catch (e) {}
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.045);
    glow.fillCircle(width / 2, height * 0.26, 200);

    // Title
    this.add.text(width / 2, height * 0.16, 'ARROW PULSE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#00e8c8',
      align: 'center',
      stroke: '#0b0b14',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#00e8c8', blur: 16, fill: true }
    }).setOrigin(0.5);

    // Greeting
    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = `Привет, ${window.vkUser.first_name}!`;
    }

    this.add.text(width / 2, height * 0.24, greeting, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    // Rules
    const rulesY = height * 0.32;
    this.add.text(width / 2, rulesY, 'КАК ИГРАТЬ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    const rules = [
      '• Тапай по стрелке, чтобы убрать её',
      '• Стрелка улетает, если путь свободен',
      '• Убери все стрелки с поля',
      '• Чем меньше ходов — тем выше оценка'
    ];

    rules.forEach((line, i) => {
      this.add.text(width / 2, rulesY + 34 + i * 26, line, {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#9a9ab4'
      }).setOrigin(0.5);
    });

    // Progress info
    const maxLevel = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const hasProgress = maxLevel > 0;

    if (hasProgress) {
      this.add.text(width / 2, height * 0.58, `Прогресс: уровень ${maxLevel + 1}`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#6a6a82'
      }).setOrigin(0.5);
    }

    // Buttons
    const btnY = hasProgress ? height * 0.66 : height * 0.68;

    // Основная кнопка
    if (hasProgress) {
      // Продолжить
      this.createButton(width / 2, btnY, 'ПРОДОЛЖИТЬ', 0x00e8c8, () => {
        window.gameData.currentLevel = Math.min(maxLevel, LEVELS.length - 1);
        this.scene.start('Game');
      });

      // Сначала
      this.createButton(width / 2, btnY + 90, 'СНАЧАЛА', 0x222238, () => {
        window.gameData.currentLevel = 0;
        this.scene.start('Game');
      }, true);
    } else {
      this.createButton(width / 2, btnY, 'ИГРАТЬ', 0x00e8c8, () => {
        window.gameData.currentLevel = 0;
        this.scene.start('Game');
      });
    }

    this.add.text(width / 2, height * 0.9, `${LEVELS.length} уровней`, {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#505068'
    }).setOrigin(0.5);

    this.createDecorArrows();
  }

  createButton(x, y, label, color, callback, secondary = false) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-140, -36, 280, 72, 36);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: secondary ? '26px' : '32px',
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(280, 72);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.94,
        duration: 70,
        yoyo: true,
        onComplete: callback
      });
    });

    return btn;
  }

  createDecorArrows() {
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0, 0xf72585];
    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(30, 690);
      const y = Phaser.Math.Between(30, 1250);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const arrow = this.add.graphics();
      this.drawMiniArrow(arrow, Phaser.Math.Between(0, 3), color);
      arrow.setPosition(x, y);
      arrow.setAlpha(0.1);

      this.tweens.add({
        targets: arrow,
        y: y + Phaser.Math.Between(-25, 25),
        duration: Phaser.Math.Between(2800, 4800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  drawMiniArrow(g, dir, color) {
    g.fillStyle(color, 1);
    const s = 14;
    if (dir === 0) {
      g.fillTriangle(0, -s, -s * 0.55, s * 0.25, s * 0.55, s * 0.25);
      g.fillRect(-3, 0, 6, s * 0.6);
    } else if (dir === 1) {
      g.fillTriangle(s, 0, -s * 0.25, -s * 0.55, -s * 0.25, s * 0.55);
      g.fillRect(-s * 0.6, -3, s * 0.6, 6);
    } else if (dir === 2) {
      g.fillTriangle(0, s, -s * 0.55, -s * 0.25, s * 0.55, -s * 0.25);
      g.fillRect(-3, -s * 0.6, 6, s * 0.6);
    } else {
      g.fillTriangle(-s, 0, s * 0.25, -s * 0.55, s * 0.25, s * 0.55);
      g.fillRect(0, -3, s * 0.6, 6);
    }
  }
}

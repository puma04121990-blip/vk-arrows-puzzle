class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Soft glow
    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.045);
    glow.fillCircle(width / 2, height * 0.28, 200);

    // Title
    this.add.text(width / 2, height * 0.18, 'ARROW PULSE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#00e8c8',
      align: 'center',
      stroke: '#0b0b14',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#00e8c8', blur: 16, fill: true }
    }).setOrigin(0.5);

    // Greeting (VK user if available)
    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = `Привет, ${window.vkUser.first_name}!`;
    }

    this.add.text(width / 2, height * 0.27, greeting, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    // ===== How to play (важно для модерации VK) =====
    const rulesY = height * 0.36;

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
      this.add.text(width / 2, rulesY + 36 + i * 28, line, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#9a9ab4'
      }).setOrigin(0.5);
    });

    // Play button
    const btnY = height * 0.68;
    const btn = this.add.container(width / 2, btnY);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00e8c8, 1);
    btnBg.fillRoundedRect(-140, -38, 280, 76, 38);

    const btnText = this.add.text(0, 0, 'ИГРАТЬ', {
      fontFamily: 'Arial Black',
      fontSize: '34px',
      color: '#0b0b14'
    }).setOrigin(0.5);

    btn.add([btnBg, btnText]);
    btn.setSize(280, 76);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.94,
        duration: 70,
        yoyo: true,
        onComplete: () => {
          window.gameData.currentLevel = 0;
          this.scene.start('Game');
        }
      });
    });

    // Levels info
    this.add.text(width / 2, height * 0.8, `${LEVELS.length} уровней`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#555570'
    }).setOrigin(0.5);

    // Small decorative arrows (не мешают)
    this.createDecorArrows();
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

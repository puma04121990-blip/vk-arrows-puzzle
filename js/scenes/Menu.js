class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    // Background glow
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x12122a, 0x12122a, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, height * 0.28, 'ARROW\nPULSE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '72px',
      color: '#00f5d4',
      align: 'center',
      stroke: '#0a0a12',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f5d4', blur: 20, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.42, 'Убери все стрелки', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#a0a0c0'
    }).setOrigin(0.5);

    // Play button
    const btn = this.add.container(width / 2, height * 0.58);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00f5d4, 1);
    btnBg.fillRoundedRect(-140, -40, 280, 80, 40);
    btnBg.lineStyle(4, 0xffffff, 0.3);
    btnBg.strokeRoundedRect(-140, -40, 280, 80, 40);

    const btnText = this.add.text(0, 0, 'ИГРАТЬ', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#0a0a12'
    }).setOrigin(0.5);

    btn.add([btnBg, btnText]);
    btn.setSize(280, 80);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.92,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          window.gameData.currentLevel = 0;
          this.scene.start('Game');
        }
      });
    });

    // Level select hint
    this.add.text(width / 2, height * 0.72, `Уровней: ${LEVELS.length}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#606080'
    }).setOrigin(0.5);

    // Decorative floating arrows
    this.createDecorArrows();
  }

  createDecorArrows() {
    const colors = [0x00f5d4, 0xff6b6b, 0xfeca57, 0x48dbfb, 0xff9ff3];
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 670);
      const y = Phaser.Math.Between(50, 1230);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const arrow = this.add.graphics();
      this.drawMiniArrow(arrow, 0, 0, Phaser.Math.Between(0, 3), color);
      arrow.setPosition(x, y);
      arrow.setAlpha(0.15);

      this.tweens.add({
        targets: arrow,
        y: y + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  drawMiniArrow(g, x, y, dir, color) {
    g.fillStyle(color, 1);
    const s = 18;
    if (dir === 0) { // up
      g.fillTriangle(x, y - s, x - s * 0.6, y + s * 0.3, x + s * 0.6, y + s * 0.3);
      g.fillRect(x - 4, y, 8, s * 0.7);
    } else if (dir === 1) { // right
      g.fillTriangle(x + s, y, x - s * 0.3, y - s * 0.6, x - s * 0.3, y + s * 0.6);
      g.fillRect(x - s * 0.7, y - 4, s * 0.7, 8);
    } else if (dir === 2) { // down
      g.fillTriangle(x, y + s, x - s * 0.6, y - s * 0.3, x + s * 0.6, y - s * 0.3);
      g.fillRect(x - 4, y - s * 0.7, 8, s * 0.7);
    } else { // left
      g.fillTriangle(x - s, y, x + s * 0.3, y - s * 0.6, x + s * 0.3, y + s * 0.6);
      g.fillRect(x, y - 4, s * 0.7, 8);
    }
  }
}

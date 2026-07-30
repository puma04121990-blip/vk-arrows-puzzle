class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Soft center glow
    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.04);
    glow.fillCircle(width / 2, height * 0.35, 220);

    // Title
    this.add.text(width / 2, height * 0.26, 'ARROW\nPULSE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '68px',
      color: '#00e8c8',
      align: 'center',
      stroke: '#0b0b14',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#00e8c8', blur: 18, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.42, 'Убери все стрелки', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#7a7a98'
    }).setOrigin(0.5);

    // Play button
    const btn = this.add.container(width / 2, height * 0.56);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00e8c8, 1);
    btnBg.fillRoundedRect(-130, -36, 260, 72, 36);

    const btnText = this.add.text(0, 0, 'ИГРАТЬ', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#0b0b14'
    }).setOrigin(0.5);

    btn.add([btnBg, btnText]);
    btn.setSize(260, 72);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.93,
        duration: 70,
        yoyo: true,
        onComplete: () => {
          window.gameData.currentLevel = 0;
          this.scene.start('Game');
        }
      });
    });

    // Levels count
    this.add.text(width / 2, height * 0.7, `${LEVELS.length} уровней`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#505068'
    }).setOrigin(0.5);

    this.createDecorArrows();
  }

  createDecorArrows() {
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0, 0xf72585];
    for (let i = 0; i < 7; i++) {
      const x = Phaser.Math.Between(40, 680);
      const y = Phaser.Math.Between(40, 1240);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const arrow = this.add.graphics();
      this.drawMiniArrow(arrow, Phaser.Math.Between(0, 3), color);
      arrow.setPosition(x, y);
      arrow.setAlpha(0.12);

      this.tweens.add({
        targets: arrow,
        y: y + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(2500, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  drawMiniArrow(g, dir, color) {
    g.fillStyle(color, 1);
    const s = 16;
    if (dir === 0) {
      g.fillTriangle(0, -s, -s * 0.55, s * 0.25, s * 0.55, s * 0.25);
      g.fillRect(-3.5, 0, 7, s * 0.65);
    } else if (dir === 1) {
      g.fillTriangle(s, 0, -s * 0.25, -s * 0.55, -s * 0.25, s * 0.55);
      g.fillRect(-s * 0.65, -3.5, s * 0.65, 7);
    } else if (dir === 2) {
      g.fillTriangle(0, s, -s * 0.55, -s * 0.25, s * 0.55, -s * 0.25);
      g.fillRect(-3.5, -s * 0.65, 7, s * 0.65);
    } else {
      g.fillTriangle(-s, 0, s * 0.25, -s * 0.55, s * 0.25, s * 0.55);
      g.fillRect(0, -3.5, s * 0.65, 7);
    }
  }
}

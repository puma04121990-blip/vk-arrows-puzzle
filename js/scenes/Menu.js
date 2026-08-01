class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.045);
    glow.fillCircle(width / 2, height * (wide ? 0.22 : 0.18), wide ? 120 : 150);

    this.add.text(width / 2, height * (wide ? 0.1 : 0.12), 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '42px' : '36px',
      color: '#00e8c8',
      align: 'center',
      stroke: '#0b0b14',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#00e8c8', blur: 16, fill: true }
    }).setOrigin(0.5);

    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = `Привет, ${window.vkUser.first_name}!`;
    }

    this.add.text(width / 2, height * (wide ? 0.2 : 0.19), greeting, {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    const maxLevel = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const hasProgress = maxLevel > 0;

    // На ПК кнопки компактнее по вертикали
    const step = wide ? 58 : 72;
    let y = height * (wide ? 0.32 : 0.32);

    if (hasProgress) {
      this.add.text(width / 2, y, `Прогресс: уровень ${maxLevel + 1}`, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#6a6a82'
      }).setOrigin(0.5);
      y += wide ? 32 : 40;

      this.createButton(width / 2, y, 'ПРОДОЛЖИТЬ', 0x00e8c8, () => {
        window.gameData.currentLevel = Math.min(maxLevel, LEVELS.length - 1);
        this.scene.start('Game');
      }, false, wide);
      y += step;
    } else {
      this.createButton(width / 2, y, 'ИГРАТЬ', 0x00e8c8, () => {
        window.gameData.currentLevel = 0;
        this.scene.start('Game');
      }, false, wide);
      y += step;
    }

    this.createButton(width / 2, y, 'УРОВНИ', 0x222238, () => {
      this.scene.start('LevelsMap');
    }, true, wide);
    y += step;

    this.createButton(width / 2, y, 'СТИЛИ', 0x222238, () => {
      this.scene.start('Skins');
    }, true, wide);
    y += step;

    this.createButton(width / 2, y, 'ДОСТИЖЕНИЯ', 0x222238, () => {
      this.scene.start('Achievements');
    }, true, wide);

    this.add.text(width / 2, height * 0.94, `${LEVELS.length} уровней`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#505068'
    }).setOrigin(0.5);

    this.createDecorArrows(width, height);
  }

  createButton(x, y, label, color, callback, secondary = false, wide = false) {
    const btn = this.add.container(x, y);
    const bw = wide ? 300 : 280;
    const bh = wide ? 48 : 56;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: secondary ? (wide ? '18px' : '20px') : (wide ? '22px' : '26px'),
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(bw, bh);
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

  createDecorArrows(width, height) {
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0, 0xf72585];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(40, Math.max(80, width - 40));
      const y = Phaser.Math.Between(40, Math.max(80, height - 40));
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

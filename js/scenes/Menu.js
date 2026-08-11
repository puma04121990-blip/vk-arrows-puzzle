class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Title zone — crisp text, no shadow/blur (moderation: «избыточное размытие»)
    const titleY = wide ? 40 : Math.max(48, Math.round(height * 0.06));
    this.add.text(width / 2, titleY, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: wide ? '32px' : '28px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5);

    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = `Привет, ${window.vkUser.first_name}!`;
    }

    const greetY = titleY + (wide ? 32 : 36);
    this.add.text(width / 2, greetY, greeting, {
      fontFamily: 'Arial',
      fontSize: wide ? '14px' : '15px',
      color: '#8a8aa8',
      wordWrap: { width: width - 48 }
    }).setOrigin(0.5);

    const maxLevel = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const hasProgress = maxLevel > 0;

    // Bottom footer reserved so buttons never cover it
    const footerH = wide ? 36 : 44;
    const footerY = height - footerH / 2 - 4;

    this.add.text(width / 2, footerY, 'Играя, вы принимаете соглашение и политику', {
      fontFamily: 'Arial',
      fontSize: wide ? '11px' : '12px',
      color: '#404058',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5);

    // Build button list first, then place with even spacing in free zone
    const buttons = [];
    if (hasProgress) {
      buttons.push({
        label: 'ПРОДОЛЖИТЬ',
        color: 0x00e8c8,
        secondary: false,
        cb: () => {
          window.gameData.currentLevel = Math.min(maxLevel, LEVELS.length - 1);
          this.scene.start('Game');
        }
      });
    } else {
      buttons.push({
        label: 'ИГРАТЬ',
        color: 0x00e8c8,
        secondary: false,
        cb: () => {
          window.gameData.currentLevel = 0;
          this.scene.start('Game');
        }
      });
    }

    buttons.push(
      { label: 'УРОВНИ', color: 0x222238, secondary: true, cb: () => this.scene.start('LevelsMap') },
      { label: 'СТИЛИ', color: 0x222238, secondary: true, cb: () => this.scene.start('Skins') },
      { label: 'ДОСТИЖЕНИЯ', color: 0x222238, secondary: true, cb: () => this.scene.start('Achievements') },
      { label: 'КАК ИГРАТЬ', color: 0x222238, secondary: true, cb: () => this.scene.start('Help') },
      { label: 'ПРАВОВАЯ', color: 0x1a1a28, secondary: true, cb: () => this.scene.start('Legal') }
    );

    const zoneTop = greetY + (wide ? 32 : 40);
    const zoneBottom = footerY - footerH / 2 - 12;
    const bh = wide ? 40 : 46;
    const n = buttons.length;
    const progressLine = hasProgress ? (wide ? 24 : 28) : 0;
    const freeH = Math.max(0, zoneBottom - zoneTop - progressLine);
    // Fixed min gap so buttons never overlap each other or labels
    const minStep = bh + (wide ? 8 : 10);
    const step = Math.max(minStep, Math.min(wide ? 54 : 60, freeH / n));
    const totalH = step * (n - 1);
    let y = zoneTop + progressLine + Math.max(0, (freeH - totalH) / 2);

    if (hasProgress) {
      this.add.text(width / 2, zoneTop + 2, `Прогресс: уровень ${maxLevel + 1}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#6a6a82'
      }).setOrigin(0.5);
    }

    buttons.forEach((b) => {
      this.createButton(width / 2, Math.round(y), b.label, b.color, b.cb, b.secondary, wide, bh);
      y += step;
    });
  }

  createButton(x, y, label, color, callback, secondary = false, wide = false, bh = 48) {
    const btn = this.add.container(x, y);
    // Wider so «ПРОДОЛЖИТЬ» fits without aggressive shrink
    const bw = wide ? 320 : 300;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: secondary ? (wide ? '15px' : '16px') : (wide ? '18px' : '20px'),
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);

    // Full label: scale down only if needed (no "…")
    const maxTextW = bw - 36;
    if (text.width > maxTextW) {
      text.setScale(maxTextW / text.width);
    }

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

}

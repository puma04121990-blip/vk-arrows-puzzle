class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Sound toggle (top-right) — VK rule: quick mute
    if (window.createSoundToggle) {
      window.createSoundToggle(this, width - (wide ? 36 : 40), wide ? 28 : 36, {
        size: wide ? 40 : 44,
        fontSize: wide ? '20px' : '22px',
        depth: 80
      });
    }

    // Title
    const titleY = wide ? 64 : Math.max(100, Math.round(height * 0.12));
    this.add.text(width / 2, titleY, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '34px' : '30px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle — red rectangle: right under the title (not inside the circle)
    const greetY = titleY + (wide ? 36 : 42);
    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = `Привет, ${window.vkUser.first_name}!`;
    }
    this.add.text(width / 2, greetY, greeting, {
      fontFamily: 'Arial',
      fontSize: wide ? '15px' : '16px',
      color: '#8a8aa8',
      align: 'center',
      wordWrap: { width: width - 48 }
    }).setOrigin(0.5);

    // Circle — red circle: lower, between subtitle and buttons
    const circleR = wide ? 80 : 92;
    const circleY = greetY + circleR + (wide ? 40 : 52);

    const circle = this.add.graphics();
    circle.fillStyle(0x12121e, 1);
    circle.fillCircle(width / 2, circleY, circleR);
    circle.lineStyle(1, 0x2a2a40, 1);
    circle.strokeCircle(width / 2, circleY, circleR);

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
      {
        label: 'ПОДДЕРЖКА',
        color: 0x1e2a38,
        secondary: true,
        cb: () => {
          if (window.openSupportCommunity) window.openSupportCommunity();
          else if (window.APP_SUPPORT && window.APP_SUPPORT.communityUrl) {
            try { window.open(window.APP_SUPPORT.communityUrl, '_blank'); } catch (e) {}
          }
        }
      },
      { label: 'ПРАВОВАЯ', color: 0x1a1a28, secondary: true, cb: () => this.scene.start('Legal') }
    );

    // Buttons start below the lowered circle
    const zoneTop = circleY + circleR + (wide ? 20 : 28);
    const zoneBottom = footerY - footerH / 2 - 10;
    const bh = wide ? 42 : 48;
    const n = buttons.length;
    const progressLine = hasProgress ? (wide ? 22 : 26) : 0;
    const freeH = Math.max(0, zoneBottom - zoneTop - progressLine);
    const step = Math.min(wide ? 52 : 58, freeH / n);
    const totalH = step * (n - 1);
    let y = zoneTop + progressLine + (freeH - totalH) / 2;

    if (hasProgress) {
      this.add.text(width / 2, zoneTop + 4, `Прогресс: уровень ${maxLevel + 1}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#6a6a82'
      }).setOrigin(0.5);
    }

    buttons.forEach((b) => {
      this.createButton(width / 2, y, b.label, b.color, b.cb, b.secondary, wide, bh);
      y += step;
    });

    this.createDecorArrows(width, height);
  }

  createButton(x, y, label, color, callback, secondary = false, wide = false, bh = 48) {
    const btn = this.add.container(x, y);
    const bw = wide ? 300 : 280;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: secondary ? (wide ? '15px' : '16px') : (wide ? '18px' : '20px'),
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);

    // Guard: shrink label if wider than button
    const maxTextW = bw - 28;
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

  createDecorArrows(width, height) {
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0, 0xf72585];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(40, Math.max(80, width - 40));
      const y = Phaser.Math.Between(40, Math.max(80, height - 40));
      const color = Phaser.Utils.Array.GetRandom(colors);
      const arrow = this.add.graphics();
      this.drawMiniArrow(arrow, Phaser.Math.Between(0, 3), color);
      arrow.setPosition(x, y);
      arrow.setAlpha(0.08);
      arrow.setDepth(-1);

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

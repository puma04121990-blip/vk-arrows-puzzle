class SkinsScene extends Phaser.Scene {
  constructor() {
    super('Skins');
  }

  create() {
    const { width, height } = this.scale;
    this.skins = window.ARROW_SKINS || [];
    this.selectedId = (window.gameProgress && window.gameProgress.skin) || 'neon';
    this.cards = [];

    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b14);

    this.add.text(width / 2, 44, 'СКИНЫ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 82, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);
    this.updateStatus();

    const cardW = 620;
    const cardH = 96;
    const gap = 12;
    const startY = 130;

    this.skins.forEach((skin, i) => {
      const y = startY + i * (cardH + gap);
      this.cards.push(this.makeCard(width / 2, y, cardW, cardH, skin));
    });

    this.paintAll();

    // Кнопка МЕНЮ — простой прямоугольник
    const btnY = height - 56;
    const menuBtn = this.add.rectangle(width / 2, btnY, 220, 56, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, btnY, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerdown', () => menuBtn.setFillStyle(0x00e8c8));
    menuBtn.on('pointerup', () => {
      menuBtn.setFillStyle(0x1a1a28);
      this.scene.start('Menu');
    });
  }

  makeCard(x, y, w, h, skin) {
    // Фон карточки
    const bg = this.add.rectangle(x, y, w, h, 0x161622)
      .setStrokeStyle(2, 0x2a2a40)
      .setInteractive({ useHandCursor: true });

    // Превью стрелок
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0];
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      if (window.drawArrowSkin) {
        window.drawArrowSkin(g, i, colors[i], 46, skin.id);
      }
      g.setPosition(x - w / 2 + 48 + i * 40, y);
      g.setScale(0.88);
    }

    const title = this.add.text(x - 30, y - 16, `${skin.icon}  ${skin.name}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#c8c8e0'
    }).setOrigin(0, 0.5);

    const desc = this.add.text(x - 30, y + 16, skin.desc, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6a6a82'
    }).setOrigin(0, 0.5);

    const check = this.add.text(x + w / 2 - 36, y, '✓', {
      fontSize: '28px',
      color: '#00e8c8'
    }).setOrigin(0.5).setAlpha(0);

    const card = { skin, bg, title, desc, check, x, y, w, h };

    bg.on('pointerover', () => {
      if (skin.id !== this.selectedId) bg.setFillStyle(0x1c1c2c);
    });
    bg.on('pointerout', () => {
      this.paintCard(card);
    });
    bg.on('pointerdown', () => {
      bg.setScale(0.98);
    });
    bg.on('pointerup', () => {
      bg.setScale(1);
      this.choose(skin.id);
    });
    bg.on('pointerupoutside', () => {
      bg.setScale(1);
    });

    return card;
  }

  paintCard(card) {
    const on = card.skin.id === this.selectedId;
    if (on) {
      card.bg.setFillStyle(0x0f2e2a);
      card.bg.setStrokeStyle(3, 0x00e8c8);
      card.title.setColor('#ffffff');
      card.desc.setColor('#9a9ab4');
      card.check.setAlpha(1);
    } else {
      card.bg.setFillStyle(0x161622);
      card.bg.setStrokeStyle(2, 0x2a2a40);
      card.title.setColor('#c8c8e0');
      card.desc.setColor('#6a6a82');
      card.check.setAlpha(0);
    }
  }

  paintAll() {
    this.cards.forEach(c => this.paintCard(c));
  }

  updateStatus() {
    const skin = this.skins.find(s => s.id === this.selectedId);
    this.statusText.setText('Выбрано: ' + (skin ? skin.name : 'Неон'));
  }

  choose(id) {
    if (!id) return;

    // Сохраняем всегда
    if (!window.gameProgress) window.gameProgress = {};
    window.gameProgress.skin = id;
    this.selectedId = id;

    try {
      if (typeof window.setSelectedSkin === 'function') {
        window.setSelectedSkin(id);
      } else if (typeof window.persistProgress === 'function') {
        window.persistProgress();
      } else {
        localStorage.setItem('arrow_pulse_progress_v3', JSON.stringify(window.gameProgress));
      }
    } catch (e) {}

    this.paintAll();
    this.updateStatus();

    // Pulse
    const card = this.cards.find(c => c.skin.id === id);
    if (card) {
      this.tweens.add({
        targets: card.bg,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 80,
        yoyo: true
      });
      this.tweens.add({
        targets: card.check,
        scale: { from: 0.5, to: 1 },
        duration: 150,
        ease: 'Back.easeOut'
      });
    }
  }
}

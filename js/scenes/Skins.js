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

    const wide = width >= height;
    const headerH = wide ? 68 : 90;
    const footerH = wide ? 56 : 72;

    // Fixed header
    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1).setDepth(50);
    this.add.text(width / 2, wide ? 20 : 28, 'СТИЛИ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '24px' : '30px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.statusText = this.add.text(width / 2, wide ? 48 : 64, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#8a8aa8'
    }).setOrigin(0.5).setDepth(51);
    this.updateStatus();

    // Fixed footer
    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 1).setDepth(50);
    const menuBtn = this.add.rectangle(width / 2, height - footerH / 2, 200, wide ? 40 : 48, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
      .setInteractive({ useHandCursor: true })
      .setDepth(51);
    this.add.text(width / 2, height - footerH / 2, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '19px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(52);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => this.scene.start('Menu'));

    const cols = wide ? 2 : 1;
    const cardW = wide ? Math.min(540, (width - 60) / 2) : Math.min(620, width - 48);
    const cardH = wide ? 74 : 88;
    const gapX = 16;
    const gapY = wide ? 10 : 12;
    const startY = headerH + cardH / 2 + 8;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (width - totalW) / 2 + cardW / 2;

    this.cardsContainer = this.add.container(0, 0);

    this.skins.forEach((skin, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.cards.push(this.makeCard(x, y, cardW, cardH, skin, wide));
    });

    this.paintAll();

    // Scroll if cards exceed footer
    const rows = Math.ceil(this.skins.length / cols);
    const contentBottom = startY + (rows - 1) * (cardH + gapY) + cardH / 2 + 12;
    this.setupScroll(contentBottom, height, headerH, footerH);
  }

  makeCard(x, y, w, h, skin, wide) {
    const bg = this.add.rectangle(x, y, w, h, 0x161622)
      .setStrokeStyle(2, 0x2a2a40)
      .setInteractive({ useHandCursor: true });
    this.cardsContainer.add(bg);

    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0];
    const previewScale = wide ? 0.65 : 0.8;
    const previewStart = x - w / 2 + (wide ? 32 : 44);
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      if (window.drawArrowSkin) {
        window.drawArrowSkin(g, i, colors[i], wide ? 34 : 42, skin.id);
      }
      g.setPosition(previewStart + i * (wide ? 28 : 36), y);
      g.setScale(previewScale);
      this.cardsContainer.add(g);
    }

    const textX = x - w / 2 + (wide ? 150 : 180);
    const maxTextW = w - (wide ? 200 : 230);

    const title = this.add.text(textX, y - (wide ? 12 : 14), `${skin.icon}  ${skin.name}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '15px' : '18px',
      color: '#c8c8e0',
      wordWrap: { width: maxTextW }
    }).setOrigin(0, 0.5);
    this.cardsContainer.add(title);

    const desc = this.add.text(textX, y + (wide ? 12 : 14), skin.desc || '', {
      fontFamily: 'Arial',
      fontSize: wide ? '11px' : '13px',
      color: '#6a6a82',
      wordWrap: { width: maxTextW }
    }).setOrigin(0, 0.5);
    this.cardsContainer.add(desc);

    const check = this.add.text(x + w / 2 - 24, y, '✓', {
      fontSize: wide ? '20px' : '26px',
      color: '#00e8c8'
    }).setOrigin(0.5).setAlpha(0);
    this.cardsContainer.add(check);

    const card = { skin, bg, title, desc, check, x, y, w, h };

    bg.on('pointerover', () => {
      if (skin.id !== this.selectedId) bg.setFillStyle(0x1c1c2c);
    });
    bg.on('pointerout', () => this.paintCard(card));
    bg.on('pointerdown', () => bg.setScale(0.98));
    bg.on('pointerup', () => {
      bg.setScale(1);
      this.choose(skin.id);
    });
    bg.on('pointerupoutside', () => bg.setScale(1));

    return card;
  }

  setupScroll(contentBottom, height, headerH, footerH) {
    const maxScroll = Math.max(0, contentBottom - (height - footerH));
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    this.input.on('pointerdown', (p) => { dragging = true; lastY = p.y; });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('pointermove', (p) => {
      if (!dragging || maxScroll <= 0) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.cardsContainer.y = this.scrollY;
    });
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

    if (!window.gameProgress) window.gameProgress = {};
    window.gameProgress.skin = id;
    this.selectedId = id;

    try {
      if (typeof window.setSelectedSkin === 'function') {
        window.setSelectedSkin(id);
      } else if (typeof window.persistProgress === 'function') {
        window.persistProgress();
      }
    } catch (e) {}

    this.paintAll();
    this.updateStatus();

    const card = this.cards.find(c => c.skin.id === id);
    if (card) {
      this.tweens.add({
        targets: card.bg,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 80,
        yoyo: true
      });
    }
  }
}

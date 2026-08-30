class SkinsScene extends Phaser.Scene {
  constructor() {
    super('Skins');
  }

  create() {
    const { width, height } = this.scale;
    this.skins = window.ARROW_SKINS || [];
    this.selectedId = (window.gameProgress && window.gameProgress.skin) || 'neon';
    if (window.isSkinUnlocked && !window.isSkinUnlocked(this.selectedId)) {
      this.selectedId = 'neon';
    }
    this.cards = [];
    this.busy = false;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b14);

    const wide = width >= height;
    const chrome = window.pulseChrome ? window.pulseChrome(this) : { headerH: wide ? 68 : 90, footerH: wide ? 92 : 108, btnY: height - 50 };
    const headerH = chrome.headerH;
    const footerH = chrome.footerH;

    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1).setDepth(50);
    this.add.text(width / 2, wide ? 20 : 28, 'СТИЛИ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '24px' : '30px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.statusText = this.add.text(width / 2, wide ? 48 : 64, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#8a8aa8',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5).setDepth(51);
    this.updateStatus();

    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 1).setDepth(50);
    if (window.pulseBackButton) {
      window.pulseBackButton(this, () => this.scene.start('Menu'), { chrome: chrome, depth: 51 });
    } else {
      const menuBtn = this.add.rectangle(width / 2, chrome.btnY, 200, wide ? 40 : 48, 0x1a1a28)
        .setStrokeStyle(2, 0x2e2e48)
        .setInteractive({ useHandCursor: true })
        .setDepth(51);
      this.add.text(width / 2, chrome.btnY, '← МЕНЮ', {
        fontFamily: 'Arial', fontSize: wide ? '16px' : '19px', color: '#9a9ab8'
      }).setOrigin(0.5).setDepth(52);
      menuBtn.on('pointerup', () => this.scene.start('Menu'));
    }

    const cols = wide ? 2 : 1;
    const cardW = wide ? Math.min(540, (width - 60) / 2) : Math.min(620, width - 48);
    const cardH = wide ? 84 : 96;
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
    const spriteKey = this.textures.exists('arrow_' + skin.id) ? ('arrow_' + skin.id) : (this.textures.exists('arrow_neon') ? 'arrow_neon' : null);
    const previewSize = wide ? 28 : 34;
    const previewStart = x - w / 2 + (wide ? 30 : 40);
    for (let i = 0; i < 4; i++) {
      const px = previewStart + i * (wide ? 26 : 34);
      if (spriteKey) {
        const img = this.add.image(px, y - 6, spriteKey);
        img.setDisplaySize(previewSize, previewSize);
        img.setTint(colors[i]);
        img.setAngle(((i - 1) * 90 + 360) % 360);
        this.cardsContainer.add(img);
      } else {
        const g = this.add.graphics();
        if (window.drawArrowSkin) window.drawArrowSkin(g, i, colors[i], wide ? 32 : 40, skin.id);
        g.setPosition(px, y - 6);
        this.cardsContainer.add(g);
      }
    }

    const textX = x - w / 2 + (wide ? 140 : 170);
    const maxTextW = w - (wide ? 190 : 220);

    const title = this.add.text(textX, y - (wide ? 18 : 20), `${skin.icon}  ${skin.name}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '14px' : '17px',
      color: '#c8c8e0',
      wordWrap: { width: maxTextW }
    }).setOrigin(0, 0.5);
    this.cardsContainer.add(title);

    const desc = this.add.text(textX, y + 2, skin.desc || '', {
      fontFamily: 'Arial',
      fontSize: wide ? '11px' : '12px',
      color: '#6a6a82',
      wordWrap: { width: maxTextW }
    }).setOrigin(0, 0.5);
    this.cardsContainer.add(desc);

    const lockBadge = this.add.text(textX, y + (wide ? 20 : 24), '▶ ВИДЕО → ОТКРЫТЬ СТИЛЬ', {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif',
      fontSize: wide ? '10px' : '11px',
      color: '#00e8c8'
    }).setOrigin(0, 0.5).setAlpha(0);
    this.cardsContainer.add(lockBadge);

    const check = this.add.text(x + w / 2 - 22, y, '✓', {
      fontSize: wide ? '18px' : '24px',
      color: '#00e8c8'
    }).setOrigin(0.5).setAlpha(0);
    this.cardsContainer.add(check);

    const card = { skin, bg, title, desc, lockBadge, check, x, y, w, h };

    bg.on('pointerover', () => {
      if (skin.id !== this.selectedId) bg.setFillStyle(0x1c1c2c);
    });
    bg.on('pointerout', () => this.paintCard(card));
    bg.on('pointerdown', () => bg.setScale(0.98));
    bg.on('pointerup', () => {
      bg.setScale(1);
      if (window.pulseWasDrag && window.pulseWasDrag(this)) return;
      this.onCardTap(skin.id);
    });
    bg.on('pointerupoutside', () => bg.setScale(1));

    return card;
  }

  setupScroll(contentBottom, height, headerH, footerH) {
    const maxScroll = Math.max(0, contentBottom - (height - footerH));
    if (window.pulseBindScroll) {
      window.pulseBindScroll(this, this.cardsContainer, {
        headerH: headerH, footerTop: height - footerH, maxScroll: maxScroll
      });
    }
  }

  paintCard(card) {
    const unlocked = window.isSkinUnlocked ? window.isSkinUnlocked(card.skin.id) : true;
    const on = card.skin.id === this.selectedId;

    if (!unlocked) {
      card.bg.setFillStyle(0x12121c);
      card.bg.setStrokeStyle(2, 0x3a3a50);
      card.title.setColor('#8a8aa0');
      card.desc.setColor('#505068');
      card.lockBadge.setAlpha(1);
      card.check.setAlpha(0);
      return;
    }

    card.lockBadge.setAlpha(0);
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

  updateStatus(msg) {
    if (msg) {
      this.statusText.setText(msg);
      return;
    }
    const skin = this.skins.find(s => s.id === this.selectedId);
    this.statusText.setText('Выбрано: ' + (skin ? skin.name : 'Классика'));
  }

  onCardTap(id) {
    if (this.busy || !id) return;

    const unlocked = window.isSkinUnlocked ? window.isSkinUnlocked(id) : true;
    if (unlocked) {
      this.choose(id);
      return;
    }

    // Locked — offer rewarded ad
    this.busy = true;
    this.updateStatus('Видео откроет стиль сразу после просмотра…');

    const show = window.showRewardedAd
      ? window.showRewardedAd()
      : Promise.resolve(false);

    show.then((ok) => {
      this.busy = false;
      if (ok) {
        if (window.unlockSkin) window.unlockSkin(id);
        this.choose(id);
        this.updateStatus('Стиль открыт!');
        this.time.delayedCall(1200, () => this.updateStatus());
      } else {
        // Outside VK or no fill — for local test still unlock so QA works
        const isVK = window.isVK && typeof vkBridge !== 'undefined';
        if (!isVK) {
          if (window.unlockSkin) window.unlockSkin(id);
          this.choose(id);
          this.updateStatus('Стиль открыт (тест вне VK)');
          this.time.delayedCall(1400, () => this.updateStatus());
        } else {
          this.updateStatus('Реклама недоступна. Попробуйте позже');
          this.time.delayedCall(1800, () => this.updateStatus());
        }
      }
      this.paintAll();
    }).catch(() => {
      this.busy = false;
      this.updateStatus('Не удалось показать рекламу');
      this.time.delayedCall(1600, () => this.updateStatus());
    });
  }

  choose(id) {
    if (!id) return;
    if (window.isSkinUnlocked && !window.isSkinUnlocked(id)) return;

    if (!window.gameProgress) window.gameProgress = {};
    window.gameProgress.skin = id;
    this.selectedId = id;

    try {
      if (typeof window.setSelectedSkin === 'function') window.setSelectedSkin(id);
      else if (typeof window.persistProgress === 'function') window.persistProgress();
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

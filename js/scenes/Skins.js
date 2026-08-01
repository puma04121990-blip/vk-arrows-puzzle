class SkinsScene extends Phaser.Scene {
  constructor() {
    super('Skins');
  }

  create() {
    const { width, height } = this.scale;
    this.skins = window.ARROW_SKINS || [];
    this.selectedId = (window.gameProgress && window.gameProgress.skin) || 'neon';
    this.cards = [];
    this.scrollY = 0;
    this.isDragging = false;

    // Фон
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b14);

    // Заголовок (фиксированный)
    this.add.text(width / 2, 48, 'СКИНЫ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 88, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);
    this.updateStatus();

    // Контейнер списка
    this.list = this.add.container(0, 0);

    const cardW = 600;
    const cardH = 100;
    const gap = 14;
    const startY = 140;

    this.skins.forEach((skin, i) => {
      const y = startY + i * (cardH + gap);
      const card = this.buildCard(width / 2, y, cardW, cardH, skin);
      this.list.add(card.container);
      this.cards.push(card);
    });

    this.listHeight = startY + this.skins.length * (cardH + gap);
    this.maxScroll = Math.max(0, this.listHeight - (height - 110));

    // Кнопка назад (фиксированная сверху input)
    const back = this.add.container(width / 2, height - 52);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1a1a28, 1);
    backBg.fillRoundedRect(-100, -26, 200, 52, 14);
    backBg.lineStyle(1, 0x2e2e48, 1);
    backBg.strokeRoundedRect(-100, -26, 200, 52, 14);
    const backTxt = this.add.text(0, 0, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#9a9ab8'
    }).setOrigin(0.5);
    back.add([backBg, backTxt]);
    back.setSize(200, 52);
    back.setInteractive(
      new Phaser.Geom.Rectangle(-100, -26, 200, 52),
      Phaser.Geom.Rectangle.Contains
    );
    back.on('pointerup', () => this.scene.start('Menu'));

    this.refreshCards();
    this.bindInput(height);
  }

  buildCard(x, y, w, h, skin) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    container.add(bg);

    // Превью 4 стрелок
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0];
    const previews = [];
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      if (window.drawArrowSkin) {
        window.drawArrowSkin(g, i, colors[i], 48, skin.id);
      }
      g.setPosition(-w / 2 + 50 + i * 42, 0);
      g.setScale(0.9);
      container.add(g);
      previews.push(g);
    }

    const title = this.add.text(-20, -16, `${skin.icon}  ${skin.name}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#c8c8e0'
    }).setOrigin(0, 0.5);
    container.add(title);

    const desc = this.add.text(-20, 16, skin.desc, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6a6a82'
    }).setOrigin(0, 0.5);
    container.add(desc);

    const check = this.add.text(w / 2 - 36, 0, '✓', {
      fontSize: '28px',
      color: '#00e8c8'
    }).setOrigin(0.5).setAlpha(0);
    container.add(check);

    // Хит-зона
    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    const card = {
      skin,
      container,
      bg,
      title,
      desc,
      check,
      w,
      h,
      baseY: y
    };

    container.on('pointerup', (pointer) => {
      if (this.isDragging) return;
      if (pointer.getDistance() > 24) return;
      this.selectSkin(skin.id);
    });

    return card;
  }

  drawCardBg(card, selected) {
    const { bg, w, h } = card;
    bg.clear();
    if (selected) {
      bg.fillStyle(0x0f2e2a, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      bg.lineStyle(3, 0x00e8c8, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    } else {
      bg.fillStyle(0x161622, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      bg.lineStyle(2, 0x2a2a40, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    }
  }

  refreshCards() {
    this.cards.forEach((card) => {
      const on = card.skin.id === this.selectedId;
      this.drawCardBg(card, on);
      card.title.setColor(on ? '#ffffff' : '#c8c8e0');
      card.desc.setColor(on ? '#9a9ab4' : '#6a6a82');
      card.check.setAlpha(on ? 1 : 0);
    });
  }

  updateStatus() {
    const skin = this.skins.find(s => s.id === this.selectedId);
    const name = skin ? skin.name : 'Неон';
    this.statusText.setText(`Выбрано: ${name}`);
  }

  selectSkin(id) {
    if (!id || id === this.selectedId) {
      // Уже выбран — лёгкий pulse
      const card = this.cards.find(c => c.skin.id === id);
      if (card) {
        this.tweens.add({
          targets: card.container,
          scaleX: 0.96,
          scaleY: 0.96,
          duration: 70,
          yoyo: true
        });
      }
      return;
    }

    this.selectedId = id;

    // Сохранение
    if (!window.gameProgress) window.gameProgress = {};
    window.gameProgress.skin = id;
    if (typeof window.setSelectedSkin === 'function') {
      window.setSelectedSkin(id);
    } else if (typeof window.persistProgress === 'function') {
      window.persistProgress();
    } else {
      try {
        localStorage.setItem('arrow_pulse_progress_v3', JSON.stringify(window.gameProgress));
      } catch (e) {}
    }

    this.refreshCards();
    this.updateStatus();

    // Анимация выбранной карточки
    const card = this.cards.find(c => c.skin.id === id);
    if (card) {
      card.container.setScale(1);
      this.tweens.add({
        targets: card.container,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
      this.tweens.add({
        targets: card.check,
        scale: { from: 0.4, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 160,
        ease: 'Back.easeOut'
      });
    }
  }

  bindInput(height) {
    let startY = 0;
    let startScroll = 0;
    let moved = false;

    this.input.on('pointerdown', (p) => {
      if (p.y > height - 90) return;
      this.isDragging = false;
      moved = false;
      startY = p.y;
      startScroll = this.scrollY;
    });

    this.input.on('pointermove', (p) => {
      if (startY === 0 && startScroll === 0 && !moved) {
        // pointerdown could have been ignored
      }
      const dy = p.y - startY;
      if (Math.abs(dy) > 12) {
        moved = true;
        this.isDragging = true;
      }
      if (!moved || this.maxScroll <= 0) return;
      this.scrollY = Phaser.Math.Clamp(startScroll + dy, -this.maxScroll, 0);
      this.list.y = this.scrollY;
    });

    this.input.on('pointerup', () => {
      // Небольшой delay чтобы pointerup карточки успел проверить isDragging
      this.time.delayedCall(30, () => {
        this.isDragging = false;
      });
      startY = 0;
    });
  }
}

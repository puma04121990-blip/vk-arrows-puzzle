class LegalScene extends Phaser.Scene {
  constructor() {
    super('Legal');
  }

  create() {
    const L = window.pulseLayout(this);
    const { w, h, cx, wide, padT, padB, padX } = L;

    this.add.rectangle(0, 0, w, h, 0x0b0b14).setOrigin(0);

    this.DOCS = {
      terms: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/terms.html',
      privacy: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/privacy.html'
    };

    const title = this.add.text(cx, padT + 8, 'ПРАВОВАЯ ИНФОРМАЦИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '20px' : '22px',
      color: '#00e8c8',
      wordWrap: { width: w - padX * 2 },
      align: 'center'
    }).setOrigin(0.5, 0).setDepth(21);

    const sub = this.add.text(cx, title.y + title.height + 8, '«Пульс стрелок» · Возраст 0+', {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '13px',
      color: '#6a6a82'
    }).setOrigin(0.5, 0).setDepth(21);

    const headerH = Math.max(72, Math.round(sub.y + sub.height + 16));
    this.add.rectangle(cx, headerH / 2, w, headerH, 0x0b0b14, 1).setDepth(20);
    title.setDepth(21);
    sub.setDepth(21);

    const items = [
      {
        title: 'Пользовательское соглашение',
        desc: 'Открыть в браузере',
        action: () => this.openExternal(this.DOCS.terms)
      },
      {
        title: 'Политика конфиденциальности',
        desc: 'Открыть в браузере',
        action: () => this.openExternal(this.DOCS.privacy)
      }
    ];

    const cardW = Math.min(w - padX * 2, 520);
    const cardH = 64;
    let y = headerH + 20 + cardH / 2;

    items.forEach((item) => {
      const bg = this.add.rectangle(cx, y, cardW, cardH, 0x161622)
        .setStrokeStyle(1, 0x2a2a40)
        .setInteractive({ useHandCursor: true });

      this.add.text(cx - cardW / 2 + 18, y - 12, item.title, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '15px',
        color: '#e0e0f0'
      }).setOrigin(0, 0.5);

      this.add.text(cx - cardW / 2 + 18, y + 12, item.desc, {
        fontFamily: 'Manrope, Arial, sans-serif',
        fontSize: '12px',
        color: '#6a6a82'
      }).setOrigin(0, 0.5);

      this.add.text(cx + cardW / 2 - 18, y, '→', {
        fontSize: '18px',
        color: '#00e8c8'
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
      bg.on('pointerout', () => bg.setFillStyle(0x161622));
      bg.on('pointerup', () => item.action && item.action());
      y += cardH + 12;
    });

    this.add.text(cx, y + 8, [
      'Прогресс синхронизируется через VK Storage.',
      'Вопросы — кнопка «ПОДДЕРЖКА» в настройках.'
    ].join('\n'), {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      wordWrap: { width: w - padX * 2 },
      lineSpacing: 4
    }).setOrigin(0.5, 0);

    const btnY = h - padB - 24;
    const menuBtn = this.add.rectangle(cx, btnY, 200, 48, 0x1a1a28)
      .setStrokeStyle(1, 0x2e2e48)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => this.scene.start('Menu'));
  }

  openExternal(url) {
    if (window.openExternalUrl) {
      window.openExternalUrl(url);
      return;
    }
    if (window.isVK && typeof vkBridge !== 'undefined') {
      vkBridge.send('VKWebAppOpenURL', { url }).catch(() => {
        try { window.open(url, '_blank'); } catch (e) {}
      });
    } else {
      try { window.open(url, '_blank'); } catch (e) {}
    }
  }
}

class LegalScene extends Phaser.Scene {
  constructor() {
    super('Legal');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;
    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.DOCS = {
      terms: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/terms.html',
      privacy: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/privacy.html'
    };

    this.add.text(width / 2, wide ? 36 : 48, 'ПРАВОВАЯ ИНФОРМАЦИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '20px' : '24px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, wide ? 64 : 82, '«Пульс стрелок» · Возраст 0+', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#6a6a82'
    }).setOrigin(0.5);

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

    const cardW = Math.min(width - 48, 520);
    const cardH = wide ? 58 : 66;
    let y = wide ? 108 : 128;

    items.forEach((item) => {
      const bg = this.add.rectangle(width / 2, y, cardW, cardH, 0x161622)
        .setStrokeStyle(1, 0x2a2a40)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2 - cardW / 2 + 18, y - 10, item.title, {
        fontFamily: 'Arial Black, Arial',
        fontSize: wide ? '14px' : '15px',
        color: '#e0e0f0'
      }).setOrigin(0, 0.5);

      const desc = this.add.text(width / 2 - cardW / 2 + 18, y + 12, item.desc, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#6a6a82'
      }).setOrigin(0, 0.5);
      const maxDW = cardW - 56;
      if (desc.width > maxDW) desc.setScale(maxDW / desc.width);

      this.add.text(width / 2 + cardW / 2 - 18, y, '→', {
        fontSize: '18px',
        color: '#00e8c8'
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
      bg.on('pointerout', () => bg.setFillStyle(0x161622));
      bg.on('pointerup', () => item.action && item.action());

      y += cardH + 10;
    });

    const note = [
      'Поддержка — кнопка «ПОДДЕРЖКА» в меню.',
      'Прогресс синхронизируется через VK Storage.'
    ].join('\n');

    this.add.text(width / 2, y + 10, note, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5, 0);

    const btnY = height - (wide ? 36 : 52);
    const menuBtn = this.add.rectangle(width / 2, btnY, 200, wide ? 42 : 50, 0x1a1a28)
      .setStrokeStyle(1, 0x2e2e48)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, btnY, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '19px',
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

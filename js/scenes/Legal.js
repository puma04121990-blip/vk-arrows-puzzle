class LegalScene extends Phaser.Scene {
  constructor() {
    super('Legal');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, wide ? 24 : 36, 'ПРАВОВАЯ ИНФОРМАЦИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '22px' : '26px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, wide ? 50 : 68, '«Пульс стрелок» · Возраст 0+', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6a6a82'
    }).setOrigin(0.5);

    const items = [
      {
        title: 'Пользовательское соглашение',
        desc: 'Условия использования игры',
        url: 'terms.html'
      },
      {
        title: 'Политика конфиденциальности',
        desc: 'Какие данные используются',
        url: 'privacy.html'
      },
      {
        title: 'Правила VK',
        desc: 'Правила платформы ВКонтакте',
        url: 'https://vk.com/terms'
      }
    ];

    const cardW = Math.min(width - 48, 520);
    const cardH = wide ? 64 : 72;
    let y = wide ? 88 : 110;

    items.forEach((item) => {
      const bg = this.add.rectangle(width / 2, y, cardW, cardH, 0x161622)
        .setStrokeStyle(2, 0x2a2a40)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2 - cardW / 2 + 18, y - 11, item.title, {
        fontFamily: 'Arial Black, Arial',
        fontSize: wide ? '15px' : '16px',
        color: '#e0e0f0'
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 - cardW / 2 + 18, y + 13, item.desc, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#6a6a82'
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 + cardW / 2 - 16, y, '↗', {
        fontSize: '16px',
        color: '#00e8c8'
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
      bg.on('pointerout', () => bg.setFillStyle(0x161622));
      bg.on('pointerup', () => this.openDoc(item.url));

      y += cardH + 10;
    });

    const note = [
      'Игра бесплатна. Прогресс хранится на устройстве.',
      'Персональные данные на серверы разработчика не передаются.',
      'Начиная игру, вы принимаете соглашение и политику.'
    ].join('\n');

    this.add.text(width / 2, y + 8, note, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5, 0);

    const btnY = height - (wide ? 34 : 50);
    const menuBtn = this.add.rectangle(width / 2, btnY, 200, wide ? 40 : 50, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
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

  openDoc(url) {
    let full = url;
    if (url.indexOf('http') !== 0) {
      const base = window.location.href
        .replace(/index\.html.*$/, '')
        .replace(/\?.*$/, '');
      full = base.replace(/\/?$/, '/') + url;
    }

    if (window.isVK && typeof vkBridge !== 'undefined') {
      vkBridge.send('VKWebAppOpenURL', { url: full }).catch(() => {
        window.open(full, '_blank');
      });
    } else {
      window.open(full, '_blank');
    }
  }
}

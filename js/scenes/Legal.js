class LegalScene extends Phaser.Scene {
  constructor() {
    super('Legal');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, wide ? 28 : 40, 'ПРАВОВАЯ ИНФОРМАЦИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '22px' : '26px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, wide ? 54 : 72, '«Пульс стрелок» · Возраст 0+', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6a6a82'
    }).setOrigin(0.5);

    const baseUrl = 'https://puma04121990-blip.github.io/vk-arrows-puzzle/';

    const items = [
      {
        title: 'Пользовательское соглашение',
        desc: 'Условия использования игры',
        url: 'terms.html',
        fullUrl: baseUrl + 'terms.html'
      },
      {
        title: 'Политика конфиденциальности',
        desc: 'Какие данные используются',
        url: 'privacy.html',
        fullUrl: baseUrl + 'privacy.html'
      }
    ];

    const cardW = Math.min(width - 48, 560);
    const cardH = wide ? 88 : 96;
    let y = wide ? 100 : 120;

    items.forEach((item) => {
      const bg = this.add.rectangle(width / 2, y, cardW, cardH, 0x161622)
        .setStrokeStyle(2, 0x2a2a40)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2 - cardW / 2 + 18, y - 22, item.title, {
        fontFamily: 'Arial Black, Arial',
        fontSize: wide ? '16px' : '17px',
        color: '#e0e0f0'
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 - cardW / 2 + 18, y + 2, item.desc, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#6a6a82'
      }).setOrigin(0, 0.5);

      // Дублирование полной ссылки
      this.add.text(width / 2 - cardW / 2 + 18, y + 26, item.fullUrl, {
        fontFamily: 'Arial',
        fontSize: wide ? '11px' : '10px',
        color: '#00e8c8'
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 + cardW / 2 - 16, y - 8, '↗', {
        fontSize: '16px',
        color: '#00e8c8'
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
      bg.on('pointerout', () => bg.setFillStyle(0x161622));
      bg.on('pointerup', () => this.openDoc(item.url));

      y += cardH + 14;
    });

    const note = [
      'Ссылки для кабинета VK (Правовые документы):',
      baseUrl + 'terms.html',
      baseUrl + 'privacy.html',
      '',
      'Игра бесплатна. Прогресс хранится на устройстве.',
      'Начиная игру, вы принимаете соглашение и политику.'
    ].join('\n');

    this.add.text(width / 2, y + 8, note, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      lineSpacing: 3
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

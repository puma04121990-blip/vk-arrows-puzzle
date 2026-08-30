class SupportScene extends Phaser.Scene {
  constructor() {
    super('Support');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;
    const s = window.APP_SUPPORT || {};
    const community = s.communityUrl || '';
    const hasCommunity = /^https?:\/\/(m\.)?vk\.(com|ru)\//i.test(community);
    const email = s.email || '—';
    const communityLabel = (community || '').replace(/^https?:\/\/(m\.)?vk\.(com|ru)\//i, '');

    if (window.drawAppBackground) window.drawAppBackground(this, width, height);
    else this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const headerH = wide ? 70 : 92;
    const footerH = wide ? 56 : 72;
    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 0.96).setDepth(20);
    this.add.text(width / 2, wide ? 24 : 34, 'ПОДДЕРЖКА', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '24px' : '28px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(21);

    this.add.text(width / 2, wide ? 50 : 66, 'Связь с разработчиком', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#8a8aa8'
    }).setOrigin(0.5).setDepth(21);

    const cardW = Math.min(width - 48, 520);
    let y = headerH + (wide ? 56 : 64);

    // Community card is rendered only after a real public community URL is configured.
    if (hasCommunity) {
      y = this.makeCard(width / 2, y, cardW, wide, {
        icon: '👥',
        title: 'Сообщество VK',
        value: communityLabel || community,
        hint: 'Нажми, чтобы открыть',
        onTap: () => {
          if (window.openSupportCommunity) window.openSupportCommunity();
        }
      });
      y += wide ? 18 : 22;
    }

    // Email card
    y = this.makeCard(width / 2, y, cardW, wide, {
      icon: '✉',
      title: 'Email',
      value: email,
      hint: 'Нажми, чтобы написать',
      onTap: () => {
        if (window.openSupportEmail) window.openSupportEmail();
      }
    });
    y += wide ? 24 : 30;

    if (!hasCommunity) {
      this.add.text(width / 2, y - 18, 'Поддержка доступна по e-mail', {
        fontFamily: 'Manrope, Arial, sans-serif', fontSize: '12px', color: '#6a6a82'
      }).setOrigin(0.5);
    }
    this.add.text(width / 2, y, s.responseHint || 'Ответ в течение 7 дней', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#6a6a82',
      align: 'center'
    }).setOrigin(0.5);

    y += wide ? 28 : 36;
    this.add.text(width / 2, y, [
      'Также контакты указаны в',
      'Политике и Пользовательском соглашении.'
    ].join('\n'), {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    const btnY = height - footerH / 2;
    this.add.rectangle(width / 2, btnY, width, footerH, 0x0b0b14, 0.96).setDepth(20);
    const menuBtn = this.add.rectangle(width / 2, btnY, 200, wide ? 42 : 50, 0x1a1a28)
      .setStrokeStyle(1, 0x2e2e48)
      .setInteractive({ useHandCursor: true })
      .setDepth(21);
    this.add.text(width / 2, btnY, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '19px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(22);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => this.scene.start('Menu'));
  }

  makeCard(cx, y, cardW, wide, opts) {
    const cardH = wide ? 88 : 100;
    const bg = this.add.rectangle(cx, y, cardW, cardH, 0x161622)
      .setStrokeStyle(1, 0x2a2a40)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx - cardW / 2 + 18, y - 26, (opts.icon || '') + '  ' + opts.title, {
      fontFamily: 'Arial',
      fontSize: wide ? '13px' : '14px',
      color: '#8a8aa8'
    }).setOrigin(0, 0.5);

    const val = this.add.text(cx - cardW / 2 + 18, y + 2, opts.value, {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '16px' : '17px',
      color: '#00e8c8'
    }).setOrigin(0, 0.5);
    const maxW = cardW - 48;
    if (val.width > maxW) val.setScale(maxW / val.width);

    this.add.text(cx - cardW / 2 + 18, y + 28, opts.hint || '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068'
    }).setOrigin(0, 0.5);

    this.add.text(cx + cardW / 2 - 18, y, '→', {
      fontSize: '20px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
    bg.on('pointerout', () => bg.setFillStyle(0x161622));
    bg.on('pointerup', () => opts.onTap && opts.onTap());

    return y + cardH / 2;
  }
}

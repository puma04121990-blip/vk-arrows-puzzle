class ConsentScene extends Phaser.Scene {
  constructor() {
    super('Consent');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.DOCS = {
      terms: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/terms.html',
      privacy: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/privacy.html'
    };

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, wide ? 40 : 56, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: wide ? '26px' : '28px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, wide ? 72 : 96, 'Перед началом игры', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    this.add.text(width / 2, wide ? 108 : 140, [
      'Ознакомьтесь с документами',
      'и примите условия использования.'
    ].join('\n'), {
      fontFamily: 'Arial',
      fontSize: wide ? '14px' : '15px',
      color: '#b8b8d0',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5, 0);

    const cardW = Math.min(width - 48, 400);
    const cardH = wide ? 56 : 64;
    let y = wide ? 170 : 220;

    this.makeDocButton(width / 2, y, cardW, cardH, 'Пользовательское соглашение', () => {
      this.openExternal(this.DOCS.terms);
    }, wide);
    y += cardH + 14;

    this.makeDocButton(width / 2, y, cardW, cardH, 'Политика конфиденциальности', () => {
      this.openExternal(this.DOCS.privacy);
    }, wide);
    y += cardH + (wide ? 28 : 36);

    this.add.text(width / 2, y, [
      'Нажимая «Принимаю», вы соглашаетесь',
      'с условиями и политикой конфиденциальности.'
    ].join('\n'), {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5, 0);
    y += wide ? 48 : 56;

    const acceptW = Math.min(width - 64, 300);
    const acceptH = wide ? 48 : 54;
    const acceptBg = this.add.rectangle(width / 2, y, acceptW, acceptH, 0x00e8c8)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, y, 'ПРИНИМАЮ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: wide ? '18px' : '20px',
      color: '#0b0b14'
    }).setOrigin(0.5);

    acceptBg.on('pointerover', () => acceptBg.setFillStyle(0x00d4b8));
    acceptBg.on('pointerout', () => acceptBg.setFillStyle(0x00e8c8));
    acceptBg.on('pointerup', () => this.accept());
  }

  makeDocButton(x, y, w, h, label, cb, wide) {
    const bg = this.add.rectangle(x, y, w, h, 0x161622)
      .setStrokeStyle(1, 0x2a2a40)
      .setInteractive({ useHandCursor: true });

    const labelMax = w - 48;
    const t = this.add.text(x - w / 2 + 16, y, label, {
      fontFamily: 'Arial',
      fontSize: wide ? '14px' : '15px',
      color: '#e0e0f0'
    }).setOrigin(0, 0.5);
    if (window.fitTextWidth) window.fitTextWidth(t, labelMax);

    this.add.text(x + w / 2 - 16, y, '→', {
      fontSize: '16px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
    bg.on('pointerout', () => bg.setFillStyle(0x161622));
    bg.on('pointerup', cb);
  }

  openExternal(url) {
    if (window.isVK && typeof vkBridge !== 'undefined') {
      vkBridge.send('VKWebAppOpenURL', { url }).catch(() => {
        try { window.open(url, '_blank'); } catch (e) {}
      });
    } else {
      try { window.open(url, '_blank'); } catch (e) {}
    }
  }

  accept() {
    if (window.setConsentAccepted) {
      window.setConsentAccepted(true);
    } else {
      try { localStorage.setItem('arrow_pulse_consent_v1', '1'); } catch (e) {}
    }
    this.scene.start('Menu');
  }
}

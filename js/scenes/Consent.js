class ConsentScene extends Phaser.Scene {
  constructor() {
    super('Consent');
  }

  create() {
    const L = window.pulseLayout(this);
    const { w, h, cx, wide, short, padT, padB, padX } = L;

    this.DOCS = {
      terms: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/terms.html',
      privacy: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/privacy.html'
    };

    this.add.rectangle(0, 0, w, h, 0x0b0b14).setOrigin(0);

    const acceptH = Math.max(48, Math.min(56, Math.round(h * 0.09)));
    const acceptW = Math.min(w - padX * 2, 340);
    const acceptY = h - padB - acceptH / 2;

    const disclaimer = this.add.text(cx, 0, [
      'Нажимая «Принимаю», вы соглашаетесь',
      'с пользовательским соглашением',
      'и политикой конфиденциальности.'
    ].join('\n'), {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: short ? '12px' : '14px',
      color: '#8a8aa8',
      align: 'center',
      wordWrap: { width: Math.max(160, w - padX * 2) },
      lineSpacing: 5
    }).setOrigin(0.5, 1);

    const gap = 20;
    disclaimer.setY(acceptY - acceptH / 2 - gap);

    const titleSize = short ? '22px' : (wide ? '26px' : '30px');
    const title = this.add.text(cx, padT + 4, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial Black, Arial',
      fontSize: titleSize,
      color: '#00e8c8'
    }).setOrigin(0.5, 0);

    const sub = this.add.text(cx, title.y + title.height + 10, [
      'Перед началом игры ознакомьтесь',
      'с документами и примите условия.'
    ].join('\n'), {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: short ? '13px' : '15px',
      color: '#b8b8d0',
      align: 'center',
      wordWrap: { width: Math.max(160, w - padX * 2) },
      lineSpacing: 4
    }).setOrigin(0.5, 0);

    const cardW = Math.min(w - padX * 2, 420);
    const cardH = Math.max(44, Math.min(56, Math.round(h * 0.08)));
    const docsTop = sub.y + sub.height + 18;
    const docsBottom = disclaimer.y - disclaimer.height - 16;
    const needed = cardH * 2 + 12;
    const available = docsBottom - docsTop;
    const useH = available < needed ? Math.max(40, Math.floor((available - 12) / 2)) : cardH;
    let docY = docsTop + useH / 2;
    if (available > needed) {
      docY = docsTop + (available - needed) / 2 + useH / 2;
    }

    this.makeDocButton(cx, docY, cardW, useH, 'Пользовательское соглашение', () => {
      this.openExternal(this.DOCS.terms);
    }, wide);
    this.makeDocButton(cx, docY + useH + 12, cardW, useH, 'Политика конфиденциальности', () => {
      this.openExternal(this.DOCS.privacy);
    }, wide);

    const acceptBg = this.add.rectangle(cx, acceptY, acceptW, acceptH, 0x00e8c8)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, acceptY, 'ПРИНИМАЮ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: short ? '16px' : '20px',
      color: '#0b0b14'
    }).setOrigin(0.5);

    acceptBg.on('pointerover', () => acceptBg.setFillStyle(0x00d4b8));
    acceptBg.on('pointerout', () => acceptBg.setFillStyle(0x00e8c8));
    acceptBg.on('pointerup', () => this.accept());
  }

  makeDocButton(x, y, w, h, label, cb, wide) {
    const bg = this.add.rectangle(x, y, w, h, 0x161622)
      .setStrokeStyle(2, 0x2a2a40)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x - w / 2 + 16, y, label, {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: wide ? '15px' : '16px',
      color: '#e0e0f0'
    }).setOrigin(0, 0.5);
    const maxW = w - 48;
    if (text.width > maxW) text.setScale(maxW / text.width);

    this.add.text(x + w / 2 - 16, y, '↗', {
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
    }
    this.scene.start('Menu');
  }
}

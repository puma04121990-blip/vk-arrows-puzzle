class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    if (window.drawAppBackground) window.drawAppBackground(this, width, height);
    else this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const headerH = wide ? 70 : 92;
    const footerH = wide ? 58 : 74;
    const cardW = Math.min(width - 44, wide ? 520 : 460);
    const cardH = wide ? 88 : 104;

    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 0.96).setDepth(20);
    this.add.text(width / 2, wide ? 24 : 34, 'НАСТРОЙКИ', {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif',
      fontSize: wide ? '26px' : '30px', color: '#00e8c8'
    }).setOrigin(0.5).setDepth(21);
    this.add.text(width / 2, wide ? 50 : 66, 'Звук сохраняется на этом устройстве', {
      fontFamily: 'Manrope, Arial, sans-serif', fontSize: '12px', color: '#6a6a82'
    }).setOrigin(0.5).setDepth(21);

    const centerY = wide ? height / 2 - 16 : height * 0.36;
    this.musicCard = this.makeToggleCard(width / 2, centerY, cardW, cardH, {
      title: 'Фоновая музыка',
      subtitle: 'Спокойная мелодия во время игры',
      accent: 0x00e8c8,
      getValue: () => window.isMusicOn ? window.isMusicOn() : true,
      onToggle: () => {
        if (window.unlockGameAudio) window.unlockGameAudio();
        if (window.toggleMusic) window.toggleMusic();
        this.refresh();
      }
    });

    this.effectsCard = this.makeToggleCard(width / 2, centerY + cardH + (wide ? 18 : 22), cardW, cardH, {
      title: 'Звуковые эффекты',
      subtitle: 'Нажатия, ходы, ошибки и победы',
      accent: 0xffd166,
      getValue: () => window.isSoundOn ? window.isSoundOn() : true,
      onToggle: () => {
        if (window.unlockGameAudio) window.unlockGameAudio();
        if (window.toggleSound) window.toggleSound();
        if (window.isSoundOn && window.isSoundOn() && window.playUiTone) window.playUiTone(660, 0.1, 'sine', 0.08);
        this.refresh();
      }
    });

    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 0.96).setDepth(20);
    const back = window.createNiceButton
      ? window.createNiceButton(this, width / 2, height - footerH / 2, '← МЕНЮ', () => this.scene.start('Menu'), {
        w: 210, h: wide ? 40 : 48, color: 0x1a1a28, secondary: true, fontSize: wide ? '15px' : '17px', depth: 21
      })
      : null;
    if (!back) {
      const fallback = this.add.text(width / 2, height - footerH / 2, '← МЕНЮ', {
        fontFamily: 'Arial', fontSize: '18px', color: '#9a9ab8', backgroundColor: '#181828', padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });
      fallback.on('pointerup', () => this.scene.start('Menu'));
    }

    this.refresh();
  }

  makeToggleCard(x, y, w, h, opts) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    const title = this.add.text(-w / 2 + 22, -h * 0.21, opts.title, {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif', fontSize: '17px', color: '#e8e8f8'
    }).setOrigin(0, 0.5);
    const subtitle = this.add.text(-w / 2 + 22, h * 0.16, opts.subtitle, {
      fontFamily: 'Manrope, Arial, sans-serif', fontSize: '12px', color: '#6a6a82', wordWrap: { width: w - 170 }
    }).setOrigin(0, 0.5);
    const state = this.add.text(w / 2 - 72, -h * 0.18, '', {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif', fontSize: '12px'
    }).setOrigin(0.5);
    const knob = this.add.graphics();
    c.add([bg, title, subtitle, state, knob]);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.paintToggle(card, true));
    c.on('pointerout', () => this.paintToggle(card, false));
    c.on('pointerup', () => opts.onToggle());

    const card = { container: c, bg, knob, state, opts, w, h, hover: false };
    return card;
  }

  paintToggle(card, hover) {
    const on = !!card.opts.getValue();
    const { bg, knob, state, w, h, opts } = card;
    const accent = opts.accent;
    bg.clear();
    bg.fillStyle(on ? 0x15322d : 0x171724, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.lineStyle(2, on ? accent : (hover ? 0x4a4a6a : 0x2a2a40), on ? 0.8 : 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    knob.clear();
    const tx = w / 2 - 58;
    knob.fillStyle(on ? accent : 0x3a3a52, 1);
    knob.fillRoundedRect(tx - 28, 10, 56, 28, 14);
    knob.fillStyle(on ? 0x0b0b14 : 0xd0d0e8, 1);
    knob.fillCircle(tx + (on ? 14 : -14), 24, 10);
    state.setText(on ? 'ВКЛ' : 'ВЫКЛ');
    state.setColor(on ? '#00e8c8' : '#8a8aa8');
  }

  refresh() {
    if (this.musicCard) this.paintToggle(this.musicCard, false);
    if (this.effectsCard) this.paintToggle(this.effectsCard, false);
  }

}

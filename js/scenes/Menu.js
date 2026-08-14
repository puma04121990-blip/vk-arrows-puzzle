class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    if (window.drawAppBackground) {
      window.drawAppBackground(this, width, height);
    } else {
      this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);
    }

    if (window.refreshLoginStreak) {
      try { window.refreshLoginStreak(); } catch (e) {}
    }

    if (window.createSoundToggle) {
      window.createSoundToggle(this, width - (wide ? 36 : 40), wide ? 28 : 36, {
        size: wide ? 40 : 44,
        fontSize: wide ? '20px' : '22px',
        depth: 80
      });
    }

    const titleY = wide ? 48 : Math.max(72, Math.round(height * 0.08));
    this.add.text(width / 2, titleY, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '32px' : '28px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5);

    const greetY = titleY + (wide ? 30 : 34);
    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = 'Привет, ' + window.vkUser.first_name + '!';
    }
    this.add.text(width / 2, greetY, greeting, {
      fontFamily: 'Arial',
      fontSize: wide ? '14px' : '15px',
      color: '#8a8aa8',
      align: 'center',
      wordWrap: { width: width - 48 }
    }).setOrigin(0.5);

    const circleR = wide ? 64 : 72;
    const circleY = greetY + circleR + (wide ? 28 : 34);
    const cx = width / 2;

    const plate = this.add.graphics();
    plate.fillStyle(0x0e0e18, 1);
    plate.fillCircle(cx, circleY, circleR);
    plate.lineStyle(2, 0x2a2a40, 1);
    plate.strokeCircle(cx, circleY, circleR);

    if (this.textures.exists('menuLogo')) {
      const logo = this.add.image(cx, circleY, 'menuLogo');
      const diam = circleR * 2 - 4;
      logo.setDisplaySize(diam, diam);
      logo.setDepth(2);
      const maskG = this.make.graphics({ x: 0, y: 0, add: false });
      maskG.fillStyle(0xffffff);
      maskG.fillCircle(cx, circleY, circleR - 2);
      logo.setMask(maskG.createGeometryMask());
      const ring = this.add.graphics().setDepth(3);
      ring.lineStyle(2, 0x00e8c8, 0.35);
      ring.strokeCircle(cx, circleY, circleR - 1);
    }

    let infoY = circleY + circleR + (wide ? 12 : 16);
    const goal = window.getNextGoalText ? window.getNextGoalText() : '';
    if (goal) {
      this.add.text(width / 2, infoY, goal, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#ffd166',
        align: 'center',
        wordWrap: { width: width - 40 }
      }).setOrigin(0.5);
      infoY += wide ? 20 : 24;
    }

    const streak = window.getLoginStreak ? window.getLoginStreak() : 0;
    const hints = window.getHints ? window.getHints() : 0;
    const dailyBest = window.getDailyBest ? window.getDailyBest() : null;
    const dailyInfo = dailyBest && dailyBest.bestStars
      ? ('Ежедн. ' + dailyBest.bestStars + '★')
      : 'Ежедн. —';
    this.add.text(width / 2, infoY, 'Серия ' + streak + ' дн.  ·  ' + dailyInfo + '  ·  Подсказки: ' + hints, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#6a6a82',
      align: 'center'
    }).setOrigin(0.5);
    infoY += wide ? 18 : 22;

    const maxLevel = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const hasProgress = maxLevel > 0;

    const footerH = wide ? 32 : 40;
    const footerY = height - footerH / 2 - 2;
    this.add.text(width / 2, footerY, 'Играя, вы принимаете соглашение и политику', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#404058',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5);

    const buttons = [];

    if (window.canClaimDailyReward && window.canClaimDailyReward()) {
      buttons.push({
        label: '🎁 НАГРАДА ДНЯ',
        color: 0xffd166,
        secondary: false,
        cb: () => this.onClaimReward()
      });
    }

    if (hasProgress) {
      buttons.push({
        label: 'ПРОДОЛЖИТЬ',
        color: 0x00e8c8,
        secondary: false,
        cb: () => {
          try {
            if (window.startCampaignLevel) {
              window.startCampaignLevel(Math.min(maxLevel, (LEVELS && LEVELS.length ? LEVELS.length : 50) - 1));
            } else {
              window.gameData = window.gameData || {};
              window.gameData.mode = 'campaign';
              window.gameData.currentLevel = Math.min(maxLevel, 49);
            }
          } catch (e) {}
          this.scene.start('Game');
        }
      });
    } else {
      buttons.push({
        label: 'ИГРАТЬ',
        color: 0x00e8c8,
        secondary: false,
        cb: () => {
          try {
            if (window.startCampaignLevel) window.startCampaignLevel(0);
            else {
              window.gameData = window.gameData || {};
              window.gameData.mode = 'campaign';
              window.gameData.currentLevel = 0;
            }
          } catch (e) {}
          this.scene.start('Game');
        }
      });
    }

    buttons.push({
      label: 'ЕЖЕДНЕВНЫЙ',
      color: 0x2a4a5a,
      secondary: true,
      cb: () => this.onDaily()
    });

    buttons.push(
      { label: 'УРОВНИ', color: 0x222238, secondary: true, cb: () => this.scene.start('LevelsMap') },
      { label: 'СТИЛИ', color: 0x222238, secondary: true, cb: () => this.scene.start('Skins') },
      { label: 'МАГАЗИН', color: 0x3a2a18, secondary: true, cb: () => this.scene.start('Shop') },
      { label: 'ДОСТИЖЕНИЯ', color: 0x222238, secondary: true, cb: () => this.scene.start('Achievements') },
      { label: 'КАК ИГРАТЬ', color: 0x222238, secondary: true, cb: () => this.scene.start('Help') },
      { label: 'ПОДДЕРЖКА', color: 0x1e2a38, secondary: true, cb: () => this.scene.start('Support') },
      { label: 'ПРАВОВАЯ', color: 0x1a1a28, secondary: true, cb: () => this.scene.start('Legal') }
    );

    const zoneTop = infoY + 4;
    const zoneBottom = footerY - footerH / 2 - 8;
    const bh = wide ? 36 : 40;
    const n = buttons.length;
    const freeH = Math.max(0, zoneBottom - zoneTop);
    const step = Math.min(wide ? 42 : 46, freeH / n);
    const totalH = step * (n - 1);
    let y = zoneTop + Math.max(0, (freeH - totalH) / 2);

    buttons.forEach((b) => {
      this.createButton(
        width / 2,
        Math.round(y),
        b.label,
        b.color,
        b.cb,
        !!b.secondary,
        wide,
        bh
      );
      y += step;
    });
  }

  onDaily() {
    if (this._busy) return;
    this._busy = true;
    try {
      if (window.startDailyPuzzle) window.startDailyPuzzle();
      else {
        window.gameData = window.gameData || {};
        window.gameData.mode = 'campaign';
        window.gameData.currentLevel = 0;
      }
    } catch (e) {
      console.warn('[ArrowPulse] daily start failed:', e);
      window.gameData = window.gameData || {};
      window.gameData.mode = 'campaign';
      window.gameData.currentLevel = 0;
    }
    this.scene.start('Game');
  }

  onClaimReward() {
    if (this._busy) return;
    this._busy = true;

    let res = null;
    try {
      res = window.claimDailyReward ? window.claimDailyReward() : null;
    } catch (e) {
      console.warn('[ArrowPulse] claim error:', e);
      this._busy = false;
      return;
    }

    if (!res || !res.ok) {
      this._busy = false;
      return;
    }

    const { width, height } = this.scale;
    const rewards = res.rewards || [];
    const lines = Math.max(1, rewards.length);
    const bw = Math.min(width - 40, 360);
    const bh = Math.min(height * 0.7, 180 + lines * 28 + (res.nextItems && res.nextItems.length ? 56 : 20));

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setDepth(100)
      .setInteractive();
    const box = this.add.graphics().setDepth(101);
    box.fillStyle(0x161622, 1);
    box.fillRoundedRect(width / 2 - bw / 2, height / 2 - bh / 2, bw, bh, 18);
    box.lineStyle(2, 0xffd166, 0.9);
    box.strokeRoundedRect(width / 2 - bw / 2, height / 2 - bh / 2, bw, bh, 18);

    let y = height / 2 - bh / 2 + 28;

    this.add.text(width / 2, y, (res.icon || '🎁') + ' НАГРАДА ДНЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffd166'
    }).setOrigin(0.5).setDepth(102);
    y += 28;

    this.add.text(width / 2, y, 'День ' + res.day + ' из 7 · серия ' + res.streak + ' дн.', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#8a8aa8'
    }).setOrigin(0.5).setDepth(102);
    y += 22;

    this.add.text(width / 2, y, res.title || 'Награда получена', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(102);
    y += 26;

    rewards.forEach((r) => {
      this.add.text(width / 2, y, (r.icon || '•') + '  ' + (r.text || ''), {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#e8e8f8'
      }).setOrigin(0.5).setDepth(102);
      y += 24;
    });

    if (res.nextItems && res.nextItems.length) {
      y += 8;
      this.add.text(width / 2, y, 'Завтра: ' + (res.nextTitle || ('день ' + res.nextDay)), {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#6a6a82'
      }).setOrigin(0.5).setDepth(102);
      y += 18;
      this.add.text(width / 2, y, res.nextItems.join(' · '), {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#5a5a72',
        align: 'center',
        wordWrap: { width: bw - 36 }
      }).setOrigin(0.5).setDepth(102);
    }

    this.add.text(width / 2, height / 2 + bh / 2 - 22, 'ТАП — ЗАКРЫТЬ', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#6a6a82'
    }).setOrigin(0.5).setDepth(102);

    const close = () => {
      if (this._closedReward) return;
      this._closedReward = true;
      this.time.delayedCall(30, () => {
        try { this.scene.restart(); } catch (e) {
          this.scene.start('Menu');
        }
      });
    };

    overlay.once('pointerup', close);
    this.time.delayedCall(6000, close);
  }

  createButton(x, y, label, color, callback, secondary = false, wide = false, bh = 48) {
    const bw = wide ? 300 : 280;
    if (window.createNiceButton) {
      return window.createNiceButton(this, x, y, label, callback, {
        w: bw,
        h: bh,
        color: color,
        secondary: secondary || (color !== 0x00e8c8 && color !== 0xffd166),
        fontSize: secondary ? (wide ? '14px' : '15px') : (wide ? '16px' : '17px'),
        depth: 10
      });
    }

    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: secondary ? '15px' : '18px',
      color: color === 0x00e8c8 || color === 0xffd166 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(bw, bh);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => { if (callback) callback(); });
    return btn;
  }
}

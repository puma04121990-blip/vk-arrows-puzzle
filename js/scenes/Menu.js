class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const L = window.pulseLayout(this);
    const { w, h, cx, wide, short, padT, padB, padX } = L;

    if (window.drawAppBackground) window.drawAppBackground(this, w, h);
    else this.add.rectangle(0, 0, w, h, 0x0b0b14).setOrigin(0);

    if (window.refreshLoginStreak) {
      try { window.refreshLoginStreak(); } catch (e) {}
    }

    const footerH = Math.max(44, Math.round(h * 0.075));
    const footerTop = h - footerH;

    this.add.text(cx, padT + 2, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial Black, Arial',
      fontSize: short ? '22px' : (wide ? '28px' : '26px'),
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5, 0);

    let greeting = 'Головоломка со стрелками';
    if (window.vkUser && window.vkUser.first_name) {
      greeting = 'Привет, ' + window.vkUser.first_name + '!';
    }
    const greet = this.add.text(cx, padT + (short ? 30 : 40), greeting, {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: short ? '13px' : '15px',
      color: '#8a8aa8',
      align: 'center',
      wordWrap: { width: w - padX * 2 }
    }).setOrigin(0.5, 0);

    const cloudTxt = window.getCloudStatusText ? window.getCloudStatusText() : '';
    const synced = window.cloudStatus && window.cloudStatus.synced;
    this._cloudLine = this.add.text(cx, greet.y + greet.height + 6, cloudTxt || '', {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '12px',
      color: synced ? '#2ec4a0' : '#5a5a72',
      align: 'center',
      wordWrap: { width: w - padX * 2 }
    }).setOrigin(0.5, 0).setDepth(40);

    let y = this._cloudLine.y + this._cloudLine.height + 10;

    const showLogo = !short && h >= 620;
    if (showLogo) {
      const circleR = wide ? 48 : 56;
      const circleY = y + circleR;
      const plate = this.add.graphics();
      plate.fillStyle(0x0e0e18, 1);
      plate.fillCircle(cx, circleY, circleR);
      plate.lineStyle(2, 0x2a2a40, 1);
      plate.strokeCircle(cx, circleY, circleR);
      if (this.textures.exists('menuLogo')) {
        const logo = this.add.image(cx, circleY, 'menuLogo');
        const diam = circleR * 2 - 4;
        logo.setDisplaySize(diam, diam).setDepth(2);
        const maskG = this.make.graphics({ x: 0, y: 0, add: false });
        maskG.fillStyle(0xffffff);
        maskG.fillCircle(cx, circleY, circleR - 2);
        logo.setMask(maskG.createGeometryMask());
      }
      y = circleY + circleR + 8;
    }

    const goal = window.getNextGoalText ? window.getNextGoalText() : '';
    if (goal) {
      const g = this.add.text(cx, y, goal, {
        fontFamily: 'Manrope, Arial, sans-serif',
        fontSize: '13px',
        color: '#ffd166',
        align: 'center',
        wordWrap: { width: w - padX * 2 }
      }).setOrigin(0.5, 0);
      y = g.y + g.height + 6;
    }

    const streak = window.getLoginStreak ? window.getLoginStreak() : 0;
    const hints = window.getHints ? window.getHints() : 0;
    const dailyBest = window.getDailyBest ? window.getDailyBest() : null;
    const dailyInfo = dailyBest && dailyBest.bestStars
      ? ('Ежедн. ' + dailyBest.bestStars + '★')
      : 'Ежедн. —';
    const stats = this.add.text(cx, y, 'Серия ' + streak + ' дн.  ·  ' + dailyInfo + '  ·  Подсказки: ' + hints, {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '12px',
      color: '#6a6a82',
      align: 'center',
      wordWrap: { width: w - padX * 2 }
    }).setOrigin(0.5, 0);
    y = stats.y + stats.height + 12;

    this.add.text(cx, h - padB, 'Играя, вы принимаете соглашение и политику', {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '11px',
      color: '#505068',
      align: 'center',
      wordWrap: { width: w - padX * 2 }
    }).setOrigin(0.5, 1);

    const maxLevel = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const hasProgress = maxLevel > 0;

    const primaries = [];
    if (window.canClaimDailyReward && window.canClaimDailyReward()) {
      primaries.push({
        label: 'НАГРАДА ДНЯ',
        color: 0xffd166,
        secondary: false,
        cb: () => this.onClaimReward()
      });
    }
    primaries.push({
      label: hasProgress ? 'ПРОДОЛЖИТЬ' : 'ИГРАТЬ',
      color: 0x00e8c8,
      secondary: false,
      cb: () => this.startCampaign(hasProgress ? Math.min(maxLevel, 49) : 0)
    });
    primaries.push({
      label: 'ЕЖЕДНЕВНЫЙ',
      color: 0x2a4a5a,
      secondary: true,
      cb: () => this.onDaily()
    });

    const secondaries = [
      { label: 'УРОВНИ', color: 0x222238, cb: () => this.scene.start('LevelsMap') },
      { label: 'СТИЛИ', color: 0x222238, cb: () => this.scene.start('Skins') },
      { label: 'МАГАЗИН', color: 0x3a2a18, cb: () => this.scene.start('Shop') },
      { label: 'НАСТРОЙКИ', color: 0x1e2f3a, cb: () => this.scene.start('Settings') },
      { label: 'ДОСТИЖЕНИЯ', color: 0x222238, cb: () => this.scene.start('Achievements') },
      { label: 'КАК ИГРАТЬ', color: 0x222238, cb: () => this.scene.start('Help') },
      { label: 'ПРАВОВАЯ', color: 0x1a1a28, cb: () => this.scene.start('Legal') }
    ];

    const zoneTop = y;
    const zoneBottom = footerTop - 10;
    const freeH = Math.max(80, zoneBottom - zoneTop);
    const cols = 2;
    const gapX = 10;
    const gapY = short ? 6 : 8;
    const innerW = Math.min(w - padX * 2, wide ? 560 : 400);
    const colW = (innerW - gapX) / cols;
    const startX = cx - innerW / 2 + colW / 2;

    const primH = short ? 40 : 46;
    const secH = short ? 36 : 40;
    const primBlock = primaries.length * (primH + gapY);
    const secRows = Math.ceil(secondaries.length / cols);
    const needed = primBlock + secRows * (secH + gapY);
    const scaleH = needed > freeH ? freeH / needed : 1;
    const pH = Math.max(34, Math.round(primH * scaleH));
    const sH = Math.max(32, Math.round(secH * scaleH));
    const gY = Math.max(4, Math.round(gapY * scaleH));

    let rowY = zoneTop + pH / 2;
    primaries.forEach((b) => {
      this.createButton(cx, Math.round(rowY), b.label, b.color, b.cb, !!b.secondary, innerW, pH);
      rowY += pH + gY;
    });

    secondaries.forEach((b, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const isLastOdd = i === secondaries.length - 1 && secondaries.length % 2 === 1;
      const bw = isLastOdd ? innerW : colW;
      const x = isLastOdd ? cx : startX + col * (colW + gapX);
      const by = rowY + row * (sH + gY);
      this.createButton(x, Math.round(by), b.label, b.color, b.cb, true, bw, sH);
    });

    if (!window.__pulseMenuRefreshed && window.pullCloudProgress) {
      window.__pulseMenuRefreshed = true;
      const prevMax = (window.gameProgress && window.gameProgress.maxLevel) || 0;
      window.pullCloudProgress().then(() => {
        const now = (window.gameProgress && window.gameProgress.maxLevel) || 0;
        if (now > prevMax && this.sys && this.sys.isActive()) {
          this.scene.restart();
          return;
        }
        if (this._cloudLine && this._cloudLine.active) {
          const ok = window.cloudStatus && window.cloudStatus.synced;
          this._cloudLine.setColor(ok ? '#2ec4a0' : '#5a5a72');
          this._cloudLine.setText(window.getCloudStatusText ? window.getCloudStatusText() : '');
        }
      }).catch(() => {});
    }
  }

  startCampaign(level) {
    try {
      if (window.startCampaignLevel) window.startCampaignLevel(level);
      else {
        window.gameData = window.gameData || {};
        window.gameData.mode = 'campaign';
        window.gameData.currentLevel = level;
      }
    } catch (e) {}
    this.scene.start('Game');
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
      this._busy = false;
      return;
    }
    if (!res || !res.ok) {
      this._busy = false;
      return;
    }

    const { w, h, cx } = window.pulseLayout(this);
    const rewards = res.rewards || [];
    const bw = Math.min(w - 40, 360);
    const bh = Math.min(h * 0.7, 180 + rewards.length * 28 + (res.nextItems && res.nextItems.length ? 56 : 20));

    const overlay = this.add.rectangle(cx, h / 2, w, h, 0x000000, 0.75)
      .setDepth(100)
      .setInteractive();
    const box = this.add.graphics().setDepth(101);
    box.fillStyle(0x161622, 1);
    box.fillRoundedRect(cx - bw / 2, h / 2 - bh / 2, bw, bh, 18);
    box.lineStyle(2, 0xffd166, 0.9);
    box.strokeRoundedRect(cx - bw / 2, h / 2 - bh / 2, bw, bh, 18);

    let y = h / 2 - bh / 2 + 28;
    this.add.text(cx, y, 'НАГРАДА ДНЯ', {
      fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffd166'
    }).setOrigin(0.5).setDepth(102);
    y += 28;
    this.add.text(cx, y, 'День ' + res.day + ' из 7 · серия ' + res.streak + ' дн.', {
      fontFamily: 'Arial', fontSize: '14px', color: '#8a8aa8'
    }).setOrigin(0.5).setDepth(102);
    y += 22;
    this.add.text(cx, y, res.title || 'Награда получена', {
      fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#00e8c8'
    }).setOrigin(0.5).setDepth(102);
    y += 26;
    rewards.forEach((r) => {
      this.add.text(cx, y, (r.text || ''), {
        fontFamily: 'Arial', fontSize: '15px', color: '#e8e8f8'
      }).setOrigin(0.5).setDepth(102);
      y += 24;
    });
    this.add.text(cx, h / 2 + bh / 2 - 22, 'ТАП — ЗАКРЫТЬ', {
      fontFamily: 'Arial', fontSize: '13px', color: '#6a6a82'
    }).setOrigin(0.5).setDepth(102);

    const close = () => {
      if (this._closedReward) return;
      this._closedReward = true;
      this.time.delayedCall(30, () => {
        try { this.scene.restart(); } catch (e) { this.scene.start('Menu'); }
      });
    };
    overlay.once('pointerup', close);
    this.time.delayedCall(6000, close);
  }

  createButton(x, y, label, color, callback, secondary, bw, bh) {
    if (window.createNiceButton) {
      return window.createNiceButton(this, x, y, label, callback, {
        w: bw,
        h: bh,
        color: color,
        secondary: secondary || (color !== 0x00e8c8 && color !== 0xffd166),
        fontSize: secondary ? '14px' : '16px',
        depth: 10
      });
    }
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: secondary ? '14px' : '16px',
      color: color === 0x00e8c8 || color === 0xffd166 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(bw, bh);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => { if (callback) callback(); });
    return btn;
  }
}

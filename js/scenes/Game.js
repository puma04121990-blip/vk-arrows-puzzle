class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init() {
    this.isDaily = !!(window.gameData && window.gameData.mode === 'daily');
    if (this.isDaily && window.gameData.dailyLevel) {
      this.levelIndex = -1;
      this.levelData = window.gameData.dailyLevel;
    } else {
      this.isDaily = false;
      this.levelIndex = window.gameData.currentLevel || 0;
      this.levelData = LEVELS[this.levelIndex] || LEVELS[0];
      window.gameData.retryLevelIndex = Number.isInteger(window.gameData.retryLevelIndex)
        ? window.gameData.retryLevelIndex : this.levelIndex;
      if (window.gameData.retryLevelIndex !== this.levelIndex) {
        window.gameData.retryLevelIndex = this.levelIndex;
        window.gameData.levelRetries = 0;
      }
      if (!Number.isInteger(window.gameData.levelRetries) || window.gameData.levelRetries < 0) {
        window.gameData.levelRetries = 0;
      }
    }
    this.arrows = [];
    this.wallSet = new Set();
    this.cellSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.moves = 0;
    this.mistakes = 0;
    this.maxMistakes = 3;
    this.remaining = 0;
    this.completed = false;
    this.failed = false;
    this.timeLeft = 0;
    this.timeLimit = 0;
    this.elapsed = 0;
    this.skinId = (window.gameProgress && window.gameProgress.skin) || 'neon';
    this.combo = 0;
    this.bestCombo = 0;
    this.chainTarget = Math.max(3, Math.min(7, 3 + Math.floor(this.levelIndex / 10)));
    this.comboWindow = 3.4;
    this.lastSafeMoveAt = -999;
    this.runStartedAt = 0;
    this.coachStep = 0;
    this.coachTarget = null;
    this.coachEnabled = false;
  }

  calcTimeLimit() {
    const size = this.levelData.size;
    const count = this.levelData.arrows.length;
    if (this.isDaily) {
      return Math.max(180, Math.min(600, 30 + count * 4 + size * 4));
    }
    let sec = 25 + count * 4 + size * 3 + Math.floor(this.levelIndex * 0.4);
    return Math.max(30, Math.min(sec, 180));
  }

  create() {
    const { width, height } = this.scale;
    this.skinId = (window.gameProgress && window.gameProgress.skin) || 'neon';
    this.wallSet = new Set();
    (this.levelData.walls || []).forEach(w => this.wallSet.add(String(w.x) + ',' + String(w.y)));
    if (window.drawAppBackground) window.drawAppBackground(this, width, height);
    else this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const wide = width >= height;
    const headerY = wide ? 22 : 24;
    const statsY = wide ? 50 : 56;
    const headerLabel = this.isDaily ? 'ЕЖЕДНЕВНЫЙ' : `УРОВЕНЬ ${this.levelIndex + 1}`;
    this.compactComboY = statsY;
    this.add.text(width / 2, headerY, headerLabel, {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif',
      fontSize: wide ? '20px' : '22px',
      color: '#7ff6e6'
    }).setOrigin(0.5);

    this.timeLimit = this.calcTimeLimit();
    this.timeLeft = this.timeLimit;
    this.runStartedAt = this.time.now;

    if (window.createHudChip) {
      const chipFont = wide ? '14px' : '13px';
      const chipPad = { padX: wide ? 12 : 10, padY: wide ? 7 : 5 };
      this.mistakesChip = window.createHudChip(this, width / 2 - (wide ? 78 : 120), statsY, `Ошибки ${this.maxMistakes}`, Object.assign({ fontSize: chipFont, color: '#9a9ab4' }, chipPad));
      this.timerChip = window.createHudChip(this, width / 2 + (wide ? 78 : 120), statsY, this.formatTime(this.timeLeft), Object.assign({ fontSize: chipFont, color: '#00e8c8', fontFamily: 'Manrope, Arial Black, Arial, sans-serif' }, chipPad));
      this._mistakesStr = `Ошибки 0/${this.maxMistakes}`;
      this.mistakesChip.setLabel(this._mistakesStr, '#9a9ab4');
      this._mistakesColor = '#9a9ab4';
      this._timerStr = this.formatTime(this.timeLeft);
      this._timerColor = '#00e8c8';
      this.movesText = {
        setText: (t) => { this._mistakesStr = t.replace('Ошибки: ', 'Ошибки '); if (this.mistakesChip) this.mistakesChip.setLabel(this._mistakesStr, this._mistakesColor); },
        setColor: (c) => { this._mistakesColor = c; if (this.mistakesChip) this.mistakesChip.setLabel(this._mistakesStr, c); }
      };
      this.timerText = {
        setText: (t) => { this._timerStr = t; if (this.timerChip) this.timerChip.setLabel(t, this._timerColor); },
        setColor: (c) => { this._timerColor = c; if (this.timerChip) this.timerChip.setLabel(this._timerStr, c); }
      };
      if (!wide) {
        this.comboChip = window.createHudChip(this, width / 2, statsY, 'Цепочка 0', Object.assign({ fontSize: chipFont, color: '#ffd166', fill: 0x151524, stroke: 0x4a3d2a }, chipPad));
        const gap = 8;
        const total = this.mistakesChip.width + this.comboChip.width + this.timerChip.width + gap * 2;
        let cx = width / 2 - total / 2;
        this.mistakesChip.x = cx + this.mistakesChip.width / 2;
        cx += this.mistakesChip.width + gap;
        this.comboChip.x = cx + this.comboChip.width / 2;
        cx += this.comboChip.width + gap;
        this.timerChip.x = cx + this.timerChip.width / 2;
      }
    } else {
      this.movesText = this.add.text(width / 2 - 90, statsY, `Ошибки: 0/${this.maxMistakes}`, { fontFamily: 'Arial', fontSize: '17px', color: '#6e6e8a' }).setOrigin(1, 0.5);
      this.timerText = this.add.text(width / 2 + 90, statsY, this.formatTime(this.timeLeft), { fontFamily: 'Arial Black, Arial', fontSize: '19px', color: '#00e8c8' }).setOrigin(0, 0.5);
    }

    const size = this.levelData.size;
    const topPad = wide ? 96 : 80;
    const bottomPad = wide ? 78 : 70;
    const sideMargin = wide ? 36 : 12;
    const panelPad = wide ? 18 : 10;
    const maxGridW = width - sideMargin * 2 - panelPad * 2;
    const maxGridH = height - topPad - bottomPad - panelPad * 2;
    this.cellSize = Math.max(28, Math.floor(Math.min(maxGridW / size, maxGridH / size)));
    const gridW = this.cellSize * size;
    const gridH = this.cellSize * size;
    const panelW = gridW + panelPad * 2;
    const panelH = gridH + panelPad * 2;
    const panelX = Math.round((width - panelW) / 2);
    const slack = height - topPad - bottomPad - panelH;
    const panelY = Math.round(topPad + Math.max(4, slack * 0.28));

    const panel = this.add.graphics();
    panel.fillStyle(0x00e8c8, 0.1);
    panel.fillRoundedRect(panelX - 5, panelY - 5, panelW + 10, panelH + 10, 18);
    panel.fillStyle(0x10101c, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    panel.lineStyle(2, 0x00e8c8, 0.4);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);
    panel.lineStyle(1, 0x2a2a48, 0.9);
    panel.strokeRoundedRect(panelX + 3, panelY + 3, panelW - 6, panelH - 6, 11);

    this.offsetX = panelX + panelPad;
    this.offsetY = panelY + panelPad;
    this.boardPanelX = panelX;
    this.boardPanelY = panelY;
    this.boardPanelW = panelW;
    this.boardPanelH = panelH;

    this.actionDockY = panelY + panelH + 12;
    if (!wide) {
      const dockH = 72;
      const dock = this.add.graphics();
      dock.fillStyle(0x141422, 0.98);
      dock.fillRoundedRect(12, this.actionDockY, width - 24, dockH, 18);
      dock.lineStyle(1, 0x32324c, 1);
      dock.strokeRoundedRect(12, this.actionDockY, width - 24, dockH, 18);
    }

    this.drawGrid(size);
    this.drawWalls();
    this.createArrows();
    this.createUI();
    if (wide) this.createLandscapeDashboard();
    this.initAudio();
    if (window.startAmbientMusic && window.isMusicOn && window.isMusicOn()) window.startAmbientMusic();
    this.startTimer();
    this.time.delayedCall(350, () => this.startCoachIfNeeded());
  }

  formatTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}`;
  }

  updateMistakesUI() {
    const shown = Math.min(this.mistakes, this.maxMistakes);
    const label = `Ошибки ${shown}/${this.maxMistakes}`;
    let color = '#9a9ab4';
    if (shown >= this.maxMistakes - 1) color = '#ff6b6b';
    else if (shown >= 1) color = '#ffd166';
    if (this.mistakesChip && this.mistakesChip.setLabel) {
      this.mistakesChip.setLabel(label, color);
      if (this.layoutPortraitChips) this.layoutPortraitChips();
    } else if (this.movesText) { this.movesText.setText(label); if (this.movesText.setColor) this.movesText.setColor(color); }
    if (this.mistakesSideText) { this.mistakesSideText.setText(shown + '/' + this.maxMistakes); this.mistakesSideText.setColor(color); }
  }

  startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        if (this.completed || this.failed) return;
        this.timeLeft -= 0.2;
        this.elapsed = Math.max(0, (this.time.now - this.runStartedAt) / 1000);
        if (this.combo > 0 && this.elapsed - this.lastSafeMoveAt > this.comboWindow) {
          this.combo = 0;
          this.updateComboUI();
        }
        if (this.timeLeft <= 10) this.timerText.setColor('#ff6b6b');
        else if (this.timeLeft <= 20) this.timerText.setColor('#ffd166');
        else this.timerText.setColor('#00e8c8');
        this.timerText.setText(this.formatTime(this.timeLeft));
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.timerText.setText('0');
          this.triggerFail('ВРЕМЯ ВЫШЛО');
        }
      }
    });
  }

  triggerFail(title) {
    if (this.failed || this.completed) return;
    this.failed = true;
    this.completed = true;
    if (this.timerEvent) try { this.timerEvent.remove(false); } catch (e) {}
    this.playFailSound();
    this.showFailOverlay(title || 'ПРОВАЛ');
  }

  showFailOverlay(titleText) {
    const { width, height } = this.scale;
    const boxW = Math.min(width - 48, 400);
    const boxH = 260;
    const bx = width / 2 - boxW / 2;
    const by = height / 2 - boxH / 2;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72);
    dim.setDepth(100).setInteractive();
    const box = this.add.graphics();
    box.fillStyle(0x1a1a28, 1);
    box.fillRoundedRect(bx, by, boxW, boxH, 24);
    box.lineStyle(2, 0xff6b6b, 0.8);
    box.strokeRoundedRect(bx, by, boxW, boxH, 24);
    box.setDepth(101);
    this.add.text(width / 2, height / 2 - 75, titleText, {
      fontFamily: 'Arial Black', fontSize: titleText.length > 14 ? '22px' : '26px',
      color: '#ff6b6b', align: 'center', wordWrap: { width: boxW - 40 }
    }).setOrigin(0.5).setDepth(102);
    this.add.text(width / 2, height / 2 - 20, 'Попробуй ещё раз', {
      fontFamily: 'Arial', fontSize: '18px', color: '#9a9ab4'
    }).setOrigin(0.5).setDepth(102);
    const again = this.add.text(width / 2, height / 2 + 45, '↺ ЗАНОВО', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#0b0b14',
      backgroundColor: '#00e8c8', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    again.on('pointerdown', () => this.restartAfterFailure());
    const menu = this.add.text(width / 2, height / 2 + 100, 'МЕНЮ', {
      fontFamily: 'Arial', fontSize: '18px', color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('Menu'));
  }

  drawGrid(size) {
    const g = this.add.graphics();
    const cell = this.cellSize;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.wallSet.has(x + ',' + y)) continue;
        const px = this.offsetX + x * cell;
        const py = this.offsetY + y * cell;
        const odd = (x + y) % 2 === 0;
        const r = Math.max(5, cell * 0.16);
        g.fillStyle(odd ? 0x1e1e36 : 0x17172a, 1);
        g.fillRoundedRect(px + 3, py + 3, cell - 6, cell - 6, r);
        g.fillStyle(0xffffff, 0.04);
        g.fillRoundedRect(px + 5, py + 5, cell - 10, Math.max(4, (cell - 6) * 0.28), r * 0.6);
        g.fillStyle(0x4a4a6a, 0.55);
        g.fillCircle(px + cell / 2, py + cell / 2, Math.max(2, cell * 0.045));
      }
    }
  }

  drawWalls() {
    const walls = this.levelData.walls || [];
    if (!walls.length) return;
    const g = this.add.graphics();
    const pad = Math.max(4, this.cellSize * 0.12);
    const s = this.cellSize - pad * 2;
    walls.forEach(w => {
      const x = this.offsetX + w.x * this.cellSize + pad;
      const y = this.offsetY + w.y * this.cellSize + pad;
      if (window.drawWallIcon) window.drawWallIcon(g, x, y, s);
      else {
        g.fillStyle(0x3a3a52, 1);
        g.fillRoundedRect(x, y, s, s, 8);
        g.lineStyle(2, 0x7a7a9a, 1);
        g.strokeRoundedRect(x, y, s, s, 8);
      }
    });
  }

  lockArrowColor(lockColor, fallback) {
    const meta = (window.LOCK_COLOR_META || [])[lockColor != null ? lockColor : 0];
    return meta ? meta.hex : fallback;
  }

  createArrows() {
    this.arrows = [];
    this.remaining = this.levelData.arrows.length;
    const palette = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0, 0xf72585, 0x2ec4b6, 0xff9f1c, 0x9b5de5];
    const badgeSize = Math.max(11, Math.floor(this.cellSize * 0.14));
    const gridTop = this.offsetY + 4;
    const gridBottom = this.offsetY + this.levelData.size * this.cellSize - 4;
    const gridLeft = this.offsetX + 4;
    const gridRight = this.offsetX + this.levelData.size * this.cellSize - 4;
    const aa = 2;
    const display = Math.ceil(this.cellSize * 1.55);
    const texSize = display * aa;

    this.levelData.arrows.forEach((a, i) => {
      let color = palette[i % palette.length];
      if (a.lockId != null || a.keyId != null) color = this.lockArrowColor(a.lockColor, color);
      const cx = this.offsetX + a.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + a.y * this.cellSize + this.cellSize / 2;

      const texKey = 'arw_' + this.skinId + '_' + a.dir + '_' + (color >>> 0).toString(16) + '_' + display + 'x' + aa;
      if (!this.textures.exists(texKey)) {
        const tmp = this.make.graphics({ x: 0, y: 0, add: false });
        const savedCell = this.cellSize;
        this.cellSize = savedCell * aa;
        this.drawArrow(tmp, a.dir, color);
        this.cellSize = savedCell;
        const rt = this.make.renderTexture({ width: texSize, height: texSize, add: false });
        rt.draw(tmp, texSize / 2, texSize / 2);
        rt.saveTexture(texKey);
        tmp.destroy();
        rt.destroy();
        const tex = this.textures.get(texKey);
        if (tex && tex.setFilter) {
          const linear = (Phaser.Textures && Phaser.Textures.FilterMode && Phaser.Textures.FilterMode.LINEAR) || 1;
          tex.setFilter(linear);
        }
      }
      const g = this.add.image(cx, cy, texKey).setDisplaySize(display, display).setDepth(5);

      let badge = null, rotBadge = null;
      const iconSize = Math.max(10, Math.floor(this.cellSize * 0.16));
      if (a.lockId != null || a.keyId != null) {
        let bx = Math.max(gridLeft, Math.min(gridRight, cx + this.cellSize * 0.28));
        let by = Math.max(gridTop, Math.min(gridBottom, cy - this.cellSize * 0.32));
        const badgeG = this.add.graphics().setDepth(10);
        badgeG.setPosition(bx, by);
        if (a.lockId != null && window.drawLockIcon) { window.drawLockIcon(badgeG, color, iconSize); badge = badgeG; }
        else if (a.keyId != null && window.drawKeyIcon) { window.drawKeyIcon(badgeG, color, iconSize); badge = badgeG; }
        else badge = this.add.text(bx, by, a.lockId != null ? '🔒' : '🔑', { fontSize: badgeSize + 'px' }).setOrigin(0.5).setDepth(10);
      }
      if (a.rotates) {
        let rx = Math.max(gridLeft, Math.min(gridRight, cx - this.cellSize * 0.28));
        let ry = Math.max(gridTop, Math.min(gridBottom, cy - this.cellSize * 0.32));
        if (window.drawRotateIcon) {
          const rotG = this.add.graphics().setDepth(10);
          rotG.setPosition(rx, ry);
          window.drawRotateIcon(rotG, 0xffe066, iconSize);
          rotBadge = rotG;
        } else {
          rotBadge = this.add.text(rx, ry, '↻', { fontSize: Math.max(12, Math.floor(this.cellSize * 0.2)) + 'px', color: '#ffe066' }).setOrigin(0.5).setDepth(10);
        }
      }

      const zone = this.add.zone(cx, cy, this.cellSize * 0.95, this.cellSize * 0.95);
      zone.setOrigin(0.5).setInteractive();
      const data = {
        x: a.x, y: a.y, dir: a.dir, color: color,
        graphics: g, zone: zone, badge: badge, rotBadge: rotBadge, removed: false,
        rotates: !!a.rotates, rotated: false,
        lockId: a.lockId != null ? a.lockId : null,
        keyId: a.keyId != null ? a.keyId : null,
        lockColor: a.lockColor != null ? a.lockColor : null,
        baseAngle: 0
      };
      zone.on('pointerdown', () => {
        if (data.removed || this.completed || this.failed) return;
        this.unlockAudio();
        this.handleArrowTap(data);
      });
      this.arrows.push(data);
    });
  }

  drawArrow(g, dir, color) {
    if (window.drawArrowSkin) { window.drawArrowSkin(g, dir, color, this.cellSize, this.skinId); return; }
    g.clear();
    const s = this.cellSize * 0.33;
    g.fillStyle(color, 0.16); this._shape(g, dir, s * 1.35);
    g.fillStyle(color, 1); this._shape(g, dir, s);
    g.fillStyle(0xffffff, 0.2); this._shape(g, dir, s * 0.45);
  }

  _shape(g, dir, s) {
    if (dir === 0) {
      g.fillRoundedRect(-s * 0.2, -s * 0.1, s * 0.4, s * 0.8, 4);
      g.fillTriangle(0, -s * 1.0, -s * 0.55, -s * 0.1, s * 0.55, -s * 0.1);
    } else if (dir === 1) {
      g.fillRoundedRect(-s * 0.66, -s * 0.2, s * 0.8, s * 0.4, 4);
      g.fillTriangle(s * 1.0, 0, s * 0.1, -s * 0.55, s * 0.1, s * 0.55);
    } else if (dir === 2) {
      g.fillRoundedRect(-s * 0.2, -s * 0.7, s * 0.4, s * 0.8, 4);
      g.fillTriangle(0, s * 1.0, -s * 0.55, s * 0.1, s * 0.55, s * 0.1);
    } else {
      g.fillRoundedRect(-s * 0.14, -s * 0.2, s * 0.8, s * 0.4, 4);
      g.fillTriangle(-s * 1.0, 0, -s * 0.1, -s * 0.55, -s * 0.1, s * 0.55);
    }
  }

  isLocked(data) {
    if (data.lockId == null) return false;
    for (let i = 0; i < this.arrows.length; i++) {
      if (!this.arrows[i].removed && this.arrows[i].keyId === data.lockId) return true;
    }
    return false;
  }

  handleArrowTap(data) {
    if (data.removed || this.completed || this.failed) return;
    if (this.coachEnabled && this.coachTarget && data !== this.coachTarget) {
      this.showCoachPrompt('Сначала нажми на подсвеченную стрелку');
      return;
    }
    if (this.isLocked(data)) {
      this.combo = 0; this.updateComboUI();
      this.mistakes++; this.updateMistakesUI(); this.playFailSound(); this.failFeedback(data);
      if (this.mistakes >= this.maxMistakes) this.triggerFail('СЛИШКОМ МНОГО\nОШИБОК');
      return;
    }
    if (data.rotates && !data.rotated) {
      data.rotated = true;
      data.dir = (data.dir + 1) % 4;
      try { this.tweens.killTweensOf(data.graphics); } catch (e) {}
      data.graphics.setAlpha(1); data.graphics.setScale(1);
      data.baseAngle = (data.baseAngle || 0) + 90;
      data.graphics.angle = data.baseAngle;
      this.tweens.add({ targets: data.graphics, scale: 1.12, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
      if (data.rotBadge) { data.rotBadge.setAlpha(0.35); data.rotBadge.setScale(0.85); }
      this.playTone(400, 0.05, 'sine', 0.08);
      this.time.delayedCall(40, () => this.playTone(520, 0.05, 'sine', 0.08));
      if (this.coachEnabled) this.focusCoachTarget(data);
      return;
    }
    if (this.canEscape(data)) { this.playSuccessSound(); this.flyAway(data); }
    else {
      this.combo = 0; this.updateComboUI();
      this.mistakes++; this.updateMistakesUI(); this.playFailSound(); this.failFeedback(data);
      this.spawnImpactBurst(data.graphics ? data.graphics.x : 0, data.graphics ? data.graphics.y : 0, 0xff6b6b);
      if (this.cameras && this.cameras.main) this.cameras.main.shake(90, 0.0025);
      if (this.mistakes >= this.maxMistakes) this.triggerFail('СЛИШКОМ МНОГО\nОШИБОК');
    }
  }

  startCoachIfNeeded() {
    if (this.isDaily || this.levelIndex < 0 || this.levelIndex > 2) return;
    const key = 'arrow_pulse_coach_level_' + this.levelIndex;
    try { if (localStorage.getItem(key) === '1') return; } catch (e) {}
    const target = (this.arrows || []).find((a) => !a.removed && !this.isLocked(a) && (a.rotates && !a.rotated || this.canEscape(a)));
    if (!target) return;
    this.coachEnabled = true;
    this.coachKey = key;
    this.coachTarget = target;
    const text = this.levelIndex === 0
      ? 'СТАРТ: нажми на подсвеченную стрелку'
      : 'Ищи стрелку со свободным путём';
    this.showCoachPrompt(text, true);
    this.focusCoachTarget(target);
  }

  showCoachPrompt(text, persistent) {
    const { width, height } = this.scale;
    const wide = width >= height;
    if (!this.coachPrompt || !this.coachPrompt.active) {
      const promptY = height - (wide ? 82 : 122);
      this.coachPrompt = this.add.text(width / 2, promptY, text, {
        fontFamily: 'Manrope, Arial Black, Arial, sans-serif', fontSize: width >= height ? '15px' : '16px',
        color: '#0b0b14', backgroundColor: '#ffd166', padding: { x: 13, y: 8 }, align: 'center'
      }).setOrigin(0.5).setDepth(95);
    } else this.coachPrompt.setText(text);
    if (!persistent) {
      this.tweens.killTweensOf(this.coachPrompt);
      this.coachPrompt.setAlpha(1);
      this.tweens.add({ targets: this.coachPrompt, alpha: 0.15, delay: 900, duration: 280 });
    }
  }

  focusCoachTarget(target) {
    if (!target || !target.graphics) return;
    if (this.coachRing) { try { this.coachRing.destroy(); } catch (e) {} }
    const ring = this.add.circle(target.graphics.x, target.graphics.y, this.cellSize * 0.48, 0xffd166, 0);
    ring.setStrokeStyle(Math.max(2, this.cellSize * 0.06), 0xffd166, 0.95).setDepth(16);
    this.coachRing = ring;
    this.tweens.add({ targets: ring, scale: 1.2, alpha: 0.2, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  advanceCoach() {
    this.coachStep++;
    if (this.coachStep >= 2) {
      this.coachEnabled = false;
      this.coachTarget = null;
      try { localStorage.setItem(this.coachKey, '1'); } catch (e) {}
      if (this.coachRing) { try { this.coachRing.destroy(); } catch (e) {} this.coachRing = null; }
      this.showCoachPrompt('Отлично! Теперь решай уровень сам');
      return;
    }
    const next = (this.arrows || []).find((a) => !a.removed && !this.isLocked(a) && (a.rotates && !a.rotated || this.canEscape(a)));
    if (!next) { this.advanceCoach(); return; }
    this.coachTarget = next;
    this.showCoachPrompt('Ещё один безопасный ход');
    this.focusCoachTarget(next);
  }

  layoutPortraitChips() {
    if (this.scale.width >= this.scale.height) return;
    if (!this.mistakesChip || !this.comboChip || !this.timerChip) return;
    const gap = 8;
    const w = this.scale.width;
    const total = this.mistakesChip.width + this.comboChip.width + this.timerChip.width + gap * 2;
    let x = w / 2 - total / 2;
    this.mistakesChip.x = x + this.mistakesChip.width / 2;
    x += this.mistakesChip.width + gap;
    this.comboChip.x = x + this.comboChip.width / 2;
    x += this.comboChip.width + gap;
    this.timerChip.x = x + this.timerChip.width / 2;
  }

  updateComboUI() {
    const goal = this.chainTarget || 3;
    const mastered = this.combo >= goal;
    const compact = this.scale.width < this.scale.height;
    const label = mastered
      ? (compact ? 'Мастерство ' + this.combo : 'МАСТЕРСТВО · ' + this.combo)
      : (compact ? 'Цепочка ' + this.combo + '/' + goal : 'ЦЕПОЧКА · ' + this.combo + '/' + goal);
    if (this.comboChip && this.comboChip.setLabel) {
      this.comboChip.setLabel(label, mastered ? '#00e8c8' : '#ffd166');
      if (this.layoutPortraitChips) this.layoutPortraitChips();
    }
    if (this.comboChip && mastered && this.comboChip.setScale) this.tweens.add({ targets: this.comboChip, scale: 1.08, duration: 80, yoyo: true });
    if (this.comboSideText) {
      this.comboSideText.setText(this.combo + '/' + goal);
      this.comboSideText.setColor(mastered ? '#00e8c8' : '#ffd166');
      if (this.combo > 0) this.tweens.add({ targets: this.comboSideText, scale: 1.12, duration: 90, yoyo: true });
    }
  }

  createLandscapeDashboard() {
    const { width, height } = this.scale;
    const panelW = 150;
    const panelH = 148;
    const makePanel = (x, title, accent) => {
      const g = this.add.graphics().setDepth(18);
      g.fillStyle(0x11111f, 0.92);
      g.fillRoundedRect(x - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
      g.lineStyle(1, accent, 0.45);
      g.strokeRoundedRect(x - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
      this.add.text(x, height / 2 - 48, title, { fontFamily: 'Manrope, Arial, sans-serif', fontSize: '12px', color: '#8a8aa8' }).setOrigin(0.5).setDepth(19);
      return x;
    };
    const gutter = 18;
    const leftX = this.boardPanelX - panelW / 2 - gutter;
    const rightX = this.boardPanelX + this.boardPanelW + panelW / 2 + gutter;
    // On narrow landscape canvases there is no safe external area; do not cover the board.
    if (leftX - panelW / 2 < 12 || rightX + panelW / 2 > width - 12) {
      if (!this.comboChip && window.createHudChip) {
        this.comboChip = window.createHudChip(this, width / 2, this.compactComboY || 78, 'ЦЕПОЧКА · 0', {
          fontSize: '12px', color: '#ffd166', fill: 0x151524, stroke: 0x4a3d2a, depth: 20
        });
      }
      return;
    }
    makePanel(leftX, 'ЦЕПОЧКА', 0xffd166);
    this.comboSideText = this.add.text(leftX, height / 2 - 4, '0/' + (this.chainTarget || 3), {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif', fontSize: '30px', color: '#ffd166'
    }).setOrigin(0.5).setDepth(19);
    this.add.text(leftX, height / 2 + 38, 'Темп = +время', { fontFamily: 'Manrope, Arial, sans-serif', fontSize: '11px', color: '#6a6a82' }).setOrigin(0.5).setDepth(19);
    makePanel(rightX, 'ОШИБКИ', 0xff6b6b);
    this.mistakesSideText = this.add.text(rightX, height / 2 - 4, '0/' + this.maxMistakes, {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif', fontSize: '30px', color: '#9a9ab4'
    }).setOrigin(0.5).setDepth(19);
    this.add.text(rightX, height / 2 + 38, 'Ошибки уменьшают ★', { fontFamily: 'Manrope, Arial, sans-serif', fontSize: '11px', color: '#6a6a82' }).setOrigin(0.5).setDepth(19);
  }

  canEscape(data) {
    const size = this.levelData.size;
    let cx = data.x, cy = data.y;
    while (true) {
      if (data.dir === 0) cy -= 1;
      else if (data.dir === 1) cx += 1;
      else if (data.dir === 2) cy += 1;
      else cx -= 1;
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;
      if (this.wallSet.has(cx + ',' + cy)) return false;
      for (let i = 0; i < this.arrows.length; i++) {
        const a = this.arrows[i];
        if (!a.removed && a.x === cx && a.y === cy) return false;
      }
    }
  }

  flyAway(data) {
    if (data.removed) return;
    data.removed = true;
    if (this.coachEnabled && data === this.coachTarget) this.advanceCoach();
    if (this.elapsed - this.lastSafeMoveAt > this.comboWindow) this.combo = 0;
    this.combo++;
    this.lastSafeMoveAt = this.elapsed;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.updateComboUI();
    if (this.combo >= (this.chainTarget || 3)) {
      if (this.cameras && this.cameras.main) this.cameras.main.shake(120, Math.min(0.004, 0.0015 + this.combo * 0.00025));
      this.timeLeft = Math.min(this.timeLimit, this.timeLeft + 1.5);
      this.playTone(760 + Math.min(220, this.combo * 12), 0.08, 'triangle', 0.07);
    }
    this.remaining--;
    this.moves++;
    data.zone.disableInteractive();
    try { this.tweens.killTweensOf(data.graphics); } catch (e) {}
    const g = data.graphics;
    g.setScale(1); g.setAlpha(1);

    if (data.keyId != null) {
      for (let i = 0; i < this.arrows.length; i++) {
        const a = this.arrows[i];
        if (!a.removed && a.lockId === data.keyId && a.badge) {
          this.tweens.add({
            targets: a.badge, alpha: 0, scale: 1.4, duration: 160,
            onComplete: () => { try { a.badge.destroy(); } catch (e) {} a.badge = null; }
          });
        }
      }
    }

    let dx = 0, dy = 0;
    if (data.dir === 0) dy = -1;
    else if (data.dir === 1) dx = 1;
    else if (data.dir === 2) dy = 1;
    else dx = -1;

    const gx = g.x, gy = g.y;
    this.spawnImpactBurst(gx, gy, data.color);
    const skin = this.skinId || 'neon';
    const dist = Math.max(this.scale.width, this.scale.height) * 1.15;
    const baseAng = data.baseAngle || 0;

    const finish = () => {
      try {
        g.destroy(); data.zone.destroy();
        if (data.badge) data.badge.destroy();
        if (data.rotBadge) data.rotBadge.destroy();
      } catch (e) {}
      if (this.remaining <= 0 && !this.completed && !this.failed) {
        this.completed = true;
        if (this.timerEvent) try { this.timerEvent.remove(false); } catch (e) {}
        this.time.delayedCall(50, () => this.levelComplete());
      }
    };

    this.spawnExitTrail(gx, gy, dx, dy, data.color, skin);

    if (skin === 'block') {
      this.tweens.add({
        targets: g, scaleX: 1.35, scaleY: 0.55, duration: 70, yoyo: true,
        onComplete: () => {
          this.tweens.add({ targets: g, x: gx + dx * dist, y: gy + dy * dist,
            angle: baseAng + (dx !== 0 ? 0 : (dy < 0 ? -20 : 20)), alpha: 0, scale: 0.3,
            duration: 280, ease: 'Back.easeIn', onComplete: finish });
        }
      });
    } else if (skin === 'triangle') {
      this.tweens.add({ targets: g, x: gx + dx * dist, y: gy + dy * dist,
        angle: baseAng + 360, alpha: 0, scale: 0.2, duration: 300, ease: 'Cubic.easeIn', onComplete: finish });
    } else if (skin === 'chevron') {
      this.tweens.add({
        targets: g, x: gx + dx * 36, y: gy + dy * 36, scale: 1.12, duration: 55,
        onComplete: () => {
          this.tweens.add({ targets: g, x: gx + dx * dist, y: gy + dy * dist,
            alpha: 0, scaleX: 1.55, scaleY: 0.4, duration: 230, ease: 'Expo.easeIn', onComplete: finish });
        }
      });
    } else if (skin === 'thin') {
      this.tweens.add({
        targets: g, scaleX: dx !== 0 ? 1.7 : 0.55, scaleY: dy !== 0 ? 1.7 : 0.55, duration: 70,
        onComplete: () => {
          this.tweens.add({ targets: g, x: gx + dx * dist, y: gy + dy * dist,
            alpha: 0, scale: 0.15, duration: 210, ease: 'Quad.easeIn', onComplete: finish });
        }
      });
    } else if (skin === 'feather') {
      this.tweens.add({
        targets: g, x: gx + dx * dist * 0.35 + (dy !== 0 ? 28 : 0),
        y: gy + dy * dist * 0.35 + (dx !== 0 ? -18 : 0), angle: baseAng + 22, duration: 130, ease: 'Sine.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: g, x: gx + dx * dist, y: gy + dy * dist,
            angle: baseAng - 12, alpha: 0, scale: 0.35, duration: 250, ease: 'Cubic.easeIn', onComplete: finish });
        }
      });
    } else {
      this.tweens.add({
        targets: g, scale: 1.22, duration: 45, yoyo: true,
        onComplete: () => {
          this.tweens.add({ targets: g, x: gx + dx * dist, y: gy + dy * dist,
            alpha: 0, scale: 0.22, angle: baseAng + (dx !== 0 ? dx * 12 : 0),
            duration: 280, ease: 'Cubic.easeIn', onComplete: finish });
        }
      });
    }

    const flyBadge = (obj) => {
      if (!obj) return;
      this.tweens.add({ targets: obj, x: obj.x + dx * dist, y: obj.y + dy * dist, alpha: 0, scale: 0.25, duration: 240 });
    };
    flyBadge(data.badge);
    flyBadge(data.rotBadge);
  }

  spawnImpactBurst(x, y, color) {
    const count = 4;
    const reach = this.cellSize * 0.42;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + 0.4;
      const dot = this.add.circle(x, y, Math.max(2, this.cellSize * 0.05), color, 0.85).setDepth(30);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * reach,
        y: y + Math.sin(angle) * reach,
        alpha: 0, scale: 0.2, duration: 180, ease: 'Cubic.easeOut',
        onComplete: () => { try { dot.destroy(); } catch (e) {} }
      });
    }
  }

  spawnExitTrail(x, y, dx, dy, color, skin) {
    const n = 2;
    for (let i = 0; i < n; i++) {
      const dot = this.add.circle(x - dx * i * 6, y - dy * i * 6, 3.5 - i, color, 0.75);
      dot.setDepth(20);
      this.tweens.add({
        targets: dot, x: dot.x + dx * (40 + i * 16), y: dot.y + dy * (40 + i * 16),
        alpha: 0, scale: 0, duration: 160, ease: 'Cubic.easeOut',
        onComplete: () => { try { dot.destroy(); } catch (e) {} }
      });
    }
  }

  failFeedback(data) {
    const g = data.graphics;
    if (g && g.setTint) {
      g.setTint(0xff4444);
      this.time.delayedCall(100, () => { if (!data.removed && g.clearTint) g.clearTint(); });
    }
  }

  restartAfterFailure() {
    if (this.isDaily) {
      this.scene.restart();
      return;
    }
    const data = window.gameData || (window.gameData = {});
    if (data.retryLevelIndex !== this.levelIndex) {
      data.retryLevelIndex = this.levelIndex;
      data.levelRetries = 0;
    }
    data.levelRetries = Math.max(0, data.levelRetries | 0) + 1;
    this.scene.restart();
  }

  calcStars() {
    const retries = (!this.isDaily && window.gameData && window.gameData.retryLevelIndex === this.levelIndex)
      ? Math.max(0, window.gameData.levelRetries | 0) : 0;
    // Every failed replay and every current-run mistake costs one star.
    return Math.max(0, 3 - retries - Math.max(0, this.mistakes | 0));
  }

  levelComplete() {
    if (this.scene.isActive('Win') || this.failed) return;
    window.gameData.moves = this.moves;
    window.gameData.mistakes = this.mistakes;
    window.gameData.stars = this.calcStars();
    window.gameData.timeLeft = Math.max(0, this.timeLeft);
    window.gameData.timeLimit = this.timeLimit;
    window.gameData.elapsed = Math.max(0, (this.time.now - this.runStartedAt) / 1000);
    window.gameData.combo = this.bestCombo;
    window.gameData.chainTarget = this.chainTarget;
    this.scene.start('Win');
  }

  createUI() {
    const { width, height } = this.scale;
    const wide = width >= height;
    const by = height - (wide ? 38 : 54);
    const gap = wide ? 170 : 150;
    if (window.createNiceButton) {
      window.createNiceButton(this, width / 2 - gap / 2, by, '↺ ЗАНОВО', () => this.restartAfterFailure(), {
        w: wide ? 130 : 140, h: wide ? 40 : 46, color: 0x222238, secondary: true, fontSize: wide ? '14px' : '16px', depth: 20
      });
      window.createNiceButton(this, width / 2 + gap / 2, by, 'МЕНЮ', () => this.scene.start('Menu'), {
        w: wide ? 130 : 140, h: wide ? 40 : 46, color: 0x222238, secondary: true, fontSize: wide ? '14px' : '16px', depth: 20
      });
    }
  }

  initAudio() {
    if (window.ensureGameAudio) window.ensureGameAudio();
    else if (!window.gameAudioCtx) {
      try { window.gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { window.gameAudioCtx = null; }
    }
  }

  unlockAudio() {
    if (!window.isSoundOn || !window.isSoundOn()) return;
    const ctx = window.gameAudioCtx;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  playTone(freq, duration, type = 'sine', vol = 0.11) {
    if (window.isSoundOn && !window.isSoundOn()) return;
    const ctx = window.gameAudioCtx || (window.ensureGameAudio && window.ensureGameAudio());
    if (!ctx) return;
    const play = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type; osc.frequency.value = freq; gain.gain.value = vol;
        osc.connect(gain); gain.connect(ctx.destination);
        const now = ctx.currentTime;
        osc.start(now);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.stop(now + duration + 0.02);
      } catch (e) {}
    };
    if (ctx.state === 'suspended') {
      if (window.isSoundOn && window.isSoundOn()) ctx.resume().then(play).catch(() => {});
    } else play();
  }

  playSuccessSound() {
    this.playTone(523, 0.05);
    this.time.delayedCall(35, () => this.playTone(784, 0.07));
  }

  playFailSound() {
    this.playTone(155, 0.09, 'sawtooth', 0.05);
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.levelIndex = window.gameData.currentLevel || 0;
    this.levelData = LEVELS[this.levelIndex] || LEVELS[0];
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
  }

  calcTimeLimit() {
    const size = this.levelData.size;
    const count = this.levelData.arrows.length;
    let sec = 25 + count * 4 + size * 3 + Math.floor(this.levelIndex * 0.4);
    return Math.max(30, Math.min(sec, 180));
  }

  create() {
    const { width, height } = this.scale;

    this.skinId = (window.gameProgress && window.gameProgress.skin) || 'neon';
    this.wallSet = new Set();
    (this.levelData.walls || []).forEach(w => {
      this.wallSet.add(String(w.x) + ',' + String(w.y));
    });

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const wide = width >= height;
    // Enough top/bottom padding so HUD never sits on the grid or each other
    const topPad = wide ? 64 : 148;
    const bottomPad = wide ? 72 : 108;
    const headerY = wide ? 22 : 40;
    // Stats on a separate row from the title (avoids text-on-text overlap)
    const statsY = wide ? 48 : 98;

    const panel = this.add.graphics();
    panel.fillStyle(0x12121e, 0.95);
    panel.fillRoundedRect(16, topPad, width - 32, height - topPad - bottomPad, 20);
    panel.lineStyle(2, 0x2e2e48, 0.7);
    panel.strokeRoundedRect(16, topPad, width - 32, height - topPad - bottomPad, 20);

    this.add.text(width / 2, headerY, `УРОВЕНЬ ${this.levelIndex + 1}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '20px' : '26px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    if (!wide) {
      const line = this.add.graphics();
      line.lineStyle(2, 0x00e8c8, 0.35);
      line.lineBetween(width / 2 - 50, 64, width / 2 + 50, 64);
    }

    // Fixed side padding so labels never collide with title or each other
    this.movesText = this.add.text(wide ? 24 : width * 0.28, statsY, `Ошибки: 0/${this.maxMistakes}`, {
      fontFamily: 'Arial',
      fontSize: wide ? '15px' : '17px',
      color: '#6e6e8a'
    }).setOrigin(wide ? 0 : 0.5, 0.5);

    this.timeLimit = this.calcTimeLimit();
    this.timeLeft = this.timeLimit;

    this.timerText = this.add.text(wide ? width - 24 : width * 0.72, statsY, this.formatTime(this.timeLeft), {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '16px' : '19px',
      color: '#00e8c8'
    }).setOrigin(wide ? 1 : 0.5, 0.5);

    const size = this.levelData.size;
    const maxGridW = width - (wide ? 120 : 64);
    const maxGridH = height - topPad - bottomPad - 24;
    this.cellSize = Math.floor(Math.min(maxGridW / size, maxGridH / size));
    const gridW = this.cellSize * size;
    const gridH = this.cellSize * size;
    this.offsetX = (width - gridW) / 2;
    this.offsetY = topPad + (height - topPad - bottomPad - gridH) / 2;
    this.gridH = gridH;

    this.drawGrid(size);
    this.drawWalls();
    this.createArrows();
    this.createUI();
    this.initAudio();
    this.startTimer();
  }

  formatTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}`;
  }

  updateMistakesUI() {
    const shown = Math.min(this.mistakes, this.maxMistakes);
    this.movesText.setText(`Ошибки: ${shown}/${this.maxMistakes}`);
    if (shown >= this.maxMistakes - 1) this.movesText.setColor('#ff6b6b');
    else if (shown >= 1) this.movesText.setColor('#ffd166');
    else this.movesText.setColor('#6e6e8a');
  }

  startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.completed || this.failed) return;
        this.timeLeft -= 0.1;
        this.elapsed = this.timeLimit - this.timeLeft;
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
    if (this.timerEvent) {
      try { this.timerEvent.remove(false); } catch (e) {}
    }
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
      fontFamily: 'Arial Black',
      fontSize: titleText.length > 14 ? '22px' : '26px',
      color: '#ff6b6b',
      align: 'center',
      wordWrap: { width: boxW - 40 }
    }).setOrigin(0.5).setDepth(102);

    this.add.text(width / 2, height / 2 - 20, 'Попробуй ещё раз', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9a9ab4'
    }).setOrigin(0.5).setDepth(102);

    const again = this.add.text(width / 2, height / 2 + 45, '↺ ЗАНОВО', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#0b0b14',
      backgroundColor: '#00e8c8',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    again.on('pointerdown', () => this.scene.restart());

    const menu = this.add.text(width / 2, height / 2 + 100, 'МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('Menu'));
  }

  drawGrid(size) {
    const g = this.add.graphics();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.wallSet.has(x + ',' + y)) continue;
        const cx = this.offsetX + x * this.cellSize + this.cellSize / 2;
        const cy = this.offsetY + y * this.cellSize + this.cellSize / 2;
        g.fillStyle(0x2a2a40, 0.85);
        g.fillCircle(cx, cy, 3.2);
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
      g.fillStyle(0x000000, 0.35);
      g.fillRoundedRect(x + 2, y + 2, s, s, 8);
      g.fillStyle(0x3a3a52, 1);
      g.fillRoundedRect(x, y, s, s, 8);
      g.lineStyle(2, 0x7a7a9a, 1);
      g.strokeRoundedRect(x, y, s, s, 8);
      g.lineStyle(1, 0x2a2a40, 0.9);
      g.lineBetween(x + 4, y + s / 2, x + s - 4, y + s / 2);
      g.lineBetween(x + s / 2, y + 4, x + s / 2, y + s - 4);
    });
  }

  lockArrowColor(lockColor, fallback) {
    const meta = (window.LOCK_COLOR_META || [])[lockColor != null ? lockColor : 0];
    return meta ? meta.hex : fallback;
  }

  createArrows() {
    this.arrows = [];
    this.remaining = this.levelData.arrows.length;

    const palette = [
      0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0,
      0xf72585, 0x2ec4b6, 0xff9f1c, 0x9b5de5
    ];

    const badgeSize = Math.max(11, Math.floor(this.cellSize * 0.14));
    const gridTop = this.offsetY + 4;
    const gridBottom = this.offsetY + this.levelData.size * this.cellSize - 4;
    const gridLeft = this.offsetX + 4;
    const gridRight = this.offsetX + this.levelData.size * this.cellSize - 4;

    this.levelData.arrows.forEach((a, i) => {
      let color = palette[i % palette.length];
      if (a.lockId != null || a.keyId != null) {
        color = this.lockArrowColor(a.lockColor, color);
      }

      const cx = this.offsetX + a.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + a.y * this.cellSize + this.cellSize / 2;

      const g = this.add.graphics();
      this.drawArrow(g, a.dir, color);
      g.setPosition(cx, cy);

      let badge = null;
      let rotBadge = null;
      if (a.lockId != null || a.keyId != null) {
        const icon = a.lockId != null ? '🔒' : '🔑';
        let bx = cx + this.cellSize * 0.28;
        let by = cy - this.cellSize * 0.32;
        bx = Math.max(gridLeft, Math.min(gridRight, bx));
        by = Math.max(gridTop, Math.min(gridBottom, by));
        badge = this.add.text(bx, by, icon, {
          fontSize: badgeSize + 'px'
        }).setOrigin(0.5).setDepth(10);
      }
      if (a.rotates) {
        let rx = cx - this.cellSize * 0.28;
        let ry = cy - this.cellSize * 0.32;
        rx = Math.max(gridLeft, Math.min(gridRight, rx));
        ry = Math.max(gridTop, Math.min(gridBottom, ry));
        rotBadge = this.add.text(rx, ry, '↻', {
          fontSize: Math.max(12, Math.floor(this.cellSize * 0.2)) + 'px',
          color: '#ffe066'
        }).setOrigin(0.5).setDepth(10);
      }

      const zone = this.add.zone(cx, cy, this.cellSize * 0.95, this.cellSize * 0.95);
      zone.setOrigin(0.5).setInteractive();

      const data = {
        x: a.x, y: a.y, dir: a.dir, color: color,
        graphics: g, zone: zone, badge: badge, rotBadge: rotBadge, removed: false,
        rotates: !!a.rotates,
        rotated: false,
        lockId: a.lockId != null ? a.lockId : null,
        keyId: a.keyId != null ? a.keyId : null,
        lockColor: a.lockColor != null ? a.lockColor : null
      };

      zone.on('pointerdown', () => {
        if (data.removed || this.completed || this.failed) return;
        this.unlockAudio();
        this.tweens.add({ targets: g, scaleX: 0.88, scaleY: 0.88, duration: 30, yoyo: true });
        this.handleArrowTap(data);
      });

      this.applySkinAnim(data, i);
      this.arrows.push(data);
    });
  }

  applySkinAnim(data, index) {
    const g = data.graphics;
    const skin = this.skinId || 'neon';
    const delay = (index % 7) * 70;

    if (skin === 'block') {
      this.tweens.add({
        targets: g,
        scaleX: 1.06,
        scaleY: 0.96,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
    } else if (skin === 'triangle') {
      this.tweens.add({
        targets: g,
        angle: { from: -4, to: 4 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
    } else if (skin === 'chevron') {
      const baseX = g.x;
      const baseY = g.y;
      let ox = 0, oy = 0;
      if (data.dir === 0) oy = -3;
      else if (data.dir === 1) ox = 3;
      else if (data.dir === 2) oy = 3;
      else ox = -3;
      this.tweens.add({
        targets: g,
        x: baseX + ox,
        y: baseY + oy,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
    } else if (skin === 'thin') {
      this.tweens.add({
        targets: g,
        scaleX: 1.04,
        scaleY: 0.97,
        duration: 320,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
    } else if (skin === 'feather') {
      this.tweens.add({
        targets: g,
        angle: { from: -5, to: 5 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
      this.tweens.add({
        targets: g,
        y: g.y - 2,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
    } else {
      this.tweens.add({
        targets: g,
        alpha: { from: 0.78, to: 1 },
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay
      });
    }
  }

  drawArrow(g, dir, color) {
    if (window.drawArrowSkin) {
      window.drawArrowSkin(g, dir, color, this.cellSize, this.skinId);
      return;
    }
    g.clear();
    const s = this.cellSize * 0.33;
    g.fillStyle(color, 0.16);
    this._shape(g, dir, s * 1.35);
    g.fillStyle(color, 1);
    this._shape(g, dir, s);
    g.fillStyle(0xffffff, 0.2);
    this._shape(g, dir, s * 0.45);
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
      const a = this.arrows[i];
      if (!a.removed && a.keyId === data.lockId) return true;
    }
    return false;
  }

  handleArrowTap(data) {
    if (data.removed || this.completed || this.failed) return;

    if (this.isLocked(data)) {
      this.mistakes++;
      this.updateMistakesUI();
      this.playFailSound();
      this.failFeedback(data);
      if (data.badge) {
        this.tweens.add({ targets: data.badge, scale: 1.3, duration: 80, yoyo: true });
      }
      if (this.mistakes >= this.maxMistakes) this.triggerFail('СЛИШКОМ МНОГО\nОШИБОК');
      return;
    }

    if (data.rotates && !data.rotated) {
      data.rotated = true;
      data.dir = (data.dir + 1) % 4;
      try { this.tweens.killTweensOf(data.graphics); } catch (e) {}
      data.graphics.setScale(1);
      data.graphics.setAlpha(1);
      this.drawArrow(data.graphics, data.dir, data.color);
      this.tweens.add({
        targets: data.graphics,
        angle: data.graphics.angle + 90,
        duration: 120,
        onComplete: () => {
          data.graphics.angle = 0;
          this.drawArrow(data.graphics, data.dir, data.color);
          this.applySkinAnim(data, 0);
        }
      });
      if (data.rotBadge) {
        this.tweens.add({
          targets: data.rotBadge,
          alpha: 0.35,
          scale: 0.85,
          duration: 120
        });
      }
      this.playTone(400, 0.05, 'sine', 0.08);
      this.time.delayedCall(40, () => this.playTone(520, 0.05, 'sine', 0.08));
      return;
    }

    if (this.canEscape(data)) {
      this.playSuccessSound();
      this.flyAway(data);
    } else {
      this.mistakes++;
      this.updateMistakesUI();
      this.playFailSound();
      this.failFeedback(data);
      if (this.mistakes >= this.maxMistakes) this.triggerFail('СЛИШКОМ МНОГО\nОШИБОК');
    }
  }

  canEscape(data) {
    const size = this.levelData.size;
    let cx = data.x;
    let cy = data.y;

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
    this.remaining--;
    this.moves++;
    data.zone.disableInteractive();
    try { this.tweens.killTweensOf(data.graphics); } catch (e) {}
    data.graphics.setScale(1);
    data.graphics.setAlpha(1);
    data.graphics.angle = 0;

    if (data.keyId != null) {
      this.arrows.forEach(a => {
        if (!a.removed && a.lockId === data.keyId && a.badge) {
          this.tweens.add({
            targets: a.badge,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => {
              try { a.badge.destroy(); } catch (e) {}
              a.badge = null;
            }
          });
        }
      });
    }

    let dx = 0, dy = 0;
    if (data.dir === 0) dy = -1;
    else if (data.dir === 1) dx = 1;
    else if (data.dir === 2) dy = 1;
    else dx = -1;

    const g = data.graphics;
    const gx = g.x;
    const gy = g.y;
    const skin = this.skinId || 'neon';
    const dist = Math.max(this.scale.width, this.scale.height) * 1.2;

    const finish = () => {
      try {
        g.destroy();
        data.zone.destroy();
        if (data.badge) data.badge.destroy();
        if (data.rotBadge) data.rotBadge.destroy();
      } catch (e) {}
      if (this.remaining <= 0 && !this.completed && !this.failed) {
        this.completed = true;
        if (this.timerEvent) {
          try { this.timerEvent.remove(false); } catch (e) {}
        }
        this.time.delayedCall(80, () => this.levelComplete());
      }
    };

    this.spawnExitTrail(gx, gy, dx, dy, data.color, skin);

    if (skin === 'block') {
      this.tweens.add({
        targets: g,
        scaleX: 1.35,
        scaleY: 0.55,
        duration: 70,
        yoyo: true,
        onComplete: () => {
          this.tweens.add({
            targets: g,
            x: gx + dx * dist,
            y: gy + dy * dist,
            angle: dx !== 0 ? 0 : (dy < 0 ? -20 : 20),
            alpha: 0,
            scale: 0.3,
            duration: 280,
            ease: 'Back.easeIn',
            onComplete: finish
          });
        }
      });
    } else if (skin === 'triangle') {
      this.tweens.add({
        targets: g,
        x: gx + dx * dist,
        y: gy + dy * dist,
        angle: 360,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        ease: 'Cubic.easeIn',
        onComplete: finish
      });
    } else if (skin === 'chevron') {
      this.tweens.add({
        targets: g,
        x: gx + dx * 40,
        y: gy + dy * 40,
        scale: 1.15,
        duration: 60,
        onComplete: () => {
          this.tweens.add({
            targets: g,
            x: gx + dx * dist,
            y: gy + dy * dist,
            alpha: 0,
            scaleX: 1.6,
            scaleY: 0.4,
            duration: 240,
            ease: 'Expo.easeIn',
            onComplete: finish
          });
        }
      });
    } else if (skin === 'thin') {
      this.tweens.add({
        targets: g,
        scaleX: dx !== 0 ? 1.8 : 0.5,
        scaleY: dy !== 0 ? 1.8 : 0.5,
        duration: 80,
        onComplete: () => {
          this.tweens.add({
            targets: g,
            x: gx + dx * dist,
            y: gy + dy * dist,
            alpha: 0,
            scale: 0.15,
            duration: 220,
            ease: 'Quad.easeIn',
            onComplete: finish
          });
        }
      });
    } else if (skin === 'feather') {
      this.tweens.add({
        targets: g,
        x: gx + dx * dist * 0.35 + (dy !== 0 ? 30 : 0),
        y: gy + dy * dist * 0.35 + (dx !== 0 ? -20 : 0),
        angle: 25,
        duration: 140,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: g,
            x: gx + dx * dist,
            y: gy + dy * dist,
            angle: -15,
            alpha: 0,
            scale: 0.35,
            duration: 260,
            ease: 'Cubic.easeIn',
            onComplete: finish
          });
        }
      });
    } else {
      this.tweens.add({
        targets: g,
        scale: 1.25,
        alpha: 1,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.tweens.add({
            targets: g,
            x: gx + dx * dist,
            y: gy + dy * dist,
            alpha: 0,
            scale: 0.25,
            angle: dx !== 0 ? (dx * 12) : 0,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: finish
          });
        }
      });
    }

    const flyBadge = (obj) => {
      if (!obj) return;
      this.tweens.add({
        targets: obj,
        x: obj.x + dx * dist,
        y: obj.y + dy * dist,
        alpha: 0,
        scale: 0.3,
        duration: 280
      });
    };
    flyBadge(data.badge);
    flyBadge(data.rotBadge);
  }

  spawnExitTrail(x, y, dx, dy, color, skin) {
    const n = skin === 'neon' ? 8 : (skin === 'feather' ? 6 : 5);
    for (let i = 0; i < n; i++) {
      const dot = this.add.circle(
        x - dx * i * 6 + Phaser.Math.Between(-4, 4),
        y - dy * i * 6 + Phaser.Math.Between(-4, 4),
        Phaser.Math.Between(2, 5),
        color,
        0.85
      );
      dot.setDepth(20);
      this.tweens.add({
        targets: dot,
        x: dot.x + dx * Phaser.Math.Between(40, 120),
        y: dot.y + dy * Phaser.Math.Between(40, 120),
        alpha: 0,
        scale: 0,
        duration: 200 + i * 30,
        ease: 'Quad.easeOut',
        onComplete: () => { try { dot.destroy(); } catch (e) {} }
      });
    }
  }

  failFeedback(data) {
    const g = data.graphics;
    this.tweens.add({ targets: g, x: g.x + 5, duration: 22, yoyo: true, repeat: 3 });
    this.drawArrow(g, data.dir, 0xff4444);
    this.time.delayedCall(100, () => {
      if (!data.removed) this.drawArrow(g, data.dir, data.color);
    });
  }

  calcStars() {
    if (this.mistakes === 0) return 3;
    if (this.mistakes === 1) return 2;
    return 1;
  }

  levelComplete() {
    if (this.scene.isActive('Win') || this.failed) return;
    window.gameData.moves = this.moves;
    window.gameData.mistakes = this.mistakes;
    window.gameData.stars = this.calcStars();
    window.gameData.timeLeft = Math.max(0, this.timeLeft);
    window.gameData.timeLimit = this.timeLimit;
    window.gameData.elapsed = Math.max(0, this.elapsed);
    this.scene.start('Win');
  }

  createUI() {
    const { width, height } = this.scale;
    const wide = width >= height;
    // Keep buttons in reserved bottom zone, clear of the board
    const by = height - (wide ? 36 : 54);
    const makeBtn = (x, label, cb) => {
      const t = this.add.text(x, by, label, {
        fontFamily: 'Arial',
        fontSize: wide ? '15px' : '18px',
        color: '#8a8aa8',
        backgroundColor: '#181828',
        padding: { x: 18, y: wide ? 8 : 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.setDepth(20);
      t.on('pointerdown', cb);
      return t;
    };
    makeBtn(width * 0.28, '↺ ЗАНОВО', () => this.scene.restart());
    makeBtn(width * 0.72, 'МЕНЮ', () => this.scene.start('Menu'));

    // Sound toggle — top-right corner of Game
    if (window.createSoundToggle) {
      window.createSoundToggle(this, width - (wide ? 28 : 32), wide ? 22 : 36, {
        size: wide ? 36 : 40,
        fontSize: wide ? '18px' : '20px',
        depth: 80
      });
    }
  }

  initAudio() {
    if (window.ensureGameAudio) window.ensureGameAudio();
    else if (!window.gameAudioCtx) {
      try {
        window.gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        window.gameAudioCtx = null;
      }
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
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = vol;
        osc.connect(gain);
        gain.connect(ctx.destination);
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

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
  }

  calcTimeLimit() {
    const size = this.levelData.size;
    const count = this.levelData.arrows.length;
    let sec = 25 + count * 4 + size * 3 + Math.floor(this.levelIndex * 0.4);
    return Math.max(30, Math.min(sec, 180));
  }

  create() {
    const { width, height } = this.scale;

    this.wallSet = new Set();
    const walls = this.levelData.walls || [];
    walls.forEach(w => this.wallSet.add(String(w.x) + ',' + String(w.y)));

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const panel = this.add.graphics();
    panel.fillStyle(0x12121e, 0.95);
    panel.fillRoundedRect(20, 155, width - 40, height - 275, 28);
    panel.lineStyle(2, 0x2e2e48, 0.7);
    panel.strokeRoundedRect(20, 155, width - 40, height - 275, 28);

    this.add.text(width / 2, 42, `УРОВЕНЬ ${this.levelIndex + 1}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(2, 0x00e8c8, 0.35);
    line.lineBetween(width / 2 - 50, 66, width / 2 + 50, 66);

    this.movesText = this.add.text(width * 0.28, 100, `Ошибки: 0/${this.maxMistakes}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#6e6e8a'
    }).setOrigin(0.5);

    this.timeLimit = this.calcTimeLimit();
    this.timeLeft = this.timeLimit;

    this.timerText = this.add.text(width * 0.72, 100, this.formatTime(this.timeLeft), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    const size = this.levelData.size;
    const maxGridW = width - 80;
    const maxGridH = height - 360;
    this.cellSize = Math.floor(Math.min(maxGridW / size, maxGridH / size));
    const gridW = this.cellSize * size;
    const gridH = this.cellSize * size;
    this.offsetX = (width - gridW) / 2;
    this.offsetY = 175 + (maxGridH - gridH) / 2;

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

  createArrows() {
    this.arrows = [];
    this.remaining = this.levelData.arrows.length;

    const colors = [
      0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0,
      0xf72585, 0x2ec4b6, 0xff9f1c, 0x9b5de5
    ];

    this.levelData.arrows.forEach((a, i) => {
      const color = colors[i % colors.length];
      const cx = this.offsetX + a.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + a.y * this.cellSize + this.cellSize / 2;

      const g = this.add.graphics();
      this.drawArrow(g, a.dir, color);
      g.setPosition(cx, cy);

      const zone = this.add.zone(cx, cy, this.cellSize * 0.95, this.cellSize * 0.95);
      zone.setOrigin(0.5).setInteractive();

      const data = {
        x: a.x, y: a.y, dir: a.dir, color,
        graphics: g, zone, removed: false
      };

      zone.on('pointerdown', () => {
        if (data.removed || this.completed || this.failed) return;
        this.unlockAudio();
        this.tweens.add({
          targets: g, scaleX: 0.88, scaleY: 0.88, duration: 30, yoyo: true
        });
        this.handleArrowTap(data);
      });

      this.arrows.push(data);
    });
  }

  drawArrow(g, dir, color) {
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

  handleArrowTap(data) {
    if (data.removed || this.completed || this.failed) return;

    if (this.canEscape(data)) {
      this.playSuccessSound();
      this.flyAway(data);
    } else {
      this.mistakes++;
      this.updateMistakesUI();
      this.playFailSound();
      this.failFeedback(data);
      if (this.mistakes >= this.maxMistakes) {
        this.triggerFail('СЛИШКОМ МНОГО\nОШИБОК');
      }
    }
  }

  /** Стена и стрелка одинаково блокируют путь */
  canEscape(data) {
    const size = this.levelData.size;
    let cx = data.x;
    let cy = data.y;

    while (true) {
      if (data.dir === 0) cy -= 1;
      else if (data.dir === 1) cx += 1;
      else if (data.dir === 2) cy += 1;
      else cx -= 1;

      // За полем — успех
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;

      // Стена — блок
      const key = cx + ',' + cy;
      if (this.wallSet.has(key)) return false;

      // Стрелка — блок
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

    let dx = 0, dy = 0;
    if (data.dir === 0) dy = -1;
    else if (data.dir === 1) dx = 1;
    else if (data.dir === 2) dy = 1;
    else dx = -1;

    const g = data.graphics;

    this.tweens.add({
      targets: g,
      x: g.x + dx * 900,
      y: g.y + dy * 900,
      alpha: 0,
      scale: 0.4,
      duration: 250,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        try { g.destroy(); data.zone.destroy(); } catch (e) {}
        if (this.remaining <= 0 && !this.completed && !this.failed) {
          this.completed = true;
          if (this.timerEvent) {
            try { this.timerEvent.remove(false); } catch (e) {}
          }
          this.time.delayedCall(100, () => this.levelComplete());
        }
      }
    });
  }

  failFeedback(data) {
    const g = data.graphics;
    this.tweens.add({
      targets: g, x: g.x + 5, duration: 22, yoyo: true, repeat: 3
    });
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
    const makeBtn = (x, label, cb) => {
      const t = this.add.text(x, height - 58, label, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#8a8aa8',
        backgroundColor: '#181828',
        padding: { x: 18, y: 11 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', cb);
      return t;
    };
    makeBtn(width * 0.25, '↺ ЗАНОВО', () => this.scene.restart());
    makeBtn(width * 0.75, 'МЕНЮ', () => this.scene.start('Menu'));
  }

  initAudio() {
    if (!window.gameAudioCtx) {
      try {
        window.gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        window.gameAudioCtx = null;
      }
    }
  }

  unlockAudio() {
    const ctx = window.gameAudioCtx;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  playTone(freq, duration, type = 'sine', vol = 0.11) {
    const ctx = window.gameAudioCtx;
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
    if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {});
    else play();
  }

  playSuccessSound() {
    this.playTone(523, 0.05);
    this.time.delayedCall(35, () => this.playTone(784, 0.07));
  }

  playFailSound() {
    this.playTone(155, 0.09, 'sawtooth', 0.05);
  }
}

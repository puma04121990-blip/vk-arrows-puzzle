class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.levelIndex = window.gameData.currentLevel || 0;
    this.levelData = LEVELS[this.levelIndex] || LEVELS[0];
    this.arrows = [];
    this.cellSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.moves = 0;
    this.remaining = 0;
    this.completed = false;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const panel = this.add.graphics();
    panel.fillStyle(0x12121e, 0.95);
    panel.fillRoundedRect(20, 155, width - 40, height - 275, 28);
    panel.lineStyle(2, 0x2e2e48, 0.7);
    panel.strokeRoundedRect(20, 155, width - 40, height - 275, 28);

    this.add.text(width / 2, 52, `УРОВЕНЬ ${this.levelIndex + 1}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '30px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(2, 0x00e8c8, 0.35);
    line.lineBetween(width / 2 - 50, 78, width / 2 + 50, 78);

    this.movesText = this.add.text(width / 2, 100, 'Ходы: 0', {
      fontFamily: 'Arial',
      fontSize: '19px',
      color: '#6e6e8a'
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
    this.createArrows();
    this.createUI();
    this.initAudio();
  }

  drawGrid(size) {
    const g = this.add.graphics();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = this.offsetX + x * this.cellSize + this.cellSize / 2;
        const cy = this.offsetY + y * this.cellSize + this.cellSize / 2;
        g.fillStyle(0x2a2a40, 0.85);
        g.fillCircle(cx, cy, 3.2);
      }
    }
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

      const zoneSize = this.cellSize * 0.95;
      const zone = this.add.zone(cx, cy, zoneSize, zoneSize);
      zone.setOrigin(0.5);
      zone.setInteractive();

      const data = {
        x: a.x, y: a.y, dir: a.dir, color,
        graphics: g, zone, removed: false
      };

      zone.on('pointerdown', () => {
        if (data.removed || this.completed) return;
        this.unlockAudio();

        this.tweens.add({
          targets: g,
          scaleX: 0.88,
          scaleY: 0.88,
          duration: 30,
          yoyo: true
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
    if (data.removed || this.completed) return;

    if (this.canEscape(data)) {
      this.playSuccessSound();
      this.flyAway(data);
    } else {
      this.playFailSound();
      this.failFeedback(data);
    }
  }

  canEscape(data) {
    const size = this.levelData.size;
    let cx = data.x, cy = data.y;

    while (true) {
      if (data.dir === 0) cy--;
      else if (data.dir === 1) cx++;
      else if (data.dir === 2) cy++;
      else cx--;

      if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;
      if (this.arrows.some(a => !a.removed && a.x === cx && a.y === cy)) return false;
    }
  }

  flyAway(data) {
    if (data.removed) return;

    data.removed = true;
    this.remaining--;
    this.moves++;
    this.movesText.setText(`Ходы: ${this.moves}`);
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
        try {
          g.destroy();
          data.zone.destroy();
        } catch (e) {}

        if (this.remaining <= 0 && !this.completed) {
          this.completed = true;
          this.time.delayedCall(100, () => this.levelComplete());
        }
      }
    });
  }

  failFeedback(data) {
    const g = data.graphics;
    this.tweens.add({
      targets: g,
      x: g.x + 5,
      duration: 22,
      yoyo: true,
      repeat: 3
    });

    this.drawArrow(g, data.dir, 0xff4444);
    this.time.delayedCall(100, () => {
      if (!data.removed) this.drawArrow(g, data.dir, data.color);
    });
  }

  levelComplete() {
    if (this.scene.isActive('Win')) return;

    window.gameData.moves = this.moves;
    const ideal = this.levelData.arrows.length;
    let stars = 3;
    if (this.moves > ideal + 4) stars = 1;
    else if (this.moves > ideal + 1) stars = 2;
    window.gameData.stars = stars;

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

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  }

  playSuccessSound() {
    this.playTone(523, 0.05);
    this.time.delayedCall(35, () => this.playTone(784, 0.07));
  }

  playFailSound() {
    this.playTone(155, 0.09, 'sawtooth', 0.05);
  }
}

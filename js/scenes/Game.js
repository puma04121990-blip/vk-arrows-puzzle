class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.levelIndex = window.gameData.currentLevel;
    this.levelData = LEVELS[this.levelIndex];
    this.arrows = [];
    this.cellSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isAnimating = false;
    this.moves = 0;
    this.remaining = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Soft panel
    const panel = this.add.graphics();
    panel.fillStyle(0x12121f, 0.85);
    panel.fillRoundedRect(28, 170, width - 56, height - 300, 28);

    // Header
    this.add.text(width / 2, 58, `УРОВЕНЬ ${this.levelIndex + 1}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: '#00f5d4'
    }).setOrigin(0.5);

    this.movesText = this.add.text(width / 2, 108, 'Ходы: 0', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#8a8aaa'
    }).setOrigin(0.5);

    // Grid metrics
    const size = this.levelData.size;
    const maxGridW = width - 100;
    const maxGridH = height - 380;
    this.cellSize = Math.floor(Math.min(maxGridW / size, maxGridH / size));
    const gridW = this.cellSize * size;
    const gridH = this.cellSize * size;
    this.offsetX = (width - gridW) / 2;
    this.offsetY = 190 + (maxGridH - gridH) / 2;

    this.drawGrid(size);
    this.createArrows();
    this.createUI();
    this.setupSounds();
  }

  drawGrid(size) {
    const g = this.add.graphics();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = this.offsetX + x * this.cellSize + this.cellSize / 2;
        const cy = this.offsetY + y * this.cellSize + this.cellSize / 2;
        g.fillStyle(0x2a2a42, 0.7);
        g.fillCircle(cx, cy, 4);
      }
    }
  }

  createArrows() {
    this.arrows = [];
    this.remaining = this.levelData.arrows.length;

    const colors = [
      0x00f5d4, // cyan
      0xff6b6b, // coral
      0xfeca57, // yellow
      0x54a0ff, // blue
      0xff9ff3, // pink
      0x1dd1a1, // green
      0xff9f43, // orange
      0x5f27cd  // purple
    ];

    this.levelData.arrows.forEach((a, i) => {
      const color = colors[i % colors.length];
      const container = this.add.container(0, 0);

      const g = this.add.graphics();
      this.drawArrow(g, a.dir, color);

      container.add(g);
      container.setSize(this.cellSize * 0.9, this.cellSize * 0.9);
      container.setInteractive(
        new Phaser.Geom.Rectangle(
          -this.cellSize * 0.4,
          -this.cellSize * 0.4,
          this.cellSize * 0.8,
          this.cellSize * 0.8
        ),
        Phaser.Geom.Rectangle.Contains
      );

      const px = this.offsetX + a.x * this.cellSize + this.cellSize / 2;
      const py = this.offsetY + a.y * this.cellSize + this.cellSize / 2;
      container.setPosition(px, py);

      container.arrowData = {
        x: a.x,
        y: a.y,
        dir: a.dir,
        color: color,
        graphics: g,
        removed: false
      };

      container.on('pointerdown', () => this.onArrowClick(container));

      this.arrows.push(container);
    });
  }

  // Clean, readable arrow
  drawArrow(g, dir, color) {
    g.clear();
    const s = this.cellSize * 0.36; // scale

    // Soft outer glow
    g.fillStyle(color, 0.22);
    this._drawArrowShape(g, dir, s * 1.25);

    // Main body
    g.fillStyle(color, 1);
    this._drawArrowShape(g, dir, s);

    // Small highlight
    g.fillStyle(0xffffff, 0.25);
    this._drawArrowShape(g, dir, s * 0.55);
  }

  _drawArrowShape(g, dir, s) {
    if (dir === 0) { // UP
      // shaft
      g.fillRoundedRect(-s * 0.22, -s * 0.15, s * 0.44, s * 0.85, 6);
      // head
      g.fillTriangle(0, -s * 1.05, -s * 0.62, -s * 0.15, s * 0.62, -s * 0.15);
    } else if (dir === 1) { // RIGHT
      g.fillRoundedRect(-s * 0.7, -s * 0.22, s * 0.85, s * 0.44, 6);
      g.fillTriangle(s * 1.05, 0, s * 0.15, -s * 0.62, s * 0.15, s * 0.62);
    } else if (dir === 2) { // DOWN
      g.fillRoundedRect(-s * 0.22, -s * 0.7, s * 0.44, s * 0.85, 6);
      g.fillTriangle(0, s * 1.05, -s * 0.62, s * 0.15, s * 0.62, s * 0.15);
    } else { // LEFT
      g.fillRoundedRect(-s * 0.15, -s * 0.22, s * 0.85, s * 0.44, 6);
      g.fillTriangle(-s * 1.05, 0, -s * 0.15, -s * 0.62, -s * 0.15, s * 0.62);
    }
  }

  onArrowClick(container) {
    if (this.isAnimating || container.arrowData.removed) return;

    if (this.canEscape(container.arrowData)) {
      this.playSuccessSound();
      this.animateEscape(container);
    } else {
      this.playFailSound();
      this.shakeArrow(container);
    }
  }

  canEscape(data) {
    const size = this.levelData.size;
    let cx = data.x;
    let cy = data.y;

    while (true) {
      if (data.dir === 0) cy--;
      else if (data.dir === 1) cx++;
      else if (data.dir === 2) cy++;
      else if (data.dir === 3) cx--;

      // Free if we reached the edge
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;

      // Blocked if another active arrow sits here
      const blocked = this.arrows.some(a =>
        !a.arrowData.removed &&
        a.arrowData.x === cx &&
        a.arrowData.y === cy
      );
      if (blocked) return false;
    }
  }

  animateEscape(container) {
    this.isAnimating = true;
    this.moves++;
    this.movesText.setText(`Ходы: ${this.moves}`);

    const data = container.arrowData;
    data.removed = true;
    this.remaining--;

    let dx = 0, dy = 0;
    if (data.dir === 0) dy = -1;
    else if (data.dir === 1) dx = 1;
    else if (data.dir === 2) dy = 1;
    else if (data.dir === 3) dx = -1;

    this.tweens.add({
      targets: container,
      x: container.x + dx * 1000,
      y: container.y + dy * 1000,
      alpha: 0,
      scale: 0.5,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        container.destroy();
        this.isAnimating = false;

        this.emitParticles(
          container.x - dx * 1000,
          container.y - dy * 1000,
          data.color
        );

        if (this.remaining <= 0) {
          this.time.delayedCall(250, () => this.levelComplete());
        }
      }
    });
  }

  shakeArrow(container) {
    this.tweens.add({
      targets: container,
      x: container.x + 9,
      duration: 35,
      yoyo: true,
      repeat: 4
    });

    // Red flash
    const g = container.arrowData.graphics;
    this.drawArrow(g, container.arrowData.dir, 0xff3333);
    this.time.delayedCall(160, () => {
      if (!container.arrowData.removed) {
        this.drawArrow(g, container.arrowData.dir, container.arrowData.color);
      }
    });
  }

  emitParticles(x, y, color) {
    const p = this.add.particles(x, y, 'particle', {
      speed: { min: 80, max: 220 },
      scale: { start: 0.5, end: 0 },
      lifespan: 480,
      quantity: 12,
      tint: color,
      blendMode: 'ADD'
    });
    this.time.delayedCall(550, () => p.destroy());
  }

  levelComplete() {
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

    const restartBtn = this.add.text(width * 0.25, height - 68, '↺ ЗАНОВО', {
      fontFamily: 'Arial',
      fontSize: '23px',
      color: '#aaaacc',
      backgroundColor: '#1a1a2e',
      padding: { x: 18, y: 11 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(width * 0.75, height - 68, 'МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '23px',
      color: '#aaaacc',
      backgroundColor: '#1a1a2e',
      padding: { x: 18, y: 11 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
  }

  setupSounds() {
    this.audioCtx = null;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  playTone(freq, duration, type = 'sine', vol = 0.12) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playSuccessSound() {
    this.playTone(523, 0.07);
    this.time.delayedCall(50, () => this.playTone(784, 0.1));
  }

  playFailSound() {
    this.playTone(160, 0.13, 'sawtooth', 0.07);
  }
}

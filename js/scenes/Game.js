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
    this.add.rectangle(0, 0, width, height, 0x0a0a12).setOrigin(0);

    // Soft grid glow
    const gridGlow = this.add.graphics();
    gridGlow.fillStyle(0x12122a, 0.6);
    gridGlow.fillRoundedRect(30, 180, width - 60, height - 320, 24);

    // Header
    this.add.text(width / 2, 60, `УРОВЕНЬ ${this.levelIndex + 1}`, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#00f5d4'
    }).setOrigin(0.5);

    this.movesText = this.add.text(width / 2, 110, 'Ходы: 0', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#a0a0c0'
    }).setOrigin(0.5);

    // Calculate grid metrics
    const size = this.levelData.size;
    const maxGridW = width - 80;
    const maxGridH = height - 360;
    this.cellSize = Math.floor(Math.min(maxGridW / size, maxGridH / size));
    const gridW = this.cellSize * size;
    const gridH = this.cellSize * size;
    this.offsetX = (width - gridW) / 2;
    this.offsetY = 200 + (maxGridH - gridH) / 2;

    // Draw dots (grid points)
    this.drawGrid(size);

    // Create arrows
    this.createArrows();

    // Bottom UI
    this.createUI();

    // Sound system
    this.setupSounds();
  }

  drawGrid(size) {
    const g = this.add.graphics();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = this.offsetX + x * this.cellSize + this.cellSize / 2;
        const cy = this.offsetY + y * this.cellSize + this.cellSize / 2;
        g.fillStyle(0x2a2a4a, 0.7);
        g.fillCircle(cx, cy, 4);
      }
    }
  }

  createArrows() {
    this.arrows = [];
    this.remaining = this.levelData.arrows.length;

    const colors = [
      0x00f5d4, // cyan
      0xff6b6b, // red
      0xfeca57, // yellow
      0x48dbfb, // blue
      0xff9ff3, // pink
      0x1dd1a1, // green
      0xf368e0, // magenta
      0xff9f43  // orange
    ];

    this.levelData.arrows.forEach((a, i) => {
      const color = colors[i % colors.length];
      const container = this.add.container(0, 0);

      const graphics = this.add.graphics();
      this.drawArrow(graphics, 0, 0, a.dir, color, this.cellSize * 0.38);

      container.add(graphics);
      container.setSize(this.cellSize * 0.85, this.cellSize * 0.85);
      container.setInteractive({ useHandCursor: true });

      // Position
      const px = this.offsetX + a.x * this.cellSize + this.cellSize / 2;
      const py = this.offsetY + a.y * this.cellSize + this.cellSize / 2;
      container.setPosition(px, py);

      // Store data
      container.arrowData = {
        x: a.x,
        y: a.y,
        dir: a.dir,
        color: color,
        graphics: graphics,
        removed: false
      };

      container.on('pointerdown', () => this.onArrowClick(container));

      this.arrows.push(container);
    });
  }

  drawArrow(g, x, y, dir, color, scale) {
    g.clear();
    g.fillStyle(color, 1);
    g.lineStyle(3, 0xffffff, 0.25);

    const s = scale;
    // Shaft + head
    if (dir === 0) { // up
      g.fillRoundedRect(x - s * 0.18, y - s * 0.1, s * 0.36, s * 0.7, 4);
      g.fillTriangle(x, y - s * 0.85, x - s * 0.55, y - s * 0.15, x + s * 0.55, y - s * 0.15);
    } else if (dir === 1) { // right
      g.fillRoundedRect(x - s * 0.6, y - s * 0.18, s * 0.7, s * 0.36, 4);
      g.fillTriangle(x + s * 0.85, y, x + s * 0.15, y - s * 0.55, x + s * 0.15, y + s * 0.55);
    } else if (dir === 2) { // down
      g.fillRoundedRect(x - s * 0.18, y - s * 0.6, s * 0.36, s * 0.7, 4);
      g.fillTriangle(x, y + s * 0.85, x - s * 0.55, y + s * 0.15, x + s * 0.55, y + s * 0.15);
    } else { // left
      g.fillRoundedRect(x - s * 0.1, y - s * 0.18, s * 0.7, s * 0.36, 4);
      g.fillTriangle(x - s * 0.85, y, x - s * 0.15, y - s * 0.55, x - s * 0.15, y + s * 0.55);
    }
  }

  onArrowClick(container) {
    if (this.isAnimating || container.arrowData.removed) return;

    const data = container.arrowData;
    if (this.canEscape(data)) {
      this.playSuccessSound();
      this.animateEscape(container);
    } else {
      this.playFailSound();
      this.shakeArrow(container);
    }
  }

  canEscape(data) {
    const { x, y, dir } = data;
    const size = this.levelData.size;

    let cx = x;
    let cy = y;

    // Check path in direction until edge
    while (true) {
      if (dir === 0) cy--;
      else if (dir === 1) cx++;
      else if (dir === 2) cy++;
      else if (dir === 3) cx--;

      // Out of bounds = free path
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) {
        return true;
      }

      // Is there an active arrow here?
      const blocking = this.arrows.find(a =>
        !a.arrowData.removed &&
        a.arrowData.x === cx &&
        a.arrowData.y === cy
      );
      if (blocking) return false;
    }
  }

  animateEscape(container) {
    this.isAnimating = true;
    this.moves++;
    this.movesText.setText(`Ходы: ${this.moves}`);

    const data = container.arrowData;
    data.removed = true;
    this.remaining--;

    // Direction vector
    let dx = 0, dy = 0;
    if (data.dir === 0) dy = -1;
    else if (data.dir === 1) dx = 1;
    else if (data.dir === 2) dy = 1;
    else if (data.dir === 3) dx = -1;

    // Fly off screen
    const dist = 900;
    this.tweens.add({
      targets: container,
      x: container.x + dx * dist,
      y: container.y + dy * dist,
      alpha: 0,
      scale: 0.6,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        container.destroy();
        this.isAnimating = false;

        // Particles
        this.emitParticles(container.x - dx * dist, container.y - dy * dist, data.color);

        if (this.remaining <= 0) {
          this.time.delayedCall(300, () => this.levelComplete());
        }
      }
    });
  }

  shakeArrow(container) {
    this.tweens.add({
      targets: container,
      x: container.x + 8,
      duration: 40,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut'
    });

    // Flash red
    const g = container.arrowData.graphics;
    const originalColor = container.arrowData.color;
    this.drawArrow(g, 0, 0, container.arrowData.dir, 0xff3333, this.cellSize * 0.38);
    this.time.delayedCall(200, () => {
      this.drawArrow(g, 0, 0, container.arrowData.dir, originalColor, this.cellSize * 0.38);
    });
  }

  emitParticles(x, y, color) {
    const particles = this.add.particles(x, y, 'particle', {
      speed: { min: 80, max: 220 },
      scale: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: 12,
      tint: color,
      blendMode: 'ADD'
    });
    this.time.delayedCall(600, () => particles.destroy());
  }

  levelComplete() {
    window.gameData.moves = this.moves;
    // Simple star rating
    const ideal = this.levelData.arrows.length;
    let stars = 3;
    if (this.moves > ideal + 4) stars = 1;
    else if (this.moves > ideal + 1) stars = 2;
    window.gameData.stars = stars;

    this.scene.start('Win');
  }

  createUI() {
    const { width, height } = this.scale;

    // Restart button
    const restartBtn = this.add.text(width * 0.25, height - 70, '↺ ЗАНОВО', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a0a0c0',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    // Menu button
    const menuBtn = this.add.text(width * 0.75, height - 70, 'МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a0a0c0',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      this.scene.start('Menu');
    });
  }

  setupSounds() {
    // Simple Web Audio tones (no external files needed)
    this.audioCtx = null;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  playTone(freq, duration, type = 'sine', vol = 0.15) {
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
    this.playTone(523, 0.08, 'sine', 0.12);
    this.time.delayedCall(60, () => this.playTone(784, 0.12, 'sine', 0.1));
  }

  playFailSound() {
    this.playTone(180, 0.15, 'sawtooth', 0.08);
  }
}

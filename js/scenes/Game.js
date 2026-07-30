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

    this.add.rectangle(0, 0, width, height, 0x0a0a12).setOrigin(0);

    const gridGlow = this.add.graphics();
    gridGlow.fillStyle(0x12122a, 0.6);
    gridGlow.fillRoundedRect(30, 180, width - 60, height - 320, 24);

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

    const size = this.levelData.size;
    const maxGridW = width - 80;
    const maxGridH = height - 360;
    this.cellSize = Math.floor(Math.min(maxGridW / size, maxGridH / size));
    const gridW = this.cellSize * size;
    const gridH = this.cellSize * size;
    this.offsetX = (width - gridW) / 2;
    this.offsetY = 200 + (maxGridH - gridH) / 2;

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
        g.fillStyle(0x2a2a4a, 0.6);
        g.fillCircle(cx, cy, 3.5);
      }
    }
  }

  // Convert grid cell to pixel center
  cellToPixel(x, y) {
    return {
      x: this.offsetX + x * this.cellSize + this.cellSize / 2,
      y: this.offsetY + y * this.cellSize + this.cellSize / 2
    };
  }

  createArrows() {
    this.arrows = [];
    this.remaining = this.levelData.arrows.length;

    const colors = [
      0x00f5d4, 0xff6b6b, 0xfeca57, 0x48dbfb,
      0xff9ff3, 0x1dd1a1, 0xf368e0, 0xff9f43,
      0x54a0ff, 0x5f27cd, 0x01a3a4, 0xff9ff3
    ];

    this.levelData.arrows.forEach((a, i) => {
      const color = colors[i % colors.length];
      const g = this.add.graphics();
      this.drawLongArrow(g, a.path, a.dir, color);

      // Make the whole graphics interactive
      g.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height), Phaser.Geom.Rectangle.Contains);
      // Better: we will use a more precise hit later, for now broad + check in handler

      g.arrowData = {
        path: a.path.map(p => ({ ...p })),
        dir: a.dir,
        color: color,
        removed: false,
        graphics: g
      };

      g.on('pointerdown', (pointer) => {
        // Only react if the click is near the arrow path
        if (this.isPointNearPath(pointer.x, pointer.y, a.path)) {
          this.onArrowClick(g);
        }
      });

      this.arrows.push(g);
    });
  }

  isPointNearPath(px, py, path) {
    const threshold = this.cellSize * 0.45;
    for (const cell of path) {
      const p = this.cellToPixel(cell.x, cell.y);
      const dx = px - p.x;
      const dy = py - p.y;
      if (dx * dx + dy * dy < threshold * threshold) return true;
    }
    // Also check segments between points
    for (let i = 0; i < path.length - 1; i++) {
      const a = this.cellToPixel(path[i].x, path[i].y);
      const b = this.cellToPixel(path[i + 1].x, path[i + 1].y);
      if (this.distToSegment(px, py, a.x, a.y, b.x, b.y) < threshold) return true;
    }
    return false;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  drawLongArrow(g, path, dir, color) {
    g.clear();
    if (path.length === 0) return;

    const thickness = Math.max(10, this.cellSize * 0.28);

    // Draw the body as thick rounded line
    g.lineStyle(thickness, color, 1);
    g.beginPath();

    const first = this.cellToPixel(path[0].x, path[0].y);
    g.moveTo(first.x, first.y);

    for (let i = 1; i < path.length; i++) {
      const p = this.cellToPixel(path[i].x, path[i].y);
      g.lineTo(p.x, p.y);
    }
    g.strokePath();

    // Soft glow
    g.lineStyle(thickness + 6, color, 0.18);
    g.beginPath();
    g.moveTo(first.x, first.y);
    for (let i = 1; i < path.length; i++) {
      const p = this.cellToPixel(path[i].x, path[i].y);
      g.lineTo(p.x, p.y);
    }
    g.strokePath();

    // Arrow head at the last point
    const head = this.cellToPixel(path[path.length - 1].x, path[path.length - 1].y);
    const headSize = thickness * 1.6;

    g.fillStyle(color, 1);
    if (dir === 0) { // up
      g.fillTriangle(
        head.x, head.y - headSize,
        head.x - headSize * 0.7, head.y + headSize * 0.3,
        head.x + headSize * 0.7, head.y + headSize * 0.3
      );
    } else if (dir === 1) { // right
      g.fillTriangle(
        head.x + headSize, head.y,
        head.x - headSize * 0.3, head.y - headSize * 0.7,
        head.x - headSize * 0.3, head.y + headSize * 0.7
      );
    } else if (dir === 2) { // down
      g.fillTriangle(
        head.x, head.y + headSize,
        head.x - headSize * 0.7, head.y - headSize * 0.3,
        head.x + headSize * 0.7, head.y - headSize * 0.3
      );
    } else { // left
      g.fillTriangle(
        head.x - headSize, head.y,
        head.x + headSize * 0.3, head.y - headSize * 0.7,
        head.x + headSize * 0.3, head.y + headSize * 0.7
      );
    }
  }

  onArrowClick(g) {
    if (this.isAnimating || g.arrowData.removed) return;

    if (this.canEscape(g.arrowData)) {
      this.playSuccessSound();
      this.animateEscape(g);
    } else {
      this.playFailSound();
      this.shakeArrow(g);
    }
  }

  // Collect all cells occupied by remaining arrows
  getOccupiedCells() {
    const occupied = new Set();
    this.arrows.forEach(a => {
      if (a.arrowData.removed) return;
      a.arrowData.path.forEach(p => {
        occupied.add(`${p.x},${p.y}`);
      });
    });
    return occupied;
  }

  canEscape(data) {
    const size = this.levelData.size;
    const occupied = this.getOccupiedCells();

    // Head position
    const head = data.path[data.path.length - 1];
    let cx = head.x;
    let cy = head.y;

    // Move one step in the direction of the head and keep going until edge
    while (true) {
      if (data.dir === 0) cy--;
      else if (data.dir === 1) cx++;
      else if (data.dir === 2) cy++;
      else if (data.dir === 3) cx--;

      if (cx < 0 || cx >= size || cy < 0 || cy >= size) {
        return true; // reached edge freely
      }

      if (occupied.has(`${cx},${cy}`)) {
        return false; // blocked by another arrow
      }
    }
  }

  animateEscape(g) {
    this.isAnimating = true;
    this.moves++;
    this.movesText.setText(`Ходы: ${this.moves}`);

    const data = g.arrowData;
    data.removed = true;
    this.remaining--;

    let dx = 0, dy = 0;
    if (data.dir === 0) dy = -1;
    else if (data.dir === 1) dx = 1;
    else if (data.dir === 2) dy = 1;
    else if (data.dir === 3) dx = -1;

    const dist = 1100;

    this.tweens.add({
      targets: g,
      x: g.x + dx * dist,
      y: g.y + dy * dist,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        g.destroy();
        this.isAnimating = false;

        // Particles at head position
        const head = data.path[data.path.length - 1];
        const p = this.cellToPixel(head.x, head.y);
        this.emitParticles(p.x, p.y, data.color);

        if (this.remaining <= 0) {
          this.time.delayedCall(280, () => this.levelComplete());
        }
      }
    });
  }

  shakeArrow(g) {
    this.tweens.add({
      targets: g,
      x: g.x + 7,
      duration: 40,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut'
    });

    // Flash red briefly
    const original = g.arrowData.color;
    this.drawLongArrow(g, g.arrowData.path, g.arrowData.dir, 0xff3333);
    this.time.delayedCall(180, () => {
      if (!g.arrowData.removed) {
        this.drawLongArrow(g, g.arrowData.path, g.arrowData.dir, original);
      }
    });
  }

  emitParticles(x, y, color) {
    const particles = this.add.particles(x, y, 'particle', {
      speed: { min: 90, max: 240 },
      scale: { start: 0.55, end: 0 },
      lifespan: 520,
      quantity: 14,
      tint: color,
      blendMode: 'ADD'
    });
    this.time.delayedCall(600, () => particles.destroy());
  }

  levelComplete() {
    window.gameData.moves = this.moves;
    const ideal = this.levelData.arrows.length;
    let stars = 3;
    if (this.moves > ideal + 5) stars = 1;
    else if (this.moves > ideal + 2) stars = 2;
    window.gameData.stars = stars;
    this.scene.start('Win');
  }

  createUI() {
    const { width, height } = this.scale;

    const restartBtn = this.add.text(width * 0.25, height - 70, '↺ ЗАНОВО', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a0a0c0',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(width * 0.75, height - 70, 'МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a0a0c0',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
  }

  setupSounds() {
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
    this.playTone(523, 0.07, 'sine', 0.11);
    this.time.delayedCall(55, () => this.playTone(784, 0.11, 'sine', 0.09));
  }

  playFailSound() {
    this.playTone(170, 0.14, 'sawtooth', 0.07);
  }
}

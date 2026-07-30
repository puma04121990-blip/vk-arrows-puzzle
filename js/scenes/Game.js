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
    this.moves = 0;
    this.remaining = 0;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const panel = this.add.graphics();
    panel.fillStyle(0x12121f, 0.85);
    panel.fillRoundedRect(28, 170, width - 56, height - 300, 28);

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
      0x00f5d4, 0xff6b6b, 0xfeca57, 0x54a0ff,
      0xff9ff3, 0x1dd1a1, 0xff9f43, 0x5f27cd
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
        x: a.x,
        y: a.y,
        dir: a.dir,
        color: color,
        graphics: g,
        zone: zone,
        removed: false
      };

      zone.on('pointerdown', () => {
        if (data.removed) return;

        // Быстрый визуальный отклик без блокировки
        this.tweens.add({
          targets: g,
          scaleX: 0.85,
          scaleY: 0.85,
          duration: 40,
          yoyo: true
        });

        this.handleArrowTap(data);
      });

      this.arrows.push(data);
    });
  }

  drawArrow(g, dir, color) {
    g.clear();
    const s = this.cellSize * 0.36;

    g.fillStyle(color, 0.2);
    this._shape(g, dir, s * 1.28);

    g.fillStyle(color, 1);
    this._shape(g, dir, s);

    g.fillStyle(0xffffff, 0.2);
    this._shape(g, dir, s * 0.5);
  }

  _shape(g, dir, s) {
    if (dir === 0) {
      g.fillRoundedRect(-s * 0.22, -s * 0.15, s * 0.44, s * 0.85, 5);
      g.fillTriangle(0, -s * 1.05, -s * 0.62, -s * 0.15, s * 0.62, -s * 0.15);
    } else if (dir === 1) {
      g.fillRoundedRect(-s * 0.7, -s * 0.22, s * 0.85, s * 0.44, 5);
      g.fillTriangle(s * 1.05, 0, s * 0.15, -s * 0.62, s * 0.15, s * 0.62);
    } else if (dir === 2) {
      g.fillRoundedRect(-s * 0.22, -s * 0.7, s * 0.44, s * 0.85, 5);
      g.fillTriangle(0, s * 1.05, -s * 0.62, s * 0.15, s * 0.62, s * 0.15);
    } else {
      g.fillRoundedRect(-s * 0.15, -s * 0.22, s * 0.85, s * 0.44, 5);
      g.fillTriangle(-s * 1.05, 0, -s * 0.15, -s * 0.62, -s * 0.15, s * 0.62);
    }
  }

  handleArrowTap(data) {
    if (data.removed) return;

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
    let cx = data.x;
    let cy = data.y;

    while (true) {
      if (data.dir === 0) cy--;
      else if (data.dir === 1) cx++;
      else if (data.dir === 2) cy++;
      else cx--;

      if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;

      const blocked = this.arrows.some(a => !a.removed && a.x === cx && a.y === cy);
      if (blocked) return false;
    }
  }

  flyAway(data) {
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

    // Быстрая анимация улёта без блокировки ввода
    this.tweens.add({
      targets: g,
      x: g.x + dx * 900,
      y: g.y + dy * 900,
      alpha: 0,
      scale: 0.4,
      duration: 280,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        g.destroy();
        data.zone.destroy();

        if (this.remaining <= 0) {
          this.time.delayedCall(150, () => this.levelComplete());
        }
      }
    });
  }

  failFeedback(data) {
    const g = data.graphics;

    this.tweens.add({
      targets: g,
      x: g.x + 6,
      duration: 25,
      yoyo: true,
      repeat: 3
    });

    this.drawArrow(g, data.dir, 0xff3333);
    this.time.delayedCall(120, () => {
      if (!data.removed) this.drawArrow(g, data.dir, data.color);
    });
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
    this.playTone(523, 0.06);
    this.time.delayedCall(40, () => this.playTone(784, 0.08));
  }

  playFailSound() {
    this.playTone(160, 0.11, 'sawtooth', 0.06);
  }
}

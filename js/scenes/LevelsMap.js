class LevelsMapScene extends Phaser.Scene {
  constructor() {
    super('LevelsMap');
  }

  create() {
    const { width, height } = this.scale;
    const total = LEVELS.length;
    const maxOpened = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const totalStars = window.getTotalStars ? window.getTotalStars() : 0;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, 48, 'УРОВНИ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, 88, `★ ${totalStars} / ${total * 3}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffd166'
    }).setOrigin(0.5);

    // Подсказка про пороги
    this.add.text(width / 2, 118, 'Каждые 10 ур. нужен порог ★', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#5a5a72'
    }).setOrigin(0.5);

    const cols = 5;
    const cellW = 110;
    const cellH = 125;
    const startX = (width - cols * cellW) / 2 + cellW / 2;
    const startY = 160;

    this.mapContainer = this.add.container(0, 0);

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const progressed = i <= maxOpened;
      const need = window.getStarsNeededForLevel ? window.getStarsNeededForLevel(i) : 0;
      const starLocked = need > 0 && totalStars < need;
      const playable = progressed && !starLocked;
      const stars = window.getLevelStars ? window.getLevelStars(i) : 0;

      this.createLevelButton(x, y, i, playable, progressed, starLocked, need, stars, totalStars);
    }

    const back = this.add.text(width / 2, height - 50, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8',
      backgroundColor: '#181828',
      padding: { x: 22, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('Menu'));

    this.setupScroll(total, cols, cellH, startY, height);
  }

  createLevelButton(x, y, index, playable, progressed, starLocked, need, stars, totalStars) {
    const g = this.add.graphics();

    if (!progressed) {
      g.fillStyle(0x1a1a28, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 90, 16);
      g.lineStyle(2, 0x2a2a40, 1);
      g.strokeRoundedRect(x - 42, y - 42, 84, 90, 16);
    } else if (starLocked) {
      g.fillStyle(0x2a1a1a, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 90, 16);
      g.lineStyle(2, 0xff6b6b, 0.7);
      g.strokeRoundedRect(x - 42, y - 42, 84, 90, 16);
    } else if (stars > 0) {
      g.fillStyle(0x14352f, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 90, 16);
      g.lineStyle(2, 0x00e8c8, 0.8);
      g.strokeRoundedRect(x - 42, y - 42, 84, 90, 16);
    } else {
      g.fillStyle(0x1e1e32, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 90, 16);
      g.lineStyle(2, 0x3a3a58, 1);
      g.strokeRoundedRect(x - 42, y - 42, 84, 90, 16);
    }

    this.mapContainer.add(g);

    const numColor = playable ? '#e8e8ff' : '#4a4a60';
    const num = this.add.text(x, y - 14, String(index + 1), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '26px',
      color: numColor
    }).setOrigin(0.5);
    this.mapContainer.add(num);

    if (!progressed) {
      const lock = this.add.text(x, y + 22, '🔒', { fontSize: '15px' }).setOrigin(0.5).setAlpha(0.5);
      this.mapContainer.add(lock);
    } else if (starLocked) {
      const needText = this.add.text(x, y + 20, `★${need}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ff6b6b'
      }).setOrigin(0.5);
      this.mapContainer.add(needText);
    } else {
      let starStr = '';
      for (let s = 0; s < 3; s++) starStr += s < stars ? '★' : '☆';
      const starText = this.add.text(x, y + 22, starStr, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: stars > 0 ? '#ffd166' : '#3a3a50'
      }).setOrigin(0.5);
      this.mapContainer.add(starText);
    }

    if (playable) {
      const zone = this.add.zone(x, y, 84, 90).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.mapContainer.add(zone);
      zone.on('pointerdown', () => {
        window.gameData.currentLevel = index;
        this.scene.start('Game');
      });
    }
  }

  setupScroll(total, cols, cellH, startY, height) {
    const rows = Math.ceil(total / cols);
    const contentH = startY + rows * cellH + 40;
    const maxScroll = Math.max(0, contentH - (height - 100));

    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    this.input.on('pointerdown', (p) => {
      dragging = true;
      lastY = p.y;
    });

    this.input.on('pointerup', () => { dragging = false; });

    this.input.on('pointermove', (p) => {
      if (!dragging || maxScroll <= 0) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.mapContainer.y = this.scrollY;
    });
  }
}

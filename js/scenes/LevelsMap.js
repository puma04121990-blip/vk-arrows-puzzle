class LevelsMapScene extends Phaser.Scene {
  constructor() {
    super('LevelsMap');
  }

  create() {
    const { width, height } = this.scale;
    const total = LEVELS.length;
    const maxOpened = (window.gameProgress && window.gameProgress.maxLevel) || 0;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, 52, 'УРОВНИ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    // Подсчёт всех звёзд
    let totalStars = 0;
    for (let i = 0; i < total; i++) {
      totalStars += window.getLevelStars ? window.getLevelStars(i) : 0;
    }

    this.add.text(width / 2, 95, `★ ${totalStars} / ${total * 3}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffd166'
    }).setOrigin(0.5);

    // Сетка уровней
    const cols = 5;
    const cellW = 110;
    const cellH = 120;
    const startX = (width - cols * cellW) / 2 + cellW / 2;
    const startY = 160;

    // Контейнер со скроллом через drag
    this.mapContainer = this.add.container(0, 0);

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const opened = i <= maxOpened;
      const stars = window.getLevelStars ? window.getLevelStars(i) : 0;
      const completed = stars > 0;

      this.createLevelButton(x, y, i, opened, stars, completed);
    }

    // Кнопка назад
    const back = this.add.text(width / 2, height - 55, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8',
      backgroundColor: '#181828',
      padding: { x: 22, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('Menu'));

    // Простой вертикальный скролл пальцем
    this.setupScroll(total, cols, cellH, startY, height);
  }

  createLevelButton(x, y, index, opened, stars, completed) {
    const g = this.add.graphics();

    if (!opened) {
      g.fillStyle(0x1a1a28, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 84, 16);
      g.lineStyle(2, 0x2a2a40, 1);
      g.strokeRoundedRect(x - 42, y - 42, 84, 84, 16);
    } else if (completed) {
      g.fillStyle(0x14352f, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 84, 16);
      g.lineStyle(2, 0x00e8c8, 0.8);
      g.strokeRoundedRect(x - 42, y - 42, 84, 84, 16);
    } else {
      g.fillStyle(0x1e1e32, 1);
      g.fillRoundedRect(x - 42, y - 42, 84, 84, 16);
      g.lineStyle(2, 0x3a3a58, 1);
      g.strokeRoundedRect(x - 42, y - 42, 84, 84, 16);
    }

    this.mapContainer.add(g);

    const numColor = opened ? '#e8e8ff' : '#3a3a50';
    const num = this.add.text(x, y - 8, String(index + 1), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: numColor
    }).setOrigin(0.5);
    this.mapContainer.add(num);

    // Звёзды под номером
    if (opened) {
      let starStr = '';
      for (let s = 0; s < 3; s++) {
        starStr += s < stars ? '★' : '☆';
      }
      const starText = this.add.text(x, y + 28, starStr, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: stars > 0 ? '#ffd166' : '#3a3a50'
      }).setOrigin(0.5);
      this.mapContainer.add(starText);
    } else {
      const lock = this.add.text(x, y + 26, '🔒', {
        fontSize: '16px'
      }).setOrigin(0.5).setAlpha(0.5);
      this.mapContainer.add(lock);
    }

    if (opened) {
      const zone = this.add.zone(x, y, 84, 84).setOrigin(0.5).setInteractive({ useHandCursor: true });
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

    this.input.on('pointerup', () => {
      dragging = false;
    });

    this.input.on('pointermove', (p) => {
      if (!dragging || maxScroll <= 0) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.mapContainer.y = this.scrollY;
    });
  }
}

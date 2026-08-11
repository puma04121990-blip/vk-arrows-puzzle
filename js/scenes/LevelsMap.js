class LevelsMapScene extends Phaser.Scene {
  constructor() {
    super('LevelsMap');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;
    const total = LEVELS.length;
    const maxOpened = (window.gameProgress && window.gameProgress.maxLevel) || 0;
    const totalStars = window.getTotalStars ? window.getTotalStars() : 0;
    const stages = window.STAGES || [];

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Fixed header bar (prevents text/buttons from sliding under title)
    const headerH = wide ? 72 : 96;
    const headerBg = this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1);
    headerBg.setDepth(50);

    this.add.text(width / 2, wide ? 22 : 32, 'УРОВНИ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '26px' : '30px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.add.text(width / 2, wide ? 50 : 68, `★ ${totalStars} / ${total * 3}`, {
      fontFamily: 'Arial',
      fontSize: wide ? '15px' : '17px',
      color: '#ffd166'
    }).setOrigin(0.5).setDepth(51);

    // Fixed footer with menu button
    const footerH = wide ? 56 : 72;
    const footerBg = this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 1);
    footerBg.setDepth(50);

    const back = this.add.text(width / 2, height - footerH / 2, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '18px' : '20px',
      color: '#9a9ab8',
      backgroundColor: '#181828',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Menu'));

    this.mapContainer = this.add.container(0, 0);
    this.mapContainer.setDepth(10);

    const cols = wide ? 5 : 5;
    const cellW = Math.min(110, Math.floor((width - 32) / cols));
    const cellH = wide ? 100 : 108;
    const btnHalfH = 38;
    const startX = (width - cols * cellW) / 2 + cellW / 2;
    // Content starts below fixed header
    let y = headerH + 16;

    stages.forEach((stage) => {
      const unlocked = window.isStageUnlocked(stage);

      const titleColor = unlocked ? '#00e8c8' : '#6a6a82';
      let title = stage.name;
      if (!unlocked) title += `  ·  нужно ★${stage.needStars}`;
      else if (stage.needStars > 0) title += `  ·  ★${stage.needStars}+`;

      const header = this.add.text(width / 2, y, title, {
        fontFamily: 'Arial Black, Arial',
        fontSize: wide ? '16px' : '17px',
        color: titleColor,
        wordWrap: { width: width - 40 },
        align: 'center'
      }).setOrigin(0.5);
      this.mapContainer.add(header);
      y += 26;

      if (!unlocked) {
        const needMore = Math.max(0, stage.needStars - totalStars);
        const hint = this.add.text(width / 2, y, `Собери ещё ★${needMore}`, {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#ff6b6b'
        }).setOrigin(0.5);
        this.mapContainer.add(hint);
        y += 22;
      }

      // Gap so stage title never sits on top of level cards
      y += btnHalfH + 6;

      for (let i = stage.from; i <= stage.to && i < total; i++) {
        const local = i - stage.from;
        const col = local % cols;
        const row = Math.floor(local / cols);
        const x = startX + col * cellW;
        const cy = y + row * cellH;
        const progressed = i <= maxOpened;
        const playable = progressed && unlocked;
        const stars = window.getLevelStars ? window.getLevelStars(i) : 0;
        this.createLevelButton(x, cy, i, playable, progressed, unlocked, stars);
      }

      const rows = Math.ceil((stage.to - stage.from + 1) / cols);
      y += (rows - 1) * cellH + btnHalfH + 32;
    });

    // Clip content so it never overlaps fixed header/footer
    const maskG = this.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(0, headerH, width, height - headerH - footerH);
    this.mapContainer.setMask(maskG.createGeometryMask());

    this.setupScroll(y + 24, height, headerH, footerH);
  }

  createLevelButton(x, y, index, playable, progressed, stageUnlocked, stars) {
    const g = this.add.graphics();
    const bw = 76;
    const bh = 72;

    if (!stageUnlocked || !progressed) {
      g.fillStyle(0x1a1a28, 1);
      g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);
      g.lineStyle(1, 0x2a2a40, 1);
      g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);
    } else if (stars > 0) {
      g.fillStyle(0x14352f, 1);
      g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);
      g.lineStyle(1, 0x00e8c8, 1);
      g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);
    } else {
      g.fillStyle(0x1e1e32, 1);
      g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);
      g.lineStyle(1, 0x3a3a58, 1);
      g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);
    }

    this.mapContainer.add(g);

    const num = this.add.text(x, y - 10, String(index + 1), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: playable ? '#e8e8ff' : '#4a4a60'
    }).setOrigin(0.5);
    this.mapContainer.add(num);

    if (!stageUnlocked || !progressed) {
      const lock = this.add.text(x, y + 18, '🔒', { fontSize: '13px' }).setOrigin(0.5).setAlpha(0.5);
      this.mapContainer.add(lock);
    } else {
      let starStr = '';
      for (let s = 0; s < 3; s++) starStr += s < stars ? '★' : '☆';
      const starText = this.add.text(x, y + 18, starStr, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: stars > 0 ? '#ffd166' : '#3a3a50'
      }).setOrigin(0.5);
      this.mapContainer.add(starText);
    }

    if (playable) {
      const zone = this.add.zone(x, y, bw, bh).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.mapContainer.add(zone);
      zone.on('pointerdown', () => {
        window.gameData.currentLevel = index;
        this.scene.start('Game');
      });
    }
  }

  setupScroll(contentH, height, headerH, footerH) {
    const viewH = height - headerH - footerH;
    const maxScroll = Math.max(0, contentH - headerH - viewH);
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;
    let startY = 0;
    let moved = false;

    this.input.on('pointerdown', (p) => {
      dragging = true;
      lastY = p.y;
      startY = p.y;
      moved = false;
    });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('pointermove', (p) => {
      if (!dragging || maxScroll <= 0) return;
      const dy = p.y - lastY;
      if (Math.abs(p.y - startY) > 6) moved = true;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.mapContainer.y = this.scrollY;
    });

    // Wheel support (desktop Web)
    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (maxScroll <= 0) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy * 0.5, -maxScroll, 0);
      this.mapContainer.y = this.scrollY;
    });
  }
}

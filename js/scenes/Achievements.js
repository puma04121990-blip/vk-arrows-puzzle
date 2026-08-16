class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('Achievements');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;
    const list = window.ACHIEVEMENTS || [];
    const unlocked = window.getUnlockedAchievements ? window.getUnlockedAchievements() : {};

    let done = 0;
    list.forEach(a => { if (unlocked[a.id]) done++; });

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const headerH = wide ? 72 : 96;
    const footerH = wide ? 56 : 72;

    const headerBg = this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1);
    headerBg.setDepth(50);

    this.add.text(width / 2, wide ? 22 : 32, 'ДОСТИЖЕНИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '26px' : '30px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.add.text(width / 2, wide ? 50 : 68, `${done} / ${list.length}`, {
      fontFamily: 'Arial',
      fontSize: wide ? '15px' : '17px',
      color: '#ffd166'
    }).setOrigin(0.5).setDepth(51);

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

    this.listContainer = this.add.container(0, 0);
    this.listContainer.setDepth(10);

    // The list is clipped to the clear middle region; header/footer are never covered while scrolling.
    const listMask = this.make.graphics({ x: 0, y: 0, add: false });
    listMask.fillStyle(0xffffff);
    listMask.fillRect(0, headerH, width, height - headerH - footerH);
    this.listContainer.setMask(listMask.createGeometryMask());

    const cardW = Math.min(width - 40, 640);
    const rowH = wide ? 72 : 80;
    const rowStep = wide ? 84 : 92;
    let y = headerH + rowH / 2 + (wide ? 16 : 20);
    list.forEach((a) => {
      const isOn = !!unlocked[a.id];
      this.createRow(width / 2, y, a, isOn, cardW, wide);
      y += rowStep;
    });

    const contentBottom = y - rowStep + rowH / 2 + 20;
    this.setupScroll(contentBottom, height, headerH, footerH);
  }

  createRow(x, y, a, isOn, cardW, wide) {
    const half = cardW / 2;
    const rowH = wide ? 72 : 80;

    const g = this.add.graphics();
    g.fillStyle(isOn ? 0x14352f : 0x1a1a28, 1);
    g.fillRoundedRect(x - half, y - rowH / 2, cardW, rowH, 14);
    g.lineStyle(2, isOn ? 0x00e8c8 : 0x2a2a40, isOn ? 0.85 : 1);
    g.strokeRoundedRect(x - half, y - rowH / 2, cardW, rowH, 14);
    this.listContainer.add(g);

    const iconX = x - half + 28;
    const textX = x - half + 56;
    const markX = x + half - 28;
    const maxTextW = cardW - 100;

    const icon = this.add.text(iconX, y, a.icon || '🏅', {
      fontSize: wide ? '24px' : '28px'
    }).setOrigin(0.5);
    this.listContainer.add(icon);

    const title = this.add.text(textX, y - 14, a.title, {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '16px' : '18px',
      color: isOn ? '#e8e8ff' : '#6a6a82',
      wordWrap: { width: maxTextW }
    }).setOrigin(0, 0.5);
    this.listContainer.add(title);

    const desc = this.add.text(textX, y + 14, a.desc, {
      fontFamily: 'Arial',
      fontSize: wide ? '13px' : '14px',
      color: isOn ? '#9a9ab4' : '#4a4a60',
      wordWrap: { width: maxTextW }
    }).setOrigin(0, 0.5);
    this.listContainer.add(desc);

    const mark = this.add.text(markX, y, isOn ? '✓' : '🔒', {
      fontSize: wide ? '20px' : '22px',
      color: isOn ? '#00e8c8' : '#4a4a60'
    }).setOrigin(0.5);
    this.listContainer.add(mark);
  }

  setupScroll(contentH, height, headerH, footerH) {
    const viewH = height - headerH - footerH;
    const maxScroll = Math.max(0, contentH - headerH - viewH);
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    this.input.on('pointerdown', (p) => {
      if (p.y < headerH || p.y > height - footerH) return;
      dragging = true;
      lastY = p.y;
    });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('pointermove', (p) => {
      if (!dragging || maxScroll <= 0) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.listContainer.y = this.scrollY;
    });

    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (maxScroll <= 0) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy * 0.5, -maxScroll, 0);
      this.listContainer.y = this.scrollY;
    });
  }
}

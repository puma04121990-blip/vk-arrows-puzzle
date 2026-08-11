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
    const sidePad = 20;
    const cardW = Math.min(width - sidePad * 2, 560);
    const rowH = wide ? 72 : 80;
    const rowGap = 12;

    // Fixed header
    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1).setDepth(50);
    this.add.text(width / 2, wide ? 22 : 32, 'ДОСТИЖЕНИЯ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: wide ? '24px' : '28px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.add.text(width / 2, wide ? 50 : 68, `${done} / ${list.length}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: wide ? '16px' : '18px',
      color: '#ffd166'
    }).setOrigin(0.5).setDepth(51);

    // Fixed footer
    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 1).setDepth(50);
    const back = this.add.text(width / 2, height - footerH / 2, '← МЕНЮ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: wide ? '18px' : '20px',
      color: '#9a9ab8',
      backgroundColor: '#181828',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Menu'));

    this.listContainer = this.add.container(0, 0);
    this.listContainer.setDepth(10);

    let y = headerH + 16 + rowH / 2;
    list.forEach((a) => {
      const isOn = !!unlocked[a.id];
      this.createRow(Math.round(width / 2), Math.round(y), a, isOn, cardW, rowH, wide);
      y += rowH + rowGap;
    });

    // Mask so rows never draw over header/footer
    const maskG = this.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(0, headerH, width, height - headerH - footerH);
    this.listContainer.setMask(maskG.createGeometryMask());

    this.setupScroll(y + rowH / 2, height, headerH, footerH);
  }

  createRow(x, y, a, isOn, cardW, rowH, wide) {
    const half = cardW / 2;
    const leftPad = 14;
    const rightPad = 36;
    const iconW = 32;
    const textMaxW = Math.floor(cardW - leftPad - rightPad - iconW - 10);

    const g = this.add.graphics();
    g.fillStyle(isOn ? 0x14352f : 0x1a1a28, 1);
    g.fillRoundedRect(x - half, y - rowH / 2, cardW, rowH, 10);
    g.lineStyle(1, isOn ? 0x00e8c8 : 0x2a2a40, 1);
    g.strokeRoundedRect(x - half, y - rowH / 2, cardW, rowH, 10);
    this.listContainer.add(g);

    const iconX = Math.round(x - half + leftPad + iconW / 2);
    const textX = Math.round(x - half + leftPad + iconW + 8);
    const markX = Math.round(x + half - rightPad / 2);

    const icon = this.add.text(iconX, y, a.icon || '🏅', {
      fontSize: wide ? '22px' : '24px'
    }).setOrigin(0.5);
    this.listContainer.add(icon);

    const title = this.add.text(textX, y - 12, a.title, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: wide ? '16px' : '17px',
      color: isOn ? '#e8e8ff' : '#6a6a82'
    }).setOrigin(0, 0.5);
    if (title.width > textMaxW) title.setScale(textMaxW / title.width);
    this.listContainer.add(title);

    const desc = this.add.text(textX, y + 12, a.desc, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: wide ? '13px' : '14px',
      color: isOn ? '#9a9ab4' : '#4a4a60'
    }).setOrigin(0, 0.5);
    if (desc.width > textMaxW) desc.setScale(textMaxW / desc.width);
    this.listContainer.add(desc);

    const mark = this.add.text(markX, y, isOn ? '✓' : '🔒', {
      fontSize: wide ? '18px' : '20px',
      color: isOn ? '#00e8c8' : '#4a4a60'
    }).setOrigin(0.5);
    this.listContainer.add(mark);
  }

  setupScroll(contentBottom, height, headerH, footerH) {
    const viewH = height - headerH - footerH;
    const contentH = contentBottom - headerH;
    const maxScroll = Math.max(0, contentH - viewH + 8);
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    const applyScroll = () => {
      // Integer Y keeps text on pixel grid → no subpixel blur while scrolling
      this.listContainer.y = Math.round(this.scrollY);
    };

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
      applyScroll();
    });

    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (maxScroll <= 0) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy * 0.45, -maxScroll, 0);
      applyScroll();
    });
  }
}

class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('Achievements');
  }

  create() {
    const { width, height } = this.scale;
    const list = window.ACHIEVEMENTS || [];
    const unlocked = window.getUnlockedAchievements ? window.getUnlockedAchievements() : {};

    let done = 0;
    list.forEach(a => { if (unlocked[a.id]) done++; });

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, 48, 'ДОСТИЖЕНИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, 88, `${done} / ${list.length}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffd166'
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);

    let y = 130;
    list.forEach((a) => {
      const isOn = !!unlocked[a.id];
      this.createRow(width / 2, y, a, isOn);
      y += 96;
    });

    const back = this.add.text(width / 2, height - 48, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8',
      backgroundColor: '#181828',
      padding: { x: 22, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('Menu'));

    this.setupScroll(y + 20, height);
  }

  createRow(x, y, a, isOn) {
    const g = this.add.graphics();
    g.fillStyle(isOn ? 0x14352f : 0x1a1a28, 1);
    g.fillRoundedRect(x - 320, y - 38, 640, 80, 16);
    g.lineStyle(2, isOn ? 0x00e8c8 : 0x2a2a40, isOn ? 0.85 : 1);
    g.strokeRoundedRect(x - 320, y - 38, 640, 80, 16);
    this.listContainer.add(g);

    const icon = this.add.text(x - 280, y, a.icon || '🏅', {
      fontSize: '30px'
    }).setOrigin(0.5);
    this.listContainer.add(icon);

    const title = this.add.text(x - 240, y - 14, a.title, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: isOn ? '#e8e8ff' : '#6a6a82'
    }).setOrigin(0, 0.5);
    this.listContainer.add(title);

    const desc = this.add.text(x - 240, y + 16, a.desc, {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: isOn ? '#9a9ab4' : '#4a4a60'
    }).setOrigin(0, 0.5);
    this.listContainer.add(desc);

    const mark = this.add.text(x + 280, y, isOn ? '✓' : '🔒', {
      fontSize: '24px',
      color: isOn ? '#00e8c8' : '#4a4a60'
    }).setOrigin(0.5);
    this.listContainer.add(mark);
  }

  setupScroll(contentH, height) {
    const maxScroll = Math.max(0, contentH - (height - 90));
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    this.input.on('pointerdown', (p) => { dragging = true; lastY = p.y; });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('pointermove', (p) => {
      if (!dragging || maxScroll <= 0) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.listContainer.y = this.scrollY;
    });
  }
}

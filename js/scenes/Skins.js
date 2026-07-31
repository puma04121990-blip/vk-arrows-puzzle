class SkinsScene extends Phaser.Scene {
  constructor() {
    super('Skins');
  }

  create() {
    const { width, height } = this.scale;
    const skins = window.ARROW_SKINS || [];
    const selected = (window.gameProgress && window.gameProgress.skin) || 'neon';

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, 48, 'СКИНЫ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, 86, 'Внешний вид стрелок', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);
    this.selectedId = selected;

    let y = 140;
    skins.forEach((skin) => {
      this.createSkinRow(width / 2, y, skin, skin.id === this.selectedId);
      y += 108;
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

  createSkinRow(x, y, skin, isSelected) {
    const g = this.add.graphics();
    g.fillStyle(isSelected ? 0x14352f : 0x1a1a28, 1);
    g.fillRoundedRect(x - 320, y - 42, 640, 88, 16);
    g.lineStyle(2, isSelected ? 0x00e8c8 : 0x2a2a40, isSelected ? 0.9 : 1);
    g.strokeRoundedRect(x - 320, y - 42, 640, 88, 16);
    this.listContainer.add(g);

    // Preview arrows
    const colors = [0x00e8c8, 0xff6b6b, 0xffd166, 0x4cc9f0];
    for (let i = 0; i < 4; i++) {
      const pg = this.add.graphics();
      if (window.drawArrowSkin) {
        window.drawArrowSkin(pg, i % 4, colors[i], 52, skin.id);
      }
      pg.setPosition(x - 250 + i * 48, y);
      pg.setScale(0.85);
      this.listContainer.add(pg);
    }

    const title = this.add.text(x - 40, y - 14, `${skin.icon}  ${skin.name}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: isSelected ? '#e8e8ff' : '#9a9ab4'
    }).setOrigin(0, 0.5);
    this.listContainer.add(title);

    const desc = this.add.text(x - 40, y + 16, skin.desc, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: isSelected ? '#9a9ab4' : '#5a5a70'
    }).setOrigin(0, 0.5);
    this.listContainer.add(desc);

    if (isSelected) {
      const mark = this.add.text(x + 280, y, '✓', {
        fontSize: '28px',
        color: '#00e8c8'
      }).setOrigin(0.5);
      this.listContainer.add(mark);
    }

    const zone = this.add.zone(x, y, 640, 88).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.listContainer.add(zone);
    zone.on('pointerdown', () => {
      if (window.setSelectedSkin) window.setSelectedSkin(skin.id);
      this.scene.restart();
    });
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

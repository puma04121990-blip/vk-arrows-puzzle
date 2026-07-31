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

    this.add.text(width / 2, 86, 'Тапни, чтобы выбрать', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);
    this.selectedId = selected;
    this.rows = [];

    let y = 140;
    skins.forEach((skin) => {
      this.createSkinRow(width / 2, y, skin, skin.id === this.selectedId);
      this.rows.push({ y: y, skinId: skin.id });
      y += 108;
    });

    // Кнопка назад — вне контейнера, всегда кликабельна
    const backBg = this.add.graphics();
    backBg.fillStyle(0x181828, 1);
    backBg.fillRoundedRect(width / 2 - 90, height - 70, 180, 48, 12);

    const back = this.add.text(width / 2, height - 46, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('Menu'));

    this.setupScrollAndTap(y + 20, height);
  }

  createSkinRow(x, y, skin, isSelected) {
    const g = this.add.graphics();
    g.fillStyle(isSelected ? 0x14352f : 0x1a1a28, 1);
    g.fillRoundedRect(x - 320, y - 42, 640, 88, 16);
    g.lineStyle(2, isSelected ? 0x00e8c8 : 0x2a2a40, isSelected ? 0.9 : 1);
    g.strokeRoundedRect(x - 320, y - 42, 640, 88, 16);
    this.listContainer.add(g);

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
  }

  selectSkin(skinId) {
    if (!skinId) return;
    if (window.setSelectedSkin) {
      window.setSelectedSkin(skinId);
    } else {
      if (!window.gameProgress) window.gameProgress = {};
      window.gameProgress.skin = skinId;
      if (window.persistProgress) window.persistProgress();
    }
    this.scene.restart();
  }

  setupScrollAndTap(contentH, height) {
    const maxScroll = Math.max(0, contentH - (height - 100));
    this.scrollY = 0;

    let startY = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;
    const TAP_THRESHOLD = 12;

    this.input.on('pointerdown', (p) => {
      // Не перехватываем кнопку меню (низ экрана)
      if (p.y > height - 80) return;
      dragging = true;
      moved = false;
      startY = p.y;
      startScroll = this.scrollY;
    });

    this.input.on('pointermove', (p) => {
      if (!dragging) return;
      const dy = p.y - startY;
      if (Math.abs(dy) > TAP_THRESHOLD) moved = true;
      if (maxScroll <= 0) return;
      this.scrollY = Phaser.Math.Clamp(startScroll + dy, -maxScroll, 0);
      this.listContainer.y = this.scrollY;
    });

    this.input.on('pointerup', (p) => {
      if (!dragging) return;
      dragging = false;

      // Скролл — не выбираем
      if (moved) return;
      if (p.y > height - 80) return;

      // Координата в пространстве списка
      const listY = p.y - this.scrollY;

      for (let i = 0; i < this.rows.length; i++) {
        const row = this.rows[i];
        if (Math.abs(listY - row.y) <= 44) {
          this.selectSkin(row.skinId);
          return;
        }
      }
    });
  }
}

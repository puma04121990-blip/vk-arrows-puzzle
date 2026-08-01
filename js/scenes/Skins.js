class SkinsScene extends Phaser.Scene {
  constructor() {
    super('Skins');
  }

  create() {
    const { width, height } = this.scale;
    const skins = window.ARROW_SKINS || [];
    const selected = (window.gameProgress && window.gameProgress.skin) || 'neon';

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, 42, 'СКИНЫ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#00e8c8'
    }).setOrigin(0.5);

    this.add.text(width / 2, 80, 'Нажми на скин, чтобы выбрать', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);
    this.scrollY = 0;

    let y = 130;
    skins.forEach((skin) => {
      this.createSkinRow(width / 2, y, skin, skin.id === selected);
      y += 112;
    });

    this.contentBottom = y + 20;

    // Кнопка назад
    const backHit = this.add.rectangle(width / 2, height - 46, 200, 52, 0x181828, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 46, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    backHit.on('pointerup', () => this.scene.start('Menu'));

    this.setupScroll(height);
  }

  createSkinRow(x, y, skin, isSelected) {
    // Фон
    const bg = this.add.graphics();
    bg.fillStyle(isSelected ? 0x14352f : 0x1a1a28, 1);
    bg.fillRoundedRect(x - 320, y - 46, 640, 96, 16);
    bg.lineStyle(2, isSelected ? 0x00e8c8 : 0x2a2a40, isSelected ? 0.95 : 1);
    bg.strokeRoundedRect(x - 320, y - 46, 640, 96, 16);
    this.listContainer.add(bg);

    // Превью стрелок
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

    const title = this.add.text(x - 40, y - 16, `${skin.icon}  ${skin.name}`, {
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

    // Прозрачная зона клика — главный хитбокс
    const hit = this.add.rectangle(x, y, 640, 96, 0xffffff, 0.001);
    hit.setInteractive({ useHandCursor: true });
    this.listContainer.add(hit);

    hit.on('pointerup', (pointer) => {
      // Если палец почти не сдвинулся — это тап, не скролл
      if (pointer.getDistance() > 28) return;
      this.applySkin(skin.id);
    });
  }

  applySkin(skinId) {
    if (!skinId) return;

    if (!window.gameProgress) window.gameProgress = {};
    window.gameProgress.skin = skinId;

    if (typeof window.setSelectedSkin === 'function') {
      window.setSelectedSkin(skinId);
    } else if (typeof window.persistProgress === 'function') {
      window.persistProgress();
    } else {
      try {
        localStorage.setItem(
          'arrow_pulse_progress_v3',
          JSON.stringify(window.gameProgress)
        );
      } catch (e) {}
    }

    // Мгновенный визуальный отклик + перерисовка
    this.scene.restart();
  }

  setupScroll(height) {
    const maxScroll = Math.max(0, this.contentBottom - (height - 100));
    if (maxScroll <= 0) return;

    let startY = 0;
    let startScroll = 0;
    let active = false;

    this.input.on('pointerdown', (p) => {
      if (p.y > height - 80) return;
      active = true;
      startY = p.y;
      startScroll = this.scrollY;
    });

    this.input.on('pointermove', (p) => {
      if (!active) return;
      const dy = p.y - startY;
      // Скроллим только при заметном движении
      if (Math.abs(dy) < 10) return;
      this.scrollY = Phaser.Math.Clamp(startScroll + dy, -maxScroll, 0);
      this.listContainer.y = this.scrollY;
    });

    this.input.on('pointerup', () => {
      active = false;
    });
  }
}

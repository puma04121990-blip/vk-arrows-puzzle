class HelpScene extends Phaser.Scene {
  constructor() {
    super('Help');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const headerH = wide ? 52 : 68;
    const footerH = wide ? 56 : 72;

    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1).setDepth(50);
    this.add.text(width / 2, headerH / 2, 'КАК ИГРАТЬ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: wide ? '22px' : '28px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 1).setDepth(50);
    const menuBtn = this.add.rectangle(width / 2, height - footerH / 2, 200, wide ? 40 : 48, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
      .setInteractive({ useHandCursor: true })
      .setDepth(51);
    this.add.text(width / 2, height - footerH / 2, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '19px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(52);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => this.scene.start('Menu'));

    const lines = [
      'Цель — убрать все стрелки с поля.',
      '',
      '• Тапай по стрелке, если путь свободен.',
      '  Стрелка улетает в сторону наконечника.',
      '',
      '• Стена блокирует путь — стрелка',
      '  через неё не проходит.',
      '',
      '• 🔑 Ключ нужно убрать раньше 🔒 замка',
      '  того же цвета.',
      '',
      '• ↻ Двухходовая стрелка:',
      '  1-й тап — поворот на 90°,',
      '  2-й тап — уход с поля.',
      '',
      '• 3 ошибки = перезапуск уровня.',
      '• Есть таймер на уровень.',
      '',
      'Звёзды:',
      '  0 ошибок → ★★★',
      '  1 ошибка → ★★',
      '  2+ ошибки → ★',
      '',
      'Этапы по 10 уровней. Чтобы открыть',
      'следующий этап, нужно 25 ★.',
      '',
      'Прогресс (уровни, звёзды, стили,',
      'достижения) синхронизируется',
      'между Android, iOS и Web через',
      'облако VK (аккаунт пользователя).'
    ];

    this.textContainer = this.add.container(0, 0);

    const text = this.add.text(width / 2, headerH + 12, lines.join('\n'), {
      fontFamily: 'Arial',
      fontSize: wide ? '14px' : '15px',
      color: '#b8b8d0',
      align: 'left',
      lineSpacing: 2,
      wordWrap: { width: Math.min(width - 48, 560) }
    }).setOrigin(0.5, 0);

    this.textContainer.add(text);

    const contentH = headerH + 12 + text.height + 20;
    const maxScroll = Math.max(0, contentH - (height - footerH));
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
      this.textContainer.y = this.scrollY;
    });
  }
}

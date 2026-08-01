class HelpScene extends Phaser.Scene {
  constructor() {
    super('Help');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.add.text(width / 2, wide ? 28 : 40, 'КАК ИГРАТЬ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '24px' : '30px',
      color: '#00e8c8'
    }).setOrigin(0.5);

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
      'следующий этап, нужно 25 ★.'
    ];

    const startY = wide ? 58 : 78;
    const fontSize = wide ? '14px' : '15px';
    const lineH = wide ? 18 : 22;

    // Scrollable feel via container clip — simple text block for now
    const text = this.add.text(width / 2, startY, lines.join('\n'), {
      fontFamily: 'Arial',
      fontSize: fontSize,
      color: '#b8b8d0',
      align: 'left',
      lineSpacing: 2,
      wordWrap: { width: Math.min(width - 48, 560) }
    }).setOrigin(0.5, 0);

    // If text too long on short screens, scale slightly
    const maxH = height - startY - (wide ? 70 : 90);
    if (text.height > maxH) {
      text.setScale(maxH / text.height);
    }

    const btnY = height - (wide ? 36 : 52);
    const menuBtn = this.add.rectangle(width / 2, btnY, 200, wide ? 42 : 52, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, btnY, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '17px' : '20px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => this.scene.start('Menu'));
  }
}

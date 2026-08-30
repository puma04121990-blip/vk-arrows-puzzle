class HelpScene extends Phaser.Scene {
  constructor() {
    super('Help');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    if (window.drawAppBackground) window.drawAppBackground(this, width, height);
    else this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const chrome = window.pulseChrome ? window.pulseChrome(this) : { headerH: wide ? 52 : 68, footerH: wide ? 92 : 108, btnY: height - 50 };
    const headerH = chrome.headerH;
    const footerH = chrome.footerH;
    const left = Math.max(24, (width - Math.min(width - 48, 560)) / 2);
    const maxW = Math.min(width - 48, 560);

    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 1).setDepth(50);
    this.add.text(width / 2, headerH / 2, 'КАК ИГРАТЬ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '22px' : '28px',
      color: '#00e8c8'
    }).setOrigin(0.5).setDepth(51);

    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 1).setDepth(50);
    const menuBtn = this.add.rectangle(width / 2, chrome.btnY, 200, wide ? 40 : 48, 0x1a1a28)
      .setStrokeStyle(1, 0x2e2e48)
      .setInteractive({ useHandCursor: true })
      .setDepth(51);
    this.add.text(width / 2, chrome.btnY, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '19px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(52);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => this.scene.start('Menu'));

    this.textContainer = this.add.container(0, 0);

    const fontSize = wide ? '14px' : '15px';
    const color = '#b8b8d0';
    let y = headerH + 16;

    const addLine = (str, opts) => {
      opts = opts || {};
      const t = this.add.text(left, y, str, {
        fontFamily: 'Arial',
        fontSize: opts.fontSize || fontSize,
        color: opts.color || color,
        wordWrap: { width: maxW },
        lineSpacing: 2
      }).setOrigin(0, 0);
      this.textContainer.add(t);
      y += t.height + (opts.gap != null ? opts.gap : 6);
      return t;
    };

    const addIconRow = (drawFn, iconColor, text) => {
      const iconSize = wide ? 12 : 13;
      const g = this.add.graphics();
      g.setPosition(left + iconSize + 2, y + iconSize + 2);
      if (drawFn) drawFn(g, iconColor, iconSize);
      this.textContainer.add(g);

      const t = this.add.text(left + iconSize * 2 + 16, y, text, {
        fontFamily: 'Arial',
        fontSize: fontSize,
        color: color,
        wordWrap: { width: maxW - iconSize * 2 - 20 },
        lineSpacing: 2
      }).setOrigin(0, 0);
      this.textContainer.add(t);
      y += Math.max(t.height, iconSize * 2 + 8) + 10;
    };

    addLine('Цель — убрать все стрелки с поля.', { gap: 12 });

    addLine('• Тапай по стрелке, если путь свободен.', { gap: 2 });
    addLine('  Стрелка улетает в сторону наконечника.', { gap: 12 });

    addLine('• Стена блокирует путь — стрелка', { gap: 2 });
    addLine('  через неё не проходит.', { gap: 12 });

    // Key / lock — same vector icons as on the board (no emoji)
    addIconRow(
      window.drawKeyIcon,
      0xffd166,
      'Ключ нужно убрать раньше замка того же цвета.'
    );
    addIconRow(
      window.drawLockIcon,
      0xff6b6b,
      'Замок нельзя снять, пока на поле есть ключ.'
    );

    addIconRow(
      window.drawRotateIcon,
      0xffe066,
      'Двухходовая стрелка: 1-й тап — поворот 90°, 2-й — уход.'
    );

    addLine('• Ошибки исчерпаны — перезапуск уровня.', { gap: 4 });
    addLine('• Есть таймер на уровень.', { gap: 4 });
    addLine('Цепочка и мастерство:', { color: '#ffd166', fontSize: wide ? '16px' : '17px', gap: 4 });
    addLine('  Убирай стрелки быстро и без ошибок.', { gap: 2 });
    addLine('  Несколько безопасных ходов подряд', { gap: 2 });
    addLine('  образуют цепочку и добавляют время.', { gap: 2 });
    addLine('  Ошибка или пауза сбрасывает ритм.', { gap: 12 });
    addLine('Мастерство — твой лучший комбо-результат', { color: '#00e8c8', gap: 2 });
    addLine('на уровне. Оно открывает достижения.', { color: '#00e8c8', gap: 12 });

    addLine('Звёзды:', { gap: 4 });
    addLine('  0 ошибок → ★★★', { gap: 2 });
    addLine('  1 ошибка → ★★', { gap: 2 });
    addLine('  2+ ошибки → ★', { gap: 12 });

    addLine('Этапы по 10 уровней. Чтобы открыть', { gap: 2 });
    addLine('следующий этап, нужно 25 ★.', { gap: 12 });

    addLine('Прогресс (уровни, звёзды, стили,', { gap: 2 });
    addLine('достижения) синхронизируется', { gap: 2 });
    addLine('между Android, iOS и Web через', { gap: 2 });
    addLine('облако VK (аккаунт пользователя).', { gap: 12 });

    addLine('Поддержка: кнопка «ПОДДЕРЖКА» в меню', { gap: 2 });
    addLine('— сообщество VK и email.', { gap: 16 });

    const contentH = y + 20;
    const maxScroll = Math.max(0, contentH - (height - footerH));
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    const maskG = this.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(0, headerH, width, height - headerH - footerH);
    this.textContainer.setMask(maskG.createGeometryMask());

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
      this.textContainer.y = Math.round(this.scrollY);
    });
    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (maxScroll <= 0) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy * 0.45, -maxScroll, 0);
      this.textContainer.y = Math.round(this.scrollY);
    });
  }
}

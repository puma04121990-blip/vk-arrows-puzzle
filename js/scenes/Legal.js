class LegalScene extends Phaser.Scene {
  constructor() {
    super('Legal');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    // Absolute production URLs — always open for moderators / users
    this.DOCS = {
      terms: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/terms.html',
      privacy: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/privacy.html'
    };

    this.view = 'list'; // list | terms | privacy
    this.scrollY = 0;
    this.contentContainer = null;

    this.headerH = wide ? 56 : 72;
    this.footerH = wide ? 56 : 72;
    this.wide = wide;

    this.drawChrome();
    this.showList();
  }

  drawChrome() {
    const { width, height } = this.scale;
    const wide = this.wide;

    this.headerBg = this.add.rectangle(width / 2, this.headerH / 2, width, this.headerH, 0x0b0b14, 1).setDepth(50);
    this.titleText = this.add.text(width / 2, this.headerH / 2, 'ПРАВОВАЯ ИНФОРМАЦИЯ', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '18px' : '22px',
      color: '#00e8c8',
      wordWrap: { width: width - 40 },
      align: 'center'
    }).setOrigin(0.5).setDepth(51);

    this.footerBg = this.add.rectangle(width / 2, height - this.footerH / 2, width, this.footerH, 0x0b0b14, 1).setDepth(50);
    this.backBtn = this.add.rectangle(width / 2, height - this.footerH / 2, 200, wide ? 40 : 48, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
      .setInteractive({ useHandCursor: true })
      .setDepth(51);
    this.backLabel = this.add.text(width / 2, height - this.footerH / 2, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '19px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(52);

    this.backBtn.on('pointerover', () => this.backBtn.setFillStyle(0x222238));
    this.backBtn.on('pointerout', () => this.backBtn.setFillStyle(0x1a1a28));
    this.backBtn.on('pointerup', () => this.onBack());
  }

  onBack() {
    if (this.view === 'list') {
      this.scene.start('Menu');
      return;
    }
    this.showList();
  }

  clearContent() {
    if (this.contentContainer) {
      this.contentContainer.destroy(true);
      this.contentContainer = null;
    }
    this.scrollY = 0;
    if (this._scrollBound) {
      this.input.off('pointerdown', this._onDown);
      this.input.off('pointerup', this._onUp);
      this.input.off('pointermove', this._onMove);
      this.input.off('wheel', this._onWheel);
      this._scrollBound = false;
    }
  }

  showList() {
    this.clearContent();
    this.view = 'list';
    this.titleText.setText('ПРАВОВАЯ ИНФОРМАЦИЯ');
    this.backLabel.setText('← МЕНЮ');

    const { width } = this.scale;
    const wide = this.wide;
    this.contentContainer = this.add.container(0, 0);

    let y = this.headerH + 18;

    const sub = this.add.text(width / 2, y, '«Пульс стрелок» · Возраст 0+', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#6a6a82'
    }).setOrigin(0.5);
    this.contentContainer.add(sub);
    y += 36;

    const items = [
      {
        title: 'Пользовательское соглашение',
        desc: 'Читать в игре или открыть в браузере',
        kind: 'terms'
      },
      {
        title: 'Политика конфиденциальности',
        desc: 'Читать в игре или открыть в браузере',
        kind: 'privacy'
      }
    ];

    const cardW = Math.min(width - 40, 520);
    const cardH = wide ? 68 : 76;

    items.forEach((item) => {
      const bg = this.add.rectangle(width / 2, y, cardW, cardH, 0x161622)
        .setStrokeStyle(2, 0x2a2a40)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(bg);

      const t = this.add.text(width / 2 - cardW / 2 + 16, y - 12, item.title, {
        fontFamily: 'Arial Black, Arial',
        fontSize: wide ? '15px' : '16px',
        color: '#e0e0f0',
        wordWrap: { width: cardW - 48 }
      }).setOrigin(0, 0.5);
      this.contentContainer.add(t);

      const d = this.add.text(width / 2 - cardW / 2 + 16, y + 14, item.desc, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#6a6a82',
        wordWrap: { width: cardW - 48 }
      }).setOrigin(0, 0.5);
      this.contentContainer.add(d);

      const arrow = this.add.text(width / 2 + cardW / 2 - 16, y, '›', {
        fontSize: '22px',
        color: '#00e8c8'
      }).setOrigin(0.5);
      this.contentContainer.add(arrow);

      bg.on('pointerover', () => bg.setFillStyle(0x1c1c2c));
      bg.on('pointerout', () => bg.setFillStyle(0x161622));
      bg.on('pointerup', () => this.showDoc(item.kind));

      y += cardH + 12;
    });

    // External open buttons
    const openTerms = this.add.text(width / 2, y + 8, 'Открыть соглашение в браузере ↗', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#00e8c8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.contentContainer.add(openTerms);
    openTerms.on('pointerup', () => this.openExternal(this.DOCS.terms));
    y += 28;

    const openPriv = this.add.text(width / 2, y + 4, 'Открыть политику в браузере ↗', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#00e8c8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.contentContainer.add(openPriv);
    openPriv.on('pointerup', () => this.openExternal(this.DOCS.privacy));
    y += 36;

    const note = [
      'Игра бесплатна. Прогресс (уровни, звёзды, стили,',
      'достижения) синхронизируется между Android, iOS',
      'и Web через VK Storage (аккаунт пользователя).',
      'Отдельной серверной базы у разработчика нет.',
      'Начиная игру, вы принимаете соглашение и политику.'
    ].join('\n');

    const noteText = this.add.text(width / 2, y, note, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#505068',
      align: 'center',
      lineSpacing: 3,
      wordWrap: { width: Math.min(width - 40, 520) }
    }).setOrigin(0.5, 0);
    this.contentContainer.add(noteText);

    this.bindScroll(y + noteText.height + 24);
  }

  showDoc(kind) {
    this.clearContent();
    this.view = kind;
    this.titleText.setText(kind === 'terms' ? 'СОГЛАШЕНИЕ' : 'КОНФИДЕНЦИАЛЬНОСТЬ');
    this.backLabel.setText('← НАЗАД');

    const { width } = this.scale;
    const wide = this.wide;
    this.contentContainer = this.add.container(0, 0);

    const body = kind === 'terms' ? this.termsBody() : this.privacyBody();
    const text = this.add.text(width / 2, this.headerH + 12, body, {
      fontFamily: 'Arial',
      fontSize: wide ? '13px' : '14px',
      color: '#b8b8d0',
      align: 'left',
      lineSpacing: 3,
      wordWrap: { width: Math.min(width - 40, 560) }
    }).setOrigin(0.5, 0);
    this.contentContainer.add(text);

    const open = this.add.text(width / 2, this.headerH + 20 + text.height + 16, 'Открыть полную версию в браузере ↗', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#00e8c8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.contentContainer.add(open);
    open.on('pointerup', () => this.openExternal(kind === 'terms' ? this.DOCS.terms : this.DOCS.privacy));

    this.bindScroll(this.headerH + 20 + text.height + 48);
  }

  bindScroll(contentBottom) {
    const { height } = this.scale;
    const maxScroll = Math.max(0, contentBottom - (height - this.footerH));
    this.scrollY = 0;
    let dragging = false;
    let lastY = 0;

    this._onDown = (p) => { dragging = true; lastY = p.y; };
    this._onUp = () => { dragging = false; };
    this._onMove = (p) => {
      if (!dragging || maxScroll <= 0 || !this.contentContainer) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -maxScroll, 0);
      this.contentContainer.y = this.scrollY;
    };
    this._onWheel = (pointer, over, dx, dy) => {
      if (maxScroll <= 0 || !this.contentContainer) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy * 0.5, -maxScroll, 0);
      this.contentContainer.y = this.scrollY;
    };

    this.input.on('pointerdown', this._onDown);
    this.input.on('pointerup', this._onUp);
    this.input.on('pointermove', this._onMove);
    this.input.on('wheel', this._onWheel);
    this._scrollBound = true;
  }

  openExternal(url) {
    if (window.isVK && typeof vkBridge !== 'undefined') {
      vkBridge.send('VKWebAppOpenURL', { url }).catch(() => {
        try { window.open(url, '_blank'); } catch (e) {}
      });
    } else {
      try { window.open(url, '_blank'); } catch (e) {}
    }
  }

  termsBody() {
    return [
      'Пользовательское соглашение',
      '«Пульс стрелок» · Редакция от 07.08.2026',
      '',
      '1. Принимая условия (запуск игры), пользователь',
      'соглашается с Соглашением и Политикой',
      'конфиденциальности.',
      '',
      '2. «Пульс стрелок» — бесплатная логическая',
      'головоломка: убирайте стрелки с поля с учётом',
      'направления, стен, ключей/замков и таймера.',
      '',
      '3. Прогресс (уровни, звёзды, стили, достижения)',
      'сохраняется локально и синхронизируется между',
      'платформами Android, iOS, Mob.Web и Web через',
      'VK Storage (привязка к user_id аккаунта VK).',
      '',
      '4. Возраст: 0+. Контент без насилия, эротики',
      'и запрещённых материалов.',
      '',
      '5. Игра предоставляется «как есть». Разработчик',
      'не гарантирует бесперебойную работу на всех',
      'устройствах.',
      '',
      '6. Основной контент доступен бесплатно.',
      '',
      '7. Применимое право — законодательство РФ.',
      '',
      'Полный текст: terms.html на сайте приложения.'
    ].join('\n');
  }

  privacyBody() {
    return [
      'Политика конфиденциальности',
      '«Пульс стрелок» · Редакция от 07.08.2026',
      '',
      '1. Оператор данных, обрабатываемых игрой —',
      'разработчик мини-приложения «Пульс стрелок».',
      '',
      '2. Какие данные обрабатываются:',
      '• Игровой прогресс (уровни, звёзды, стили,',
      '  достижения) — localStorage + VK Storage',
      '  (облако платформы VK, привязка к user_id).',
      '• Имя (first_name) через VKWebAppGetUserInfo',
      '  только для приветствия в меню, не уходит',
      '  на серверы разработчика.',
      '',
      '3. Не собираем: телефон, email, геолокацию,',
      'друзей, сообщения, фото, платёжные данные.',
      'Сторонней аналитики и рекламных трекеров нет.',
      '',
      '4. Цели: работа игры, синхронизация прогресса',
      'между платформами, приветствие, соблюдение',
      'правил VK.',
      '',
      '5. Разработчик не продаёт и не передаёт данные',
      'третьим лицам. Инфраструктура хранения — VK.',
      '',
      '6. Удаление: очистка данных WebView/браузера',
      'и/или хранилища VK Storage платформой.',
      'Отдельной БД у разработчика нет.',
      '',
      'Полный текст: privacy.html на сайте приложения.'
    ].join('\n');
  }
}

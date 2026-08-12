// ============================================
// Сцена магазина — товары за голоса VK
// Цена обязательно на кнопке (требование ВК)
// ============================================

class ShopScene extends Phaser.Scene {
  constructor() {
    super('Shop');
  }

  create() {
    const { width, height } = this.scale;
    const wide = width >= height;
    this.busy = false;
    this.cards = [];

    if (window.drawAppBackground) {
      window.drawAppBackground(this, width, height);
    } else {
      this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);
    }

    const headerH = wide ? 72 : 96;
    const footerH = wide ? 56 : 72;

    this.add.rectangle(width / 2, headerH / 2, width, headerH, 0x0b0b14, 0.92).setDepth(40);
    this.add.text(width / 2, wide ? 22 : 30, 'МАГАЗИН', {
      fontFamily: 'Arial Black, Arial',
      fontSize: wide ? '24px' : '28px',
      color: '#ffd166'
    }).setOrigin(0.5).setDepth(41);

    this.statusText = this.add.text(width / 2, wide ? 48 : 62, this.buildStatusLine(), {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#8a8aa8',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5).setDepth(41);

    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 0.95).setDepth(40);
    const menuBtn = this.add.rectangle(width / 2, height - footerH / 2, 200, wide ? 40 : 48, 0x1a1a28)
      .setStrokeStyle(2, 0x2e2e48)
      .setInteractive({ useHandCursor: true })
      .setDepth(41);
    this.add.text(width / 2, height - footerH / 2, '← МЕНЮ', {
      fontFamily: 'Arial',
      fontSize: wide ? '16px' : '18px',
      color: '#9a9ab8'
    }).setOrigin(0.5).setDepth(42);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x222238));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x1a1a28));
    menuBtn.on('pointerup', () => {
      if (this.busy) return;
      this.scene.start('Menu');
    });

    const items = window.SHOP_ITEMS || [];
    const cols = wide ? 2 : 1;
    const cardW = wide ? Math.min(520, (width - 56) / 2) : Math.min(640, width - 40);
    const cardH = wide ? 92 : 100;
    const gapX = 14;
    const gapY = wide ? 10 : 12;
    const startY = headerH + cardH / 2 + 10;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (width - totalW) / 2 + cardW / 2;

    this.scrollRoot = this.add.container(0, 0);

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.cards.push(this.makeCard(x, y, cardW, cardH, item));
    });

    const contentBottom = startY + Math.ceil(items.length / cols) * (cardH + gapY);
    if (contentBottom > height - footerH - 8) {
      this.input.on('wheel', (pointer, over, dx, dy) => {
        this.scrollRoot.y = Phaser.Math.Clamp(this.scrollRoot.y - dy * 0.4, -(contentBottom - (height - footerH)), 0);
      });
      let dragY = null;
      this.input.on('pointerdown', (p) => { dragY = p.y; });
      this.input.on('pointermove', (p) => {
        if (dragY == null || !p.isDown) return;
        const dy = p.y - dragY;
        dragY = p.y;
        this.scrollRoot.y = Phaser.Math.Clamp(this.scrollRoot.y + dy, -(contentBottom - (height - footerH)), 0);
      });
      this.input.on('pointerup', () => { dragY = null; });
    }

    this.note = this.add.text(width / 2, height - footerH - 10, 'Оплата голосами ВК · цена указана на кнопке', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#4a4a62'
    }).setOrigin(0.5).setDepth(41);
  }

  buildStatusLine() {
    const hints = window.getHints ? window.getHints() : 0;
    const bonus = window.getBonusMaxMistakes ? window.getBonusMaxMistakes() : 0;
    const noAds = window.hasNoAds && window.hasNoAds();
    const parts = ['Подсказки: ' + hints];
    if (bonus > 0) parts.push('Ошибки +' + bonus);
    if (noAds) parts.push('Без рекламы');
    return parts.join('  ·  ');
  }

  makeCard(x, y, w, h, item) {
    const owned = this.isOwned(item.id);
    const container = this.add.container(x, y);
    this.scrollRoot.add(container);

    const bg = this.add.graphics();
    bg.fillStyle(0x161622, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, owned ? 0x2a5a48 : 0x2e2e48, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

    const icon = this.add.text(-w / 2 + 22, 0, item.icon || '•', {
      fontSize: '28px'
    }).setOrigin(0.5);

    const title = this.add.text(-w / 2 + 48, -16, item.title, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#e8e8f8'
    }).setOrigin(0, 0.5);

    const desc = this.add.text(-w / 2 + 48, 8, item.desc, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#7a7a92',
      wordWrap: { width: w - 170 }
    }).setOrigin(0, 0.5);

    const priceLabel = owned
      ? 'КУТО'
      : (window.formatVotesPrice ? window.formatVotesPrice(item.price) : (item.price + ' гол.'));

    const btnW = 110;
    const btnH = 36;
    const btnX = w / 2 - btnW / 2 - 12;
    const btnBg = this.add.graphics();
    const btnColor = owned ? 0x2a3a34 : 0xffd166;
    btnBg.fillStyle(btnColor, 1);
    btnBg.fillRoundedRect(btnX - btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);

    const btnText = this.add.text(btnX, 0, priceLabel, {
      fontFamily: 'Arial Black, Arial',
      fontSize: owned ? '12px' : '13px',
      color: owned ? '#7a9a88' : '#0b0b14'
    }).setOrigin(0.5);

    container.add([bg, icon, title, desc, btnBg, btnText]);
    container.setSize(w, h);

    if (!owned) {
      const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
      container.add(hit);
      hit.on('pointerup', () => this.onBuy(item.id));
    }

    container.itemId = item.id;
    container.btnBg = btnBg;
    container.btnText = btnText;
    container.btnW = btnW;
    container.btnH = btnH;
    container.btnX = btnX;
    container.owned = owned;
    return container;
  }

  isOwned(id) {
    if (id === 'remove_ads') return !!(window.hasNoAds && window.hasNoAds());
    if (id === 'skin_pack') {
      return (window.ARROW_SKINS || []).every((s) => {
        if (!s || s.free) return true;
        return window.isSkinUnlocked && window.isSkinUnlocked(s.id);
      });
    }
    return false;
  }

  onBuy(itemId) {
    if (this.busy) return;
    if (this.isOwned(itemId)) return;

    const item = window.getShopItem && window.getShopItem(itemId);
    if (!item) return;

    this.busy = true;
    this.statusText.setText('Открываем оплату…');
    this.statusText.setColor('#ffd166');

    const buy = window.buyWithVotes
      ? window.buyWithVotes(itemId)
      : Promise.resolve({ ok: false, reason: 'no_payments' });

    buy.then((res) => {
      this.busy = false;
      if (res && res.ok) {
        this.statusText.setText('Куплено: ' + item.title);
        this.statusText.setColor('#00e8c8');
        this.refreshOwnedState();
        this.time.delayedCall(1600, () => {
          this.statusText.setText(this.buildStatusLine());
          this.statusText.setColor('#8a8aa8');
        });
      } else {
        let msg = 'Покупка отменена';
        if (res && res.reason === 'already_owned') msg = 'Уже куплено';
        else if (res && res.reason === 'payment_unavailable') {
          msg = 'Оплата недоступна. Нужен callback-сервер в настройках ВК';
        } else if (res && res.reason === 'item_not_found') msg = 'Товар не найден';
        this.statusText.setText(msg);
        this.statusText.setColor('#ff8a8a');
        this.time.delayedCall(2200, () => {
          this.statusText.setText(this.buildStatusLine());
          this.statusText.setColor('#8a8aa8');
        });
      }
    }).catch(() => {
      this.busy = false;
      this.statusText.setText('Ошибка оплаты');
      this.statusText.setColor('#ff8a8a');
      this.time.delayedCall(1800, () => {
        this.statusText.setText(this.buildStatusLine());
        this.statusText.setColor('#8a8aa8');
      });
    });
  }

  refreshOwnedState() {
    this.cards.forEach((card) => {
      const owned = this.isOwned(card.itemId);
      if (owned && !card.owned) {
        card.owned = true;
        card.btnBg.clear();
        card.btnBg.fillStyle(0x2a3a34, 1);
        card.btnBg.fillRoundedRect(
          card.btnX - card.btnW / 2,
          -card.btnH / 2,
          card.btnW,
          card.btnH,
          card.btnH / 2
        );
        card.btnText.setText('КУТО');
        card.btnText.setColor('#7a9a88');
        card.btnText.setFontSize('12px');
      }
    });
  }
}

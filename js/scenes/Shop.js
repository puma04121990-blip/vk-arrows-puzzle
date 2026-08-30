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

    const chrome = window.pulseChrome ? window.pulseChrome(this) : { headerH: wide ? 72 : 88, footerH: wide ? 92 : 108, btnY: height - 44, btnH: wide ? 40 : 46 };
    const headerH = chrome.headerH;
    const noteH = 18;
    const footerH = chrome.footerH + noteH;

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

    this.add.rectangle(width / 2, height - footerH / 2, width, footerH, 0x0b0b14, 0.98).setDepth(40);
    const fromGame = window.__pulseShopFrom === 'Game' || this.scene.isSleeping('Game') || this.scene.isPaused('Game');
    const backLabel = fromGame ? '← К ИГРЕ' : '← МЕНЮ';
    const btnY = chrome.btnY;
    if (window.pulseBackButton) {
      window.pulseBackButton(this, () => {
        if (this.busy) return;
        if (window.pulseLeaveShop) window.pulseLeaveShop(fromGame ? 'Game' : 'Menu');
        else this.scene.start(fromGame ? 'Game' : 'Menu');
      }, {
        chrome: chrome,
        y: btnY,
        label: backLabel,
        w: fromGame ? 240 : 220,
        primary: !!fromGame,
        depth: 41
      });
    } else {
      const menuBtn = this.add.rectangle(width / 2, btnY, fromGame ? 240 : 200, wide ? 40 : 46, fromGame ? 0x00e8c8 : 0x1a1a28)
        .setStrokeStyle(2, fromGame ? 0x00e8c8 : 0x2e2e48)
        .setInteractive({ useHandCursor: true })
        .setDepth(41);
      this.add.text(width / 2, btnY, backLabel, {
        fontFamily: 'Arial', fontSize: wide ? '16px' : '18px', color: fromGame ? '#0b0b14' : '#9a9ab8'
      }).setOrigin(0.5).setDepth(42);
      menuBtn.on('pointerup', () => {
        if (this.busy) return;
        if (window.pulseLeaveShop) window.pulseLeaveShop(fromGame ? 'Game' : 'Menu');
        else this.scene.start(fromGame ? 'Game' : 'Menu');
      });
    }
    this.note = this.add.text(width / 2, btnY - ((chrome.btnH || 42) / 2) - 12, 'Оплата голосами ВК · цена на кнопке', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#6a6a82'
    }).setOrigin(0.5, 1).setDepth(41);

    const items = window.SHOP_ITEMS || [];
    const cols = wide ? 2 : 1;
    const cardW = wide ? Math.min(520, (width - 56) / 2) : Math.min(640, width - 40);
    const cardH = wide ? 86 : 82;
    const gapX = 14;
    const gapY = wide ? 8 : 8;
    const startY = headerH + cardH / 2 + 14;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (width - totalW) / 2 + cardW / 2;

    this.scrollRoot = this.add.container(0, 0);
    this.scrollRoot.setDepth(10);
    const listMask = this.make.graphics({ x: 0, y: 0, add: false });
    listMask.fillStyle(0xffffff);
    listMask.fillRect(0, headerH, width, Math.max(40, height - headerH - footerH));
    this.scrollRoot.setMask(listMask.createGeometryMask());

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const isLastSingleWide = wide && items.length % 2 === 1 && i === items.length - 1;
      const itemW = isLastSingleWide ? totalW : cardW;
      const x = isLastSingleWide ? width / 2 : startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.cards.push(this.makeCard(x, y, itemW, cardH, item));
    });

    const rows = Math.ceil(items.length / cols);
    const contentBottom = startY + (rows - 1) * (cardH + gapY) + cardH / 2 + 12;
    const listBottom = height - footerH;
    const maxScroll = Math.max(0, contentBottom - listBottom);
    if (window.pulseBindScroll) {
      window.pulseBindScroll(this, this.scrollRoot, {
        headerH: headerH, footerTop: listBottom, maxScroll: maxScroll
      });
    }
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
    const active = this.isTemporarilyActive(item.id);
    const unavailable = owned || active;
    const container = this.add.container(x, y);
    this.scrollRoot.add(container);

    const bg = this.add.graphics();
    bg.fillStyle(0x161622, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, owned ? 0x2a5a48 : (active ? 0x5a4a22 : 0x2e2e48), 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

    const iconSize = Math.min(48, h - 20);
    const iconX = -w / 2 + 12 + iconSize / 2;
    let icon;
    if (item.tex && this.textures.exists(item.tex)) {
      icon = this.add.image(iconX, 0, item.tex);
      icon.setDisplaySize(iconSize, iconSize);
    } else {
      icon = this.add.text(iconX, 2, item.icon || '•', { fontSize: '26px' }).setOrigin(0.5);
    }

    const textX = -w / 2 + 20 + iconSize;
    const title = this.add.text(textX, -16, item.title, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#e8e8f8'
    }).setOrigin(0, 0.5);

    const btnW = 136;
    const btnH = 38;
    const desc = this.add.text(textX, 8, item.desc, {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '12px',
      color: '#7a7a92',
      wordWrap: { width: w - btnW - iconSize - 48 }
    }).setOrigin(0, 0.5);

    const priceLabel = owned
      ? 'КУПЛЕНО'
      : (active ? 'АКТИВНО' : (window.formatVotesPrice ? window.formatVotesPrice(item.price) : (item.price + ' гол.')));

    const btnX = w / 2 - btnW / 2 - 14;
    const btnBg = this.add.graphics();
    const btnColor = owned ? 0x2a3a34 : (active ? 0x4a4026 : 0xffd166);
    btnBg.fillStyle(btnColor, 1);
    btnBg.fillRoundedRect(btnX - btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);

    const btnText = this.add.text(btnX, 0, priceLabel, {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif',
      fontSize: unavailable ? '11px' : '13px',
      color: owned ? '#7a9a88' : (active ? '#e0c878' : '#0b0b14')
    }).setOrigin(0.5);

    container.add([bg, icon, title, desc, btnBg, btnText]);
    container.setSize(w, h);

    let hit = null;
    if (!unavailable) {
      hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
      container.add(hit);
      hit.on('pointerup', () => {
        if (window.pulseWasDrag && window.pulseWasDrag(this)) return;
        this.onBuy(item.id);
      });
    }

    container.itemId = item.id;
    container.btnBg = btnBg;
    container.btnText = btnText;
    container.btnW = btnW;
    container.btnH = btnH;
    container.btnX = btnX;
    container.owned = owned;
    container.active = active;
    container.unavailable = unavailable;
    container.hit = hit;
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

  isTemporarilyActive(id) {
    return false;
  }

  onBuy(itemId) {
    if (this.busy) return;
    if (this.isOwned(itemId)) return;
    if (this.isTemporarilyActive(itemId)) {
      this.showTransientStatus('Бонус уже активен для следующего уровня', '#ffd166');
      return;
    }

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
        else if (res && res.reason === 'already_active') msg = 'Бонус уже активен для следующего уровня';
        else if (res && res.reason === 'payment_unconfirmed') msg = 'Оплата не подтверждена VK';
        else if (res && res.reason === 'grant_failed') msg = 'Платёж принят, но награда не выдана — обратитесь в поддержку';
        else if (res && res.reason === 'payment_unavailable') {
          msg = 'Оплата недоступна. В кабинете VK укажите callback https://ХОСТ/vk/payments';
        } else if (res && res.reason === 'callback_missing') {
          msg = 'VK не получил товар. Проверьте callback /vk/payments и VK_APP_SECRET';
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

  showTransientStatus(text, color) {
    this.statusText.setText(text);
    this.statusText.setColor(color || '#8a8aa8');
    this.time.delayedCall(1800, () => {
      this.statusText.setText(this.buildStatusLine());
      this.statusText.setColor('#8a8aa8');
    });
  }

  refreshOwnedState() {
    this.cards.forEach((card) => {
      const owned = this.isOwned(card.itemId);
      const active = this.isTemporarilyActive(card.itemId);
      if ((owned || active) && !card.unavailable) {
        card.owned = owned;
        card.active = active;
        card.unavailable = true;
        if (card.hit) { try { card.hit.disableInteractive(); } catch (e) {} }
        card.btnBg.clear();
        card.btnBg.fillStyle(owned ? 0x2a3a34 : 0x4a4026, 1);
        card.btnBg.fillRoundedRect(card.btnX - card.btnW / 2, -card.btnH / 2, card.btnW, card.btnH, card.btnH / 2);
        card.btnText.setText(owned ? 'КУПЛЕНО' : 'АКТИВНО');
        card.btnText.setColor(owned ? '#7a9a88' : '#e0c878');
        card.btnText.setFontSize('11px');
      }
    });
  }
}

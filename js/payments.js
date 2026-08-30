// ============================================
// Магазин за голоса VK
// VKWebAppShowOrderBox + выдача товаров
//
// Важно для продакшена:
// 1) В настройках приложения указать «Адрес обратного вызова»
//    (сервер обрабатывает get_item / order_status).
// 2) Без callback-сервера реальные списания голосов
//    у обычных игроков не пройдут — только тестовый режим.
// 3) На кнопке ОБЯЗАТЕЛЬНО видна цена в голосах (правило ВК).
// ============================================

window.SHOP_ITEMS = [
  {
    id: 'hints_3',
    title: '3 подсказки',
    desc: 'Подсветка безопасной стрелки',
    icon: '💡',
    price: 3,
    category: 'hints'
  },
  {
    id: 'hints_10',
    title: '10 подсказок',
    desc: 'Выгодный пакет',
    icon: '💡',
    price: 7,
    category: 'hints'
  },
  {
    id: 'extra_error',
    title: '+1 ошибка',
    desc: 'Лимит ошибок +1 навсегда',
    icon: '❤️',
    price: 5,
    category: 'lives'
  },
  {
    id: 'extra_error_3',
    title: '+3 ошибки',
    desc: 'Лимит ошибок +3 навсегда',
    icon: '💖',
    price: 12,
    category: 'lives'
  },
  {
    id: 'double_stars',
    title: '×2 звёзды',
    desc: 'Удвоит звёзды на следующем уровне (до 3★)',
    icon: '⭐',
    price: 10,
    category: 'boost'
  },
  {
    id: 'remove_ads',
    title: 'Без рекламы',
    desc: 'Навсегда убрать interstitial',
    icon: '🚫',
    price: 25,
    category: 'premium'
  },
  {
    id: 'skin_pack',
    title: 'Все стили',
    desc: 'Открыть все скины сразу',
    icon: '🎨',
    price: 20,
    category: 'skins'
  }
];

window.getShopItem = function (id) {
  return (window.SHOP_ITEMS || []).find((it) => it.id === id) || null;
};

window.hasNoAds = function () {
  return !!(window.gameProgress && window.gameProgress.noAds);
};

window.getBonusMaxMistakes = function () {
  const n = window.gameProgress && window.gameProgress.bonusMaxMistakes;
  return typeof n === 'number' && n > 0 ? n : 0;
};

window.getEffectiveMaxMistakes = function () {
  // Базовый лимит — одна ошибка; покупки +1 и +3 добавляются сверху.
  return 1 + window.getBonusMaxMistakes();
};

/** Выдача товара после успешной оплаты (или тестового режима). */
window.grantShopItem = function (itemId) {
  if (!window.gameProgress) window.gameProgress = {};
  const p = window.gameProgress;
  if (!p.purchased) p.purchased = {};

  switch (itemId) {
    case 'hints_3':
      p.hints = (p.hints || 0) + 3;
      break;
    case 'hints_10':
      p.hints = (p.hints || 0) + 10;
      break;
    case 'extra_error':
      p.bonusMaxMistakes = (p.bonusMaxMistakes || 0) + 1;
      break;
    case 'extra_error_3':
      p.bonusMaxMistakes = (p.bonusMaxMistakes || 0) + 3;
      break;
    case 'double_stars':
      p.doubleStarsNext = true;
      break;
    case 'remove_ads':
      p.noAds = true;
      break;
    case 'skin_pack':
      if (!p.unlockedSkins) p.unlockedSkins = {};
      (window.ARROW_SKINS || []).forEach((s) => {
        if (s && s.id) p.unlockedSkins[s.id] = true;
      });
      break;
    default:
      console.warn('[ArrowPulse] unknown shop item:', itemId);
      return false;
  }

  p.purchased[itemId] = (p.purchased[itemId] || 0) + 1;
  if (window.persistProgress) {
    try { window.persistProgress(); } catch (e) {}
  }
  return true;
};

/**
 * Покупка за голоса.
 * Возвращает Promise<{ ok, reason?, order_id? }>
 */
window.buyWithVotes = function (itemId) {
  const item = window.getShopItem(itemId);
  if (!item) {
    return Promise.resolve({ ok: false, reason: 'item_not_found' });
  }

  if (itemId === 'remove_ads' && window.hasNoAds()) {
    return Promise.resolve({ ok: false, reason: 'already_owned' });
  }
  if (itemId === 'skin_pack') {
    const allOpen = (window.ARROW_SKINS || []).every((s) => {
      if (!s || s.free) return true;
      return window.isSkinUnlocked && window.isSkinUnlocked(s.id);
    });
    if (allOpen) {
      return Promise.resolve({ ok: false, reason: 'already_owned' });
    }
  }
  if (itemId === 'double_stars' && window.gameProgress && window.gameProgress.doubleStarsNext) {
    return Promise.resolve({ ok: false, reason: 'already_active' });
  }

  const isVK = typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function' && window.isVK;

  if (!isVK) {
    window.grantShopItem(itemId);
    return Promise.resolve({ ok: true, reason: 'test_mode' });
  }

  return vkBridge.send('VKWebAppShowOrderBox', {
    type: 'item',
    item: itemId
  })
    .then((data) => {
      // VK Bridge returns { status: 'success', order_id } for a confirmed order.
      // Keep the legacy `success: true` shape for compatibility with older mocks.
      const status = data && data.status;
      const confirmed = !!(data && (status === 'success' || data.success === true));
      if (confirmed) {
        const orderId = data.order_id || data.orderId || null;
        const granted = window.grantShopItem(itemId);
        if (!granted) return { ok: false, reason: 'grant_failed', order_id: orderId };
        window.lastPaymentOrder = { itemId, order_id: orderId, status: 'success', at: Date.now() };
        return { ok: true, order_id: orderId };
      }
      if (status === 'cancel' || status === 'cancelled') {
        return { ok: false, reason: 'cancelled' };
      }
      return { ok: false, reason: 'payment_unconfirmed', status: status || 'unknown' };
    })
    .catch((err) => {
      console.warn('[ArrowPulse] ShowOrderBox failed:', err);
      const data = err && err.error_data ? err.error_data : {};
      const code = data.error_code;
      const reason = String(data.error_reason || data.error_msg || '');
      if (code === 4 || code === 6) {
        return { ok: false, reason: 'cancelled' };
      }
      if (/callback|get_item|not found|item/i.test(reason) || code === 20) {
        return { ok: false, reason: 'callback_missing', error: err };
      }
      return { ok: false, reason: 'payment_unavailable', error: err };
    });
};

window.formatVotesPrice = function (n) {
  const v = n | 0;
  if (v === 1) return '1 голос';
  if (v >= 2 && v <= 4) return v + ' голоса';
  return v + ' голосов';
};

/** Списать одну подсказку. true если списана. */
window.spendHint = function () {
  if (!window.gameProgress) window.gameProgress = {};
  const n = window.gameProgress.hints || 0;
  if (n <= 0) return false;
  window.gameProgress.hints = n - 1;
  if (window.persistProgress) {
    try { window.persistProgress(); } catch (e) {}
  }
  return true;
};

/** Добавить подсказки (магазин / награда). */
window.addHints = function (count) {
  if (!window.gameProgress) window.gameProgress = {};
  const n = Math.max(0, count | 0);
  window.gameProgress.hints = (window.gameProgress.hints || 0) + n;
  if (window.persistProgress) {
    try { window.persistProgress(); } catch (e) {}
  }
  return window.gameProgress.hints;
};

// ============================================
// Хуки магазина поверх progress/Game (v87)
// Подключается после progress.js и payments.js
// ============================================

(function () {
  function ensureShopFields() {
    if (!window.gameProgress) window.gameProgress = {};
    const p = window.gameProgress;
    if (typeof p.noAds !== 'boolean') p.noAds = !!p.noAds;
    if (typeof p.bonusMaxMistakes !== 'number') p.bonusMaxMistakes = p.bonusMaxMistakes || 0;
    if (!p.purchased || typeof p.purchased !== 'object') p.purchased = p.purchased || {};
  }

  const prevPersist = window.persistProgress;
  window.persistProgress = function () {
    ensureShopFields();
    try {
      const key = 'arrow_pulse_progress_v3';
      let data = null;
      try { data = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      if (!data || typeof data !== 'object') data = {};
      data.noAds = !!window.gameProgress.noAds;
      data.bonusMaxMistakes = window.gameProgress.bonusMaxMistakes || 0;
      data.purchased = window.gameProgress.purchased || {};
      data.hints = window.gameProgress.hints || 0;
      data.doubleStarsNext = !!window.gameProgress.doubleStarsNext;
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    } catch (e) {}
    if (typeof prevPersist === 'function') return prevPersist();
    return Promise.resolve(true);
  };

  const prevLoad = window.loadProgress;
  if (typeof prevLoad === 'function') {
    window.loadProgress = function () {
      return prevLoad().then((gp) => {
        try {
          const raw = localStorage.getItem('arrow_pulse_progress_v3');
          if (raw) {
            const o = JSON.parse(raw);
            if (o && typeof o === 'object') {
              if (o.noAds) window.gameProgress.noAds = true;
              if (typeof o.bonusMaxMistakes === 'number') {
                window.gameProgress.bonusMaxMistakes = Math.max(
                  window.gameProgress.bonusMaxMistakes || 0,
                  o.bonusMaxMistakes
                );
              }
              if (o.purchased && typeof o.purchased === 'object') {
                window.gameProgress.purchased = Object.assign(
                  {},
                  window.gameProgress.purchased || {},
                  o.purchased
                );
              }
            }
          }
        } catch (e) {}
        ensureShopFields();
        return gp;
      });
    };
  }

  ensureShopFields();
})();

// Патч лимита ошибок из покупок
(function patchMaxMistakes() {
  function apply() {
    if (typeof GameScene === 'undefined') {
      setTimeout(apply, 30);
      return;
    }
    const orig = GameScene.prototype.init;
    GameScene.prototype.init = function () {
      if (typeof orig === 'function') orig.apply(this, arguments);
      if (window.getEffectiveMaxMistakes) {
        this.maxMistakes = window.getEffectiveMaxMistakes();
      }
    };
  }
  apply();
})();

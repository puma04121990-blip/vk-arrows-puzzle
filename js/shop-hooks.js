// ============================================
// Хуки магазина + механика подсказок (v88)
// ============================================

(function () {
  function ensureShopFields() {
    if (!window.gameProgress) window.gameProgress = {};
    const p = window.gameProgress;
    if (typeof p.noAds !== 'boolean') p.noAds = !!p.noAds;
    if (typeof p.bonusMaxMistakes !== 'number') p.bonusMaxMistakes = p.bonusMaxMistakes || 0;
    if (!p.purchased || typeof p.purchased !== 'object') p.purchased = p.purchased || {};
    if (typeof p.hints !== 'number') p.hints = p.hints || 0;
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
              if (typeof o.hints === 'number') {
                window.gameProgress.hints = Math.max(
                  window.gameProgress.hints || 0,
                  o.hints
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

// --- Патч GameScene: лимит ошибок + кнопка подсказки ---
(function patchGameScene() {
  function apply() {
    if (typeof GameScene === 'undefined') {
      setTimeout(apply, 30);
      return;
    }

    const origInit = GameScene.prototype.init;
    GameScene.prototype.init = function () {
      if (typeof origInit === 'function') origInit.apply(this, arguments);
      if (window.getEffectiveMaxMistakes) {
        this.maxMistakes = window.getEffectiveMaxMistakes();
      }
    };

    GameScene.prototype.updateHintsUI = function () {
      const n = window.getHints ? window.getHints() : 0;
      const label = '💡 ' + n;
      if (this.hintBtn && this.hintBtn.list) {
        for (let i = 0; i < this.hintBtn.list.length; i++) {
          const c = this.hintBtn.list[i];
          if (c && c.type === 'Text' && c.setText) {
            c.setText(label);
            break;
          }
        }
      }
      if (this.hintBtnLabel && this.hintBtnLabel.setText) {
        this.hintBtnLabel.setText(label);
      }
    };

    GameScene.prototype.showHintToast = function (msg) {
      const { width, height } = this.scale;
      if (this._hintToast) {
        try { this._hintToast.destroy(); } catch (e) {}
        this._hintToast = null;
      }
      const t = this.add.text(width / 2, height * 0.18, msg, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffd166',
        backgroundColor: '#161622',
        padding: { x: 14, y: 8 },
        align: 'center'
      }).setOrigin(0.5).setDepth(90).setAlpha(0);
      this._hintToast = t;
      this.tweens.add({
        targets: t,
        alpha: 1,
        duration: 150,
        yoyo: true,
        hold: 1200,
        onComplete: () => {
          try { t.destroy(); } catch (e) {}
          if (this._hintToast === t) this._hintToast = null;
        }
      });
    };

    GameScene.prototype.useHint = function () {
      if (this.completed || this.failed || this._hintBusy) return;

      const have = window.getHints ? window.getHints() : 0;
      if (have <= 0) {
        this.showHintToast('Нет подсказок. Купите в магазине');
        return;
      }

      let target = null;
      for (let i = 0; i < (this.arrows || []).length; i++) {
        const a = this.arrows[i];
        if (a.removed) continue;
        if (this.isLocked && this.isLocked(a)) continue;
        if (a.rotates && !a.rotated) {
          target = a;
          break;
        }
        if (this.canEscape && this.canEscape(a)) {
          target = a;
          break;
        }
      }

      if (!target) {
        this.showHintToast('Нет безопасных ходов');
        return;
      }

      if (window.spendHint) {
        if (!window.spendHint()) {
          this.showHintToast('Нет подсказок');
          return;
        }
      } else if (window.gameProgress) {
        window.gameProgress.hints = Math.max(0, (window.gameProgress.hints || 0) - 1);
        if (window.persistProgress) window.persistProgress();
      }

      this.updateHintsUI();
      this._hintBusy = true;

      const g = target.graphics;
      if (!g) {
        this._hintBusy = false;
        return;
      }

      const ring = this.add.circle(g.x, g.y, this.cellSize * 0.42, 0xffd166, 0);
      ring.setStrokeStyle(3, 0xffd166, 0.95);
      ring.setDepth(15);

      this.tweens.add({
        targets: ring,
        scale: 1.35,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => { try { ring.destroy(); } catch (e) {} }
      });

      this.tweens.add({
        targets: g,
        scale: 1.22,
        duration: 160,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this._hintBusy = false;
          try { if (g && g.setScale) g.setScale(1); } catch (e) {}
        }
      });

      if (this.playTone) this.playTone(660, 0.06, 'sine', 0.1);
      this.showHintToast('Жми на подсвеченную стрелку');
    };

    const origCreateUI = GameScene.prototype.createUI;
    GameScene.prototype.createUI = function () {
      const { width, height } = this.scale;
      const wide = width >= height;
      const by = height - (wide ? 38 : 54);
      const btnW = wide ? 110 : 118;
      const btnH = wide ? 40 : 46;
      const fontSize = wide ? '13px' : '14px';
      const hints = window.getHints ? window.getHints() : 0;

      if (window.createNiceButton) {
        window.createNiceButton(this, width / 2 - (wide ? 130 : 140), by, '↺ ЗАНОВО', () => this.scene.restart(), {
          w: btnW, h: btnH, color: 0x222238, secondary: true, fontSize: fontSize, depth: 20
        });
        this.hintBtn = window.createNiceButton(
          this,
          width / 2,
          by,
          '💡 ' + hints,
          () => this.useHint(),
          { w: btnW, h: btnH, color: 0x2a4a3a, secondary: true, fontSize: fontSize, depth: 20 }
        );
        window.createNiceButton(this, width / 2 + (wide ? 130 : 140), by, 'МЕНЮ', () => this.scene.start('Menu'), {
          w: btnW, h: btnH, color: 0x222238, secondary: true, fontSize: fontSize, depth: 20
        });
      } else if (typeof origCreateUI === 'function') {
        origCreateUI.apply(this, arguments);
      }

      if (window.createSoundToggle) {
        window.createSoundToggle(this, width - (wide ? 28 : 32), wide ? 22 : 36, {
          size: wide ? 36 : 40, fontSize: wide ? '18px' : '20px', depth: 80
        });
        if (window.createMusicToggle) window.createMusicToggle(this, width - (wide ? 72 : 82), wide ? 22 : 36, {
          size: wide ? 36 : 40, fontSize: wide ? '20px' : '22px', depth: 80
        });
      }
    };

    console.log('[ArrowPulse] shop-hooks: GameScene patched (hints + maxMistakes)');
  }
  apply();
})();

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

  ensureShopFields();
})();

window.pulseOpenShop = function (from, plugin) {
  const src = from === 'Game' ? 'Game' : 'Menu';
  window.__pulseShopFrom = src;
  const game = window.game;
  if (!game) return false;
  const mgr = game.scene;
  const host = plugin || (mgr.getScenes(true)[0] && mgr.getScenes(true)[0].scene);
  if (!host) return false;

  if (src !== 'Game') {
    try { host.start('Shop'); } catch (e) { return false; }
    return true;
  }

  try {
    if (mgr.isActive('Shop')) {
      host.bringToTop('Shop');
    } else if (mgr.isSleeping('Shop') || mgr.isPaused('Shop')) {
      host.wake('Shop');
      host.bringToTop('Shop');
    } else {
      host.launch('Shop');
      host.bringToTop('Shop');
    }
    // Sleep AFTER launch so the shop is on top and the board stops drawing/updating.
    if (mgr.isActive('Game') && !mgr.isSleeping('Game')) {
      host.sleep('Game');
    } else if (mgr.isPaused('Game')) {
      try { host.resume('Game'); } catch (e) {}
      try { host.sleep('Game'); } catch (e) {}
    }
    return true;
  } catch (e) {
    console.warn('[ArrowPulse] openShop failed', e);
    try { host.wake('Game'); } catch (e2) {}
    try { host.resume('Game'); } catch (e2) {}
    return false;
  }
};

window.pulseLeaveShop = function (to) {
  const game = window.game;
  if (!game) return;
  const mgr = game.scene;
  const live = mgr.getScene('Shop') || mgr.getScenes(true)[0];
  const plugin = live && live.scene;
  if (!plugin) return;
  const fromGame = window.__pulseShopFrom === 'Game' || mgr.isSleeping('Game') || mgr.isPaused('Game');
  const dest = to || (fromGame ? 'Game' : 'Menu');
  window.__pulseShopFrom = null;
  try { plugin.stop('Shop'); } catch (e) {}
  if (dest === 'Game') {
    if (mgr.isSleeping('Game')) {
      try { plugin.wake('Game'); } catch (e) {}
    } else if (mgr.isPaused('Game')) {
      try { plugin.resume('Game'); } catch (e) {}
    } else if (!mgr.isActive('Game')) {
      plugin.start('Game');
      return;
    }
    try { plugin.bringToTop('Game'); } catch (e) {}
    const gs = mgr.getScene('Game');
    if (gs && gs.onReturnedFromShop) {
      try { gs.onReturnedFromShop(); } catch (e) {}
    }
    return;
  }
  if (mgr.isSleeping('Game') || mgr.isPaused('Game') || mgr.isActive('Game')) {
    try { plugin.stop('Game'); } catch (e) {}
  }
  plugin.start('Menu');
};

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
      const label = n > 0 ? '💡 ' + n : '💡 МАГАЗИН';
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
      const wide = width >= height;
      // Keep feedback between board and bottom actions instead of over the header/grid.
      const toastY = height - (wide ? 74 : 132);
      const t = this.add.text(width / 2, toastY, msg, {
        fontFamily: 'Manrope, Arial, sans-serif',
        fontSize: wide ? '13px' : '15px',
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
      if (this.completed || this.failed) return;
      const now = Date.now();
      // Only debounce an accidental double-tap; the previous visual pulse must not lock hints.
      if (this._hintLastTap && now - this._hintLastTap < 260) return;
      this._hintLastTap = now;

      const have = window.getHints ? window.getHints() : 0;
      if (have <= 0) {
        this.time.delayedCall(20, () => {
          const ok = window.pulseOpenShop ? window.pulseOpenShop('Game', this.scene) : false;
          if (!ok) {
            window.__pulseShopFrom = 'Game';
            this.scene.launch('Shop');
            this.scene.bringToTop('Shop');
            this.scene.sleep('Game');
          }
        });
        return;
      }

      // During onboarding the correct step is already available and must not consume a paid hint.
      let target = this.coachEnabled && this.coachTarget ? this.coachTarget : null;
      let freeCoachHint = !!target;
      if (!target) {
        for (let i = 0; i < (this.arrows || []).length; i++) {
          const a = this.arrows[i];
          if (a.removed || !a.graphics) continue;
          if (this.isLocked && this.isLocked(a)) continue;
          if (a.rotates && !a.rotated) { target = a; break; }
          if (this.canEscape && this.canEscape(a)) { target = a; break; }
        }
      }

      if (!target || !target.graphics) {
        this.showHintToast('Сейчас нет доступного хода');
        return;
      }

      if (!freeCoachHint && window.spendHint) {
        if (!window.spendHint()) {
          this.showHintToast('Нет подсказок');
          return;
        }
      } else if (!freeCoachHint && window.gameProgress) {
        window.gameProgress.hints = Math.max(0, (window.gameProgress.hints || 0) - 1);
        if (window.persistProgress) window.persistProgress();
      }

      this.updateHintsUI();
      this._hintBusy = false;

      const g = target.graphics;
      if (this._hintRing) {
        try { this.tweens.killTweensOf(this._hintRing); } catch (e) {}
        try { this._hintRing.destroy(); } catch (e) {}
        this._hintRing = null;
      }
      this._hintTarget = target;
      // Never tween Image.scale — sprites are 256px and setDisplaySize is just a tiny scale.
      if (this.fitArrowSprite) this.fitArrowSprite(g, target.spriteSize);
      const ringR = Math.max(12, this.cellSize * 0.48);
      const ring = this.add.circle(g.x, g.y, ringR, 0xffd166, 0.12);
      this._hintRing = ring;
      ring.setStrokeStyle(Math.max(2, this.cellSize * 0.07), 0xffd166, 1);
      ring.setDepth(15);
      this.tweens.add({
        targets: ring,
        scale: 1.16,
        alpha: 0.28,
        duration: 480,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      if (g.setTint && target.color != null) {
        g.setTint(0xfff3c0);
        this.time.delayedCall(200, () => {
          if (!target.removed && g.setTint) g.setTint(target.color);
        });
      }

      if (this.playTone) this.playTone(660, 0.06, 'sine', 0.1);
      this.showHintToast(freeCoachHint ? 'Обучение: нажми на подсвеченную стрелку' : 'Подсказка: нажми на подсвеченную стрелку');
    };

    const origCreateUI = GameScene.prototype.createUI;
    GameScene.prototype.createUI = function () {
      const { width, height } = this.scale;
      const wide = width >= height;
      const dock = window.pulseGameDock ? window.pulseGameDock(this) : null;
      const btnH = this.actionBtnH || (dock ? dock.btnH : (wide ? 40 : 46));
      const btnW = Math.max(100, Math.min(wide ? 124 : 118, Math.floor((width - 24) / 3) - 6));
      const span = Math.min(width - 16, btnW * 3 + (wide ? 20 : 12));
      const leftX = width / 2 - span / 2 + btnW / 2;
      const rightX = width / 2 + span / 2 - btnW / 2;
      const fontSize = btnW < 108 ? '12px' : (wide ? '14px' : '15px');
      const hints = window.getHints ? window.getHints() : 0;
      const maxBy = height - 8 - btnH / 2 - ((dock && dock.webInset) || 0);
      let by = this.actionBtnY || (dock && dock.btnY) || (height - (wide ? 38 : 54));
      if (by > maxBy) by = maxBy;
      if (by < btnH / 2 + 8) by = btnH / 2 + 8;
      this.actionBtnY = by;

      if (window.createNiceButton) {
        window.createNiceButton(this, leftX, by, '↺ ЗАНОВО', () => this.scene.restart(), {
          w: btnW, h: btnH, color: 0x222238, secondary: true, fontSize: fontSize, depth: 20
        });
        this.hintBtn = window.createNiceButton(
          this,
          width / 2,
          by,
          hints > 0 ? '💡 ' + hints : '💡 МАГАЗИН',
          () => this.useHint(),
          { w: btnW, h: btnH, color: hints > 0 ? 0x2a4a3a : 0x3a2a18, secondary: true, fontSize: fontSize, depth: 20 }
        );
        window.createNiceButton(this, rightX, by, 'МЕНЮ', () => this.scene.start('Menu'), {
          w: btnW, h: btnH, color: 0x222238, secondary: true, fontSize: fontSize, depth: 20
        });
      } else if (typeof origCreateUI === 'function') {
        origCreateUI.apply(this, arguments);
      }
    };

    GameScene.prototype.onReturnedFromShop = function () {
      if (window.getEffectiveMaxMistakes) {
        this.maxMistakes = window.getEffectiveMaxMistakes();
        if (this.updateMistakesUI) this.updateMistakesUI();
      }
      if (this.updateHintsUI) this.updateHintsUI();
    };

    console.log('[ArrowPulse] shop-hooks: GameScene patched (hints + maxMistakes)');
  }
  apply();
})();

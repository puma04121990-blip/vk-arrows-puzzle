class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  create() {
    const { width, height } = this.scale;
    const isDaily = !!(window.gameData && window.gameData.mode === 'daily');
    let stars = (window.gameData && typeof window.gameData.stars === 'number')
      ? Math.max(0, Math.min(3, window.gameData.stars)) : 0;
    let doubleStarsResult = null;
    const mistakes = window.gameData.mistakes || 0;
    const levelIndex = window.gameData.currentLevel;
    const elapsed = window.gameData.elapsed || 0;
    const combo = window.gameData.combo || 0;
    const chainTarget = window.gameData.chainTarget || 3;
    const level = isDaily ? 0 : (levelIndex + 1);
    const levelRetries = (!isDaily && window.gameData && window.gameData.retryLevelIndex === levelIndex)
      ? Math.max(0, window.gameData.levelRetries | 0) : 0;
    const attemptNumber = levelRetries + 1;

    if (!isDaily && window.applyDoubleStarsIfNeeded) {
      stars = window.applyDoubleStarsIfNeeded(stars);
      doubleStarsResult = window.lastDoubleStarsResult || null;
      window.gameData.stars = stars;
    }

    let savePromise = Promise.resolve(true);
    if (isDaily) {
      if (window.saveDailyResult) {
        try { savePromise = Promise.resolve(window.saveDailyResult(stars, mistakes, elapsed)); }
        catch (e) { savePromise = Promise.resolve(false); }
      }
    } else {
      const nextLevel = levelIndex + 1;
      if (window.saveProgress) {
        try { savePromise = Promise.resolve(window.saveProgress(nextLevel, levelIndex, stars)); }
        catch (e) { savePromise = Promise.resolve(false); }
      }
      if (window.trackLevelResult) {
        try { window.trackLevelResult(levelIndex, stars, mistakes, elapsed, combo); } catch (e) {}
      }
    }

    if (window.drawAppBackground) window.drawAppBackground(this, width, height);
    else this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const phrases = ['ПРЕВОСХОДНО!', 'ОТЛИЧНО!', 'СУПЕР!'];
    const phrase = stars >= 3 ? phrases[0] : stars === 2 ? phrases[1] : phrases[2];

    const title = this.add.text(width / 2, height * 0.14, phrase, {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this._savePromise = savePromise;

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: { from: 0.85, to: 1 },
      duration: 280,
      ease: 'Back.easeOut'
    });

    this.add.text(width / 2, height * 0.23, isDaily
      ? 'Ежедневный уровень пройден'
      : ('Уровень ' + level + ' пройден · попытка ' + attemptNumber), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

    if (isDaily && window.getDailyBest) {
      const best = window.getDailyBest();
      this.add.text(width / 2, height * 0.275, 'Рекорд дня: ' + (best.bestStars || stars) + '★', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffd166'
      }).setOrigin(0.5);
    }

    const starY = height * 0.33;
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(width / 2 + (i - 1) * 64, starY, '★', {
        fontSize: '50px',
        color: i < stars ? '#ffd166' : '#2a2a40'
      }).setOrigin(0.5).setScale(0.5).setAlpha(0);

      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: 1,
        duration: 200,
        delay: 120 + i * 90,
        ease: 'Back.easeOut'
      });
    }

    const timeStr = this.formatTime(elapsed);
    const bonusLabel = doubleStarsResult
      ? ('   ·   ×2: ' + doubleStarsResult.from + '★ → ' + doubleStarsResult.to + '★')
      : '';
    this.add.text(width / 2, height * 0.44, 'Ошибок: ' + mistakes + '   ·   Время: ' + timeStr + bonusLabel, {
      fontFamily: 'Manrope, Arial, sans-serif',
      fontSize: '17px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    if (combo > 0) {
      const comboText = combo >= chainTarget ? 'МАСТЕРСТВО: цепочка ' + combo + ' · +время' : 'Лучшая цепочка: ' + combo + '/' + chainTarget;
      this.add.text(width / 2, height * 0.49, comboText, {
        fontFamily: 'Manrope, Arial, sans-serif', fontSize: '15px',
        color: combo >= chainTarget ? '#00e8c8' : '#ffd166', align: 'center', wordWrap: { width: width - 48 }
      }).setOrigin(0.5);
    }

    const masteryTarget = Math.max(3, chainTarget);
    const masteryValue = Math.min(combo, masteryTarget);
    const barW = Math.min(width - 96, 310);
    const barY = height * 0.545;
    const masteryLabel = this.add.text(width / 2, barY - 18, 'МАСТЕРСТВО  ' + masteryValue + '/' + masteryTarget, {
      fontFamily: 'Manrope, Arial Black, Arial, sans-serif', fontSize: '13px',
      color: combo >= masteryTarget ? '#00e8c8' : '#ffd166'
    }).setOrigin(0.5);
    const masteryBar = this.add.graphics();
    const drawMastery = (value) => {
      masteryBar.clear();
      masteryBar.fillStyle(0x151524, 1);
      masteryBar.fillRoundedRect(width / 2 - barW / 2, barY - 6, barW, 12, 6);
      masteryBar.lineStyle(1, 0x3a3a58, 1);
      masteryBar.strokeRoundedRect(width / 2 - barW / 2, barY - 6, barW, 12, 6);
      if (value > 0) {
        masteryBar.fillStyle(combo >= masteryTarget ? 0x00e8c8 : 0xffd166, 1);
        masteryBar.fillRoundedRect(width / 2 - barW / 2 + 2, barY - 4, Math.max(6, (barW - 4) * value / masteryTarget), 8, 4);
      }
    };
    const masteryTween = { value: 0 };
    drawMastery(0);
    this.tweens.add({ targets: masteryTween, value: masteryValue, duration: 560, delay: 420, ease: 'Cubic.easeOut', onUpdate: () => drawMastery(masteryTween.value) });

    const news = window.popNewAchievements ? window.popNewAchievements() : [];
    if (news.length && !isDaily) {
      const a = window.getAchievementById ? window.getAchievementById(news[0]) : null;
      const label = a ? (a.icon + ' ' + a.title) : 'Новое достижение!';
      this.add.text(width / 2, height * 0.61, label, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffd166'
      }).setOrigin(0.5);

      if (news.length > 1) {
        this.add.text(width / 2, height * 0.65, '+ ещё ' + (news.length - 1), {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#6a6a82'
        }).setOrigin(0.5);
      }
    }

    const chrome = window.pulseChrome ? window.pulseChrome(this) : null;
    const btnH = chrome ? Math.min(48, (chrome.btnH || 42) + 4) : 52;
    const gap = 12;
    const menuY = chrome ? chrome.btnY : height * 0.92;
    const midY = menuY - btnH - gap;
    const topY = midY - btnH - gap;

    if (isDaily) {
      this.createButton(width / 2, topY, 'ЕЩЁ РАЗ', 0x00e8c8, () => {
        if (window.startDailyPuzzle) window.startDailyPuzzle();
        this.scene.start('Game');
      }, btnH);
      this.createButton(width / 2, menuY, 'МЕНЮ', 0x222238, () => {
        if (window.gameData) window.gameData.mode = 'campaign';
        this.scene.start('Menu');
      }, btnH);
    } else {
      const isLast = levelIndex >= LEVELS.length - 1;
      const nextIndex = levelIndex + 1;
      const canNext = !isLast && window.isLevelPlayable && window.isLevelPlayable(nextIndex);

      if (!isLast && canNext) {
        this.createButton(width / 2, topY, 'ДАЛЬШЕ →', 0x00e8c8, () => {
          window.gameData.currentLevel++;
          this.scene.start('Game');
        }, btnH);
      } else if (!isLast && !canNext) {
        const need = window.getStarsNeededForLevel ? window.getStarsNeededForLevel(nextIndex) : 0;
        const have = window.getTotalStars ? window.getTotalStars() : 0;
        this.add.text(width / 2, topY, 'Нужно ★' + need + ' (есть ' + have + ')', {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#ff6b6b'
        }).setOrigin(0.5);
      }

      this.createButton(width / 2, midY, 'УРОВНИ', 0x2a2a45, () => {
        this.scene.start('LevelsMap');
      }, btnH);

      this.createButton(width / 2, menuY, 'МЕНЮ', 0x222238, () => {
        this.scene.start('Menu');
      }, btnH);
    }

    this.playWinMelody();
    if (window.startAmbientMusic && window.isMusicOn && window.isMusicOn()) window.startAmbientMusic();

    this.time.delayedCall(400, () => {
      const go = () => {
        if (window.showInterstitialAd) {
          window.showInterstitialAd(false).catch(() => {});
        }
      };
      const p = this._savePromise || Promise.resolve();
      const timeout = new Promise((r) => setTimeout(r, 2500));
      Promise.race([p, timeout]).then(go).catch(go);
    });
  }

  formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? m + ':' + r.toString().padStart(2, '0') : r + ' сек';
  }

  createButton(x, y, label, color, callback, btnH) {
    if (window.createNiceButton) {
      return window.createNiceButton(this, x, y, label, callback, {
        w: 240,
        h: btnH || 48,
        color: color,
        secondary: color !== 0x00e8c8,
        fontSize: '20px',
        depth: 10
      });
    }
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-120, -28, 240, 56, 28);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: color === 0x00e8c8 ? '#0b0b14' : '#c8c8e0'
    }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(240, 56);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.94,
        duration: 60,
        yoyo: true,
        onComplete: callback
      });
    });
    return btn;
  }

  playWinMelody() {
    if (window.isSoundOn && !window.isSoundOn()) return;
    const ctx = window.gameAudioCtx || (window.ensureGameAudio && window.ensureGameAudio());
    if (!ctx) return;
    const play = () => {
      [523, 659, 784, 1046].forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.1;
          osc.connect(gain);
          gain.connect(ctx.destination);
          const t = ctx.currentTime + i * 0.11;
          osc.start(t);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.stop(t + 0.3);
        } catch (e) {}
      });
    };
    if (ctx.state === 'suspended') {
      if (window.isSoundOn && window.isSoundOn()) ctx.resume().then(play).catch(() => {});
    } else play();
  }
}

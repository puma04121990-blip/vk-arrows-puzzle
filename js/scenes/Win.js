class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  create() {
    const { width, height } = this.scale;
    const stars = window.gameData.stars || 1;
    const level = window.gameData.currentLevel + 1;
    const mistakes = window.gameData.mistakes || 0;
    const levelIndex = window.gameData.currentLevel;
    const elapsed = window.gameData.elapsed || 0;

    const nextLevel = levelIndex + 1;
    if (window.saveProgress) {
      try { window.saveProgress(nextLevel, levelIndex, stars); } catch (e) {}
    }

    if (window.trackLevelResult) {
      try { window.trackLevelResult(levelIndex, stars, mistakes, elapsed); } catch (e) {}
    }

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const glow = this.add.graphics();
    glow.fillStyle(0x00e8c8, 0.06);
    glow.fillCircle(width / 2, height * 0.24, 180);

    const phrases = ['ПРЕВОСХОДНО!', 'ОТЛИЧНО!', 'СУПЕР!'];
    const phrase = stars >= 3 ? phrases[0] : stars === 2 ? phrases[1] : phrases[2];

    const title = this.add.text(width / 2, height * 0.14, phrase, {
      fontFamily: 'Arial Black',
      fontSize: '40px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: { from: 0.85, to: 1 },
      duration: 280,
      ease: 'Back.easeOut'
    });

    this.add.text(width / 2, height * 0.23, `Уровень ${level} пройден`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#9a9ab8'
    }).setOrigin(0.5);

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
    this.add.text(width / 2, height * 0.44, `Ошибок: ${mistakes}   ·   Время: ${timeStr}`, {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    const news = window.popNewAchievements ? window.popNewAchievements() : [];
    if (news.length) {
      const a = window.getAchievementById ? window.getAchievementById(news[0]) : null;
      const label = a ? `${a.icon} ${a.title}` : 'Новое достижение!';
      this.add.text(width / 2, height * 0.51, label, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffd166'
      }).setOrigin(0.5);

      if (news.length > 1) {
        this.add.text(width / 2, height * 0.55, `+ ещё ${news.length - 1}`, {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#6a6a82'
        }).setOrigin(0.5);
      }
    }

    const isLast = levelIndex >= LEVELS.length - 1;
    const nextIndex = levelIndex + 1;
    const canNext = !isLast && window.isLevelPlayable && window.isLevelPlayable(nextIndex);

    let btnY = height * 0.64;

    if (!isLast && canNext) {
      this.createButton(width / 2, btnY, 'ДАЛЬШЕ →', 0x00e8c8, () => {
        window.gameData.currentLevel++;
        this.scene.start('Game');
      });
    } else if (!isLast && !canNext) {
      const need = window.getStarsNeededForLevel ? window.getStarsNeededForLevel(nextIndex) : 0;
      const have = window.getTotalStars ? window.getTotalStars() : 0;
      this.add.text(width / 2, btnY, `Нужно ★${need} (есть ${have})`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ff6b6b'
      }).setOrigin(0.5);
    }

    this.createButton(width / 2, height * 0.76, 'УРОВНИ', 0x2a2a45, () => {
      this.scene.start('LevelsMap');
    });

    this.createButton(width / 2, height * 0.88, 'МЕНЮ', 0x222238, () => {
      this.scene.start('Menu');
    });

    this.playWinMelody();

    // Interstitial after level — never at app launch (VK rules)
    this.time.delayedCall(900, () => {
      if (window.showInterstitialAd) {
        window.showInterstitialAd(false).catch(() => {});
      }
    });
  }

  formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r} сек`;
  }

  createButton(x, y, label, color, callback) {
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
    const ctx = window.gameAudioCtx;
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
    if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {});
    else play();
  }
}

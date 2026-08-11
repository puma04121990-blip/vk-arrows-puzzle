class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle', 16, 16);
    g.destroy();
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    const title = this.add.text(width / 2, height * 0.42, 'ПУЛЬС СТРЕЛОК', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      fontSize: '28px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5);

    const status = this.add.text(width / 2, height * 0.52, 'Загрузка прогресса…', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: { from: 0.7, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    const goNext = () => {
      if (this._went) return;
      this._went = true;
      const accepted = window.hasConsentAccepted
        ? window.hasConsentAccepted()
        : false;
      this.scene.start(accepted ? 'Menu' : 'Consent');
    };

    const ready = window.progressInitPromise
      || window.whenProgressReady
      || Promise.resolve();

    // Wait up to 12s for cloud progress (2.3.8) before showing menu
    const timeout = new Promise((resolve) => {
      this.time.delayedCall(12000, () => {
        if (!window.gameProgress) window.gameProgress = {};
        window.gameProgress.loaded = true;
        resolve();
      });
    });

    Promise.race([
      Promise.resolve(ready).then(() => {
        if (window.gameProgress) window.gameProgress.loaded = true;
      }),
      timeout
    ]).then(() => {
      if (status && status.active) {
        const m = (window.gameProgress && window.gameProgress.maxLevel) || 0;
        status.setText(m > 0 ? `Прогресс: ур. ${m + 1}` : 'Готово');
      }
      this.time.delayedCall(120, goNext);
    }).catch(() => {
      goNext();
    });
  }
}

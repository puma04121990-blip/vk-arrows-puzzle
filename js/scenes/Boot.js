class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Generate simple particle texture
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
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#00e8c8',
      align: 'center'
    }).setOrigin(0.5);

    const status = this.add.text(width / 2, height * 0.52, 'Загрузка прогресса…', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#8a8aa8'
    }).setOrigin(0.5);

    // Soft pulse on title while waiting
    this.tweens.add({
      targets: title,
      alpha: { from: 0.7, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    const goMenu = () => {
      if (this._went) return;
      this._went = true;
      this.scene.start('Menu');
    };

    // Wait until cloud/local progress is ready (VK rule 2.3.8)
    const ready = window.progressInitPromise
      || (window.whenProgressReady)
      || Promise.resolve();

    const timeout = new Promise((resolve) => {
      // Safety: never hang forever if Bridge stalls
      this.time.delayedCall(8000, () => {
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
      if (status && status.active) status.setText('Готово');
      this.time.delayedCall(80, goMenu);
    }).catch(() => {
      goMenu();
    });
  }
}

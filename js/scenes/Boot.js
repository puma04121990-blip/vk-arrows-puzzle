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

    this.load.image('menuLogo', 'assets/menu-logo.png');
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

    const status = this.add.text(width / 2, height * 0.52, 'Загрузка облака…', {
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

    const timeout = new Promise((resolve) => {
      this.time.delayedCall(13000, () => {
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
        const cloud = window.cloudStatus && window.cloudStatus.synced;
        if (m > 0) {
          status.setText(cloud ? ('Облако: ур. ' + (m + 1)) : ('Прогресс: ур. ' + (m + 1)));
        } else {
          status.setText(cloud ? 'Облако готово' : 'Готово');
        }
      }
      this.time.delayedCall(180, goNext);
    }).catch(() => {
      goNext();
    });
  }
}

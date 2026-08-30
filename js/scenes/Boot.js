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
    this.load.image('shop_hints', 'assets/shop/hints.png');
    this.load.image('shop_heart', 'assets/shop/heart.png');
    this.load.image('shop_noads', 'assets/shop/noads.png');
    this.load.image('shop_skins', 'assets/shop/skins.png');
    ['neon', 'block', 'triangle', 'chevron', 'thin', 'feather'].forEach((id) => {
      this.load.image('arrow_' + id, 'assets/arrows/' + id + '.png');
    });
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

    const status = this.add.text(width / 2, height * 0.52, 'Загрузка…', {
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

    const fontsReady = (document.fonts && document.fonts.ready)
      ? Promise.race([
        document.fonts.load('800 32px Manrope').catch(() => {}),
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 1200))
      ])
      : Promise.resolve();

    const ready = window.progressInitPromise
      || window.whenProgressReady
      || Promise.resolve();

    // Wall-clock timeout — never block on VK Bridge / Phaser clock
    window.setTimeout(goNext, 3500);

    Promise.all([Promise.resolve(ready), fontsReady]).then(() => {
      if (window.gameProgress) window.gameProgress.loaded = true;
      if (status && status.active) {
        const m = (window.gameProgress && window.gameProgress.maxLevel) || 0;
        const cloud = window.cloudStatus && window.cloudStatus.synced;
        if (m > 0) status.setText(cloud ? ('Облако: ур. ' + (m + 1)) : ('Прогресс: ур. ' + (m + 1)));
        else status.setText(cloud ? 'Облако готово' : 'Готово');
      }
      window.setTimeout(goNext, 120);
    }).catch(goNext);
  }
}

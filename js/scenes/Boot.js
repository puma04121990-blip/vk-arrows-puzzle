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
    this.scene.start('Menu');
  }
}

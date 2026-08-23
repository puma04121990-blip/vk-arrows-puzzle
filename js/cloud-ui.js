// Cloud status line on Menu
(function patchMenuCloud() {
  function apply() {
    if (typeof MenuScene === 'undefined' || !MenuScene.prototype || MenuScene.prototype.__cloudLine) return;
    const orig = MenuScene.prototype.create;
    MenuScene.prototype.create = function () {
      orig.apply(this, arguments);
      try {
        const txt = window.getCloudStatusText ? window.getCloudStatusText() : '';
        if (!txt) return;
        const { width, height } = this.scale;
        const wide = width >= height;
        const synced = window.cloudStatus && window.cloudStatus.synced;
        this.add.text(width / 2, height - (wide ? 14 : 18), txt, {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: synced ? '#2ec4a0' : '#5a5a72',
          align: 'center'
        }).setOrigin(0.5).setDepth(40);
      } catch (e) {}
    };
    MenuScene.prototype.__cloudLine = true;
  }
  apply();
  if (typeof MenuScene === 'undefined') {
    document.addEventListener('DOMContentLoaded', apply);
  }
})();

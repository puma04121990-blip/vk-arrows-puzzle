// Строка статуса облака в меню
(function patchMenuCloud() {
  function apply() {
    if (typeof MenuScene === 'undefined' || !MenuScene.prototype || MenuScene.prototype.__cloudLine3) return;
    const orig = MenuScene.prototype.create;
    MenuScene.prototype.create = function () {
      orig.apply(this, arguments);
      try {
        const { width, height } = this.scale;
        const wide = width >= height;
        const synced = window.cloudStatus && window.cloudStatus.synced;
        const txt = window.getCloudStatusText ? window.getCloudStatusText() : '';
        this._cloudLine = this.add.text(width / 2, height - (wide ? 14 : 18), txt || '', {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: synced ? '#2ec4a0' : '#5a5a72',
          align: 'center'
        }).setOrigin(0.5).setDepth(40);
      } catch (e) {}

      if (!this._cloudPulled && window.pullCloudProgress) {
        this._cloudPulled = true;
        const prevMax = (window.gameProgress && window.gameProgress.maxLevel) || 0;
        const prevStars = window.getTotalStars ? window.getTotalStars() : 0;
        window.pullCloudProgress().then(() => {
          const now = (window.gameProgress && window.gameProgress.maxLevel) || 0;
          const stars = window.getTotalStars ? window.getTotalStars() : 0;
          if ((now > prevMax || stars !== prevStars) && this.sys && this.sys.isActive()) {
            this.scene.restart();
            return;
          }
          if (this._cloudLine && this._cloudLine.active) {
            const ok = window.cloudStatus && window.cloudStatus.synced;
            this._cloudLine.setColor(ok ? '#2ec4a0' : '#5a5a72');
            this._cloudLine.setText(window.getCloudStatusText ? window.getCloudStatusText() : '');
          }
        }).catch(() => {});
      }
    };
    MenuScene.prototype.__cloudLine3 = true;
  }
  apply();
  if (typeof MenuScene === 'undefined') {
    document.addEventListener('DOMContentLoaded', apply);
  }
})();

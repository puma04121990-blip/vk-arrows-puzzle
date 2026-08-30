// Crisp canvas + text on phones (DPR 2–3). Phaser 3.80 dropped config.resolution.
(function () {
  function getDpr() {
    const raw = Number(window.devicePixelRatio || 1);
    if (!isFinite(raw) || raw < 1) return 1;
    return Math.min(raw, 2.5);
  }
  window.getUiDpr = getDpr;

  function applyRendererSize(renderer, width, height) {
    if (!renderer || !renderer.canvas) return;
    const dpr = getDpr();
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    const canvas = renderer.canvas;
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (typeof renderer.setProjectionMatrix === 'function') {
      renderer.setProjectionMatrix(w, h);
    }
    renderer.width = w;
    renderer.height = h;
    if (renderer.gl) {
      renderer.gl.viewport(0, 0, bw, bh);
      renderer.drawingBufferHeight = renderer.gl.drawingBufferHeight;
    }
  }

  function patchWebGL() {
    const R = Phaser.Renderer && Phaser.Renderer.WebGL && Phaser.Renderer.WebGL.WebGLRenderer;
    if (!R) return;
    const proto = R.prototype;
    if (proto.__pulseHiDpi) return;
    proto.__pulseHiDpi = true;

    const origResize = proto.resize;
    proto.resize = function (width, height) {
      const out = origResize.call(this, width, height);
      applyRendererSize(this, width, height);
      return out;
    };

    const origReset = proto.resetViewport;
    proto.resetViewport = function () {
      const gl = this.gl;
      if (!gl || !this.canvas) return origReset.call(this);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.drawingBufferHeight = gl.drawingBufferHeight;
    };

    const origAdjust = proto.adjustViewport;
    if (typeof origAdjust === 'function') {
      proto.adjustViewport = function () {
        const gl = this.gl;
        if (!gl || !this.canvas) return origAdjust.call(this);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.disable(gl.SCISSOR_TEST);
      };
    }
  }

  function patchText() {
    if (!Phaser.GameObjects || !Phaser.GameObjects.GameObjectFactory) return;
    const fac = Phaser.GameObjects.GameObjectFactory.prototype;
    if (fac.__pulseHiDpiText) return;
    fac.__pulseHiDpiText = true;
    const orig = fac.text;
    fac.text = function (x, y, content, style) {
      const next = Object.assign({}, style || {});
      if (next.resolution == null) next.resolution = getDpr();
      return orig.call(this, x, y, content, next);
    };
  }

  function install() {
    if (typeof Phaser === 'undefined') {
      setTimeout(install, 20);
      return;
    }
    try { patchWebGL(); } catch (e) { console.warn('[ArrowPulse] hidpi webgl', e); }
    try { patchText(); } catch (e) { console.warn('[ArrowPulse] hidpi text', e); }
  }
  install();
})();

// ============================================
// Sound on/off + suspend on hide (VK 2.2.5)
// ============================================

const SOUND_KEY = 'arrow_pulse_sound_on';

window.soundEnabled = (function () {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch (e) {}
  return true; // default on
})();

window.isSoundOn = function () {
  return window.soundEnabled !== false;
};

window.setSoundOn = function (on) {
  window.soundEnabled = !!on;
  try {
    localStorage.setItem(SOUND_KEY, window.soundEnabled ? '1' : '0');
  } catch (e) {}

  if (!window.soundEnabled) {
    window.suspendGameAudio();
  } else {
    window.resumeGameAudio();
  }

  if (typeof window.onSoundToggle === 'function') {
    try { window.onSoundToggle(window.soundEnabled); } catch (e) {}
  }
  return window.soundEnabled;
};

window.toggleSound = function () {
  return window.setSoundOn(!window.isSoundOn());
};

window.suspendGameAudio = function () {
  const ctx = window.gameAudioCtx;
  if (ctx && ctx.state === 'running') {
    ctx.suspend().catch(() => {});
  }
};

window.resumeGameAudio = function () {
  if (!window.isSoundOn()) return;
  const ctx = window.gameAudioCtx;
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};

window.ensureGameAudio = function () {
  if (!window.gameAudioCtx) {
    try {
      window.gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      window.gameAudioCtx = null;
    }
  }
  return window.gameAudioCtx;
};

/**
 * Compact 🔊 / 🔇 button for Menu / Game.
 * Returns { bg, label, refresh } container pieces.
 */
window.createSoundToggle = function (scene, x, y, opts) {
  opts = opts || {};
  const size = opts.size || 44;
  const depth = opts.depth != null ? opts.depth : 60;

  const bg = scene.add.rectangle(x, y, size, size, 0x181828)
    .setStrokeStyle(1, 0x2e2e48)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth);

  const label = scene.add.text(x, y, window.isSoundOn() ? '🔊' : '🔇', {
    fontSize: opts.fontSize || '22px'
  }).setOrigin(0.5).setDepth(depth + 1);

  const refresh = () => {
    label.setText(window.isSoundOn() ? '🔊' : '🔇');
  };

  const hit = () => {
    window.toggleSound();
    refresh();
  };

  bg.on('pointerup', hit);
  label.setInteractive({ useHandCursor: true });
  label.on('pointerup', hit);

  bg.on('pointerover', () => bg.setFillStyle(0x222238));
  bg.on('pointerout', () => bg.setFillStyle(0x181828));

  // Keep icon in sync if toggled elsewhere
  const prev = window.onSoundToggle;
  window.onSoundToggle = function (on) {
    if (typeof prev === 'function') prev(on);
    if (label && label.active) refresh();
  };

  return { bg, label, refresh };
};

// Audio system: effects + lightweight procedural ambient music for VK/Web/mobile.
// No external files are required, so it remains offline-friendly and GDPR/VK-safe.

const SOUND_KEY = 'arrow_pulse_sound_on';
const MUSIC_KEY = 'arrow_pulse_music_on';

function readBool(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === '0') return false;
    if (value === '1') return true;
  } catch (e) {}
  return fallback;
}

window.soundEnabled = readBool(SOUND_KEY, true);
window.musicEnabled = readBool(MUSIC_KEY, true);
window.isSoundOn = function () { return window.soundEnabled !== false; };
window.isMusicOn = function () { return window.musicEnabled !== false; };

window.ensureGameAudio = function () {
  if (!window.gameAudioCtx) {
    try {
      window.gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { window.gameAudioCtx = null; }
  }
  return window.gameAudioCtx;
};

function persistBool(key, value) {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch (e) {}
}

window.setSoundOn = function (on) {
  window.soundEnabled = !!on;
  persistBool(SOUND_KEY, window.soundEnabled);
  if (!window.soundEnabled && !window.isMusicOn()) window.suspendGameAudio();
  else window.resumeGameAudio();
  if (typeof window.onSoundToggle === 'function') {
    try { window.onSoundToggle(window.soundEnabled); } catch (e) {}
  }
  return window.soundEnabled;
};
window.toggleSound = function () { return window.setSoundOn(!window.isSoundOn()); };
window.setMusicOn = function (on) {
  window.musicEnabled = !!on;
  persistBool(MUSIC_KEY, window.musicEnabled);
  if (window.musicEnabled) { window.resumeGameAudio(); window.startAmbientMusic(); }
  else { window.stopAmbientMusic(); if (!window.isSoundOn()) window.suspendGameAudio(); }
  if (typeof window.onMusicToggle === 'function') {
    try { window.onMusicToggle(window.musicEnabled); } catch (e) {}
  }
  return window.musicEnabled;
};
window.toggleMusic = function () { return window.setMusicOn(!window.isMusicOn()); };

window.suspendGameAudio = function () {
  const ctx = window.gameAudioCtx;
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
};
window.resumeGameAudio = function () {
  const ctx = window.gameAudioCtx;
  if (ctx && ctx.state === 'suspended' && (window.isSoundOn() || window.isMusicOn())) ctx.resume().catch(() => {});
};

function musicGain(ctx) {
  if (!window.musicMasterGain) {
    window.musicMasterGain = ctx.createGain();
    window.musicMasterGain.gain.value = 0.035;
    window.musicMasterGain.connect(ctx.destination);
  }
  return window.musicMasterGain;
}

window.startAmbientMusic = function () {
  if (!window.isMusicOn()) return;
  const ctx = window.ensureGameAudio();
  if (!ctx || window.musicTimer) return;
  const playNote = () => {
    if (!window.isMusicOn() || !ctx || ctx.state === 'closed') return;
    try {
      const scale = [220, 261.63, 329.63, 392, 493.88, 392, 329.63, 293.66];
      const freq = scale[window.musicStep % scale.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.8, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.62);
      osc.connect(gain); gain.connect(musicGain(ctx));
      osc.start(); osc.stop(ctx.currentTime + 0.68);
      window.musicStep = (window.musicStep + 1) % scale.length;
    } catch (e) {}
  };
  window.musicStep = window.musicStep || 0;
  playNote();
  window.musicTimer = setInterval(playNote, 760);
};
window.stopAmbientMusic = function () {
  if (window.musicTimer) { clearInterval(window.musicTimer); window.musicTimer = null; }
  if (window.musicMasterGain) {
    try { window.musicMasterGain.gain.setTargetAtTime(0.0001, window.gameAudioCtx.currentTime, 0.08); } catch (e) {}
  }
};

window.playUiTone = function (freq, duration, type, volume) {
  if (!window.isSoundOn()) return;
  const ctx = window.ensureGameAudio();
  if (!ctx) return;
  const play = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = type || 'sine';
      osc.frequency.value = freq || 420;
      gain.gain.setValueAtTime(volume == null ? 0.06 : volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (duration || 0.08));
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + (duration || 0.08) + 0.02);
    } catch (e) {}
  };
  if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {}); else play();
};

window.createSoundToggle = function (scene, x, y, opts) {
  opts = opts || {};
  const size = opts.size || 44;
  const depth = opts.depth != null ? opts.depth : 60;
  const bg = scene.add.rectangle(x, y, size, size, 0x181828)
    .setStrokeStyle(1, 0x2e2e48).setInteractive({ useHandCursor: true }).setDepth(depth);
  const label = scene.add.text(x, y, window.isSoundOn() ? '🔊' : '🔇', { fontSize: opts.fontSize || '22px' })
    .setOrigin(0.5).setDepth(depth + 1);
  const refresh = () => label.setText(window.isSoundOn() ? '🔊' : '🔇');
  const hit = () => { window.ensureGameAudio(); window.toggleSound(); refresh(); window.playUiTone(520, 0.05); };
  bg.on('pointerup', hit); label.setInteractive({ useHandCursor: true }); label.on('pointerup', hit);
  bg.on('pointerover', () => bg.setFillStyle(0x2a2a45)); bg.on('pointerout', () => bg.setFillStyle(0x181828));
  const prev = window.onSoundToggle;
  window.onSoundToggle = function (on) { if (typeof prev === 'function') prev(on); if (label && label.active) refresh(); };
  return { bg, label, refresh };
};

window.createMusicToggle = function (scene, x, y, opts) {
  opts = opts || {};
  const size = opts.size || 44;
  const depth = opts.depth != null ? opts.depth : 60;
  const bg = scene.add.rectangle(x, y, size, size, 0x181828).setStrokeStyle(1, 0x2e2e48)
    .setInteractive({ useHandCursor: true }).setDepth(depth);
  const label = scene.add.text(x, y, window.isMusicOn() ? '♫' : '·', { fontFamily: 'Arial Black, Arial', fontSize: opts.fontSize || '24px', color: '#00e8c8' })
    .setOrigin(0.5).setDepth(depth + 1);
  const refresh = () => label.setText(window.isMusicOn() ? '♫' : '·');
  const hit = () => { window.ensureGameAudio(); window.toggleMusic(); refresh(); window.playUiTone(620, 0.05); };
  bg.on('pointerup', hit); label.setInteractive({ useHandCursor: true }); label.on('pointerup', hit);
  bg.on('pointerover', () => bg.setFillStyle(0x2a2a45)); bg.on('pointerout', () => bg.setFillStyle(0x181828));
  const prev = window.onMusicToggle;
  window.onMusicToggle = function (on) { if (typeof prev === 'function') prev(on); if (label && label.active) refresh(); };
  return { bg, label, refresh };
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) window.suspendGameAudio();
  else if (window.isSoundOn() || window.isMusicOn()) window.resumeGameAudio();
});

// First user gesture unlocks mobile WebAudio and starts the ambient layer.
window.addEventListener('pointerdown', () => {
  const ctx = window.ensureGameAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (window.isMusicOn()) window.startAmbientMusic();
}, { once: true, passive: true });

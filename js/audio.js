// Audio system: effects + procedural ambient music for VK, Web and mobile.
// The browser may suspend Web Audio until a real user gesture; this module always
// resumes first and creates the music loop only after the context is running.

const SOUND_KEY = 'arrow_pulse_sound_on';
const MUSIC_KEY = 'arrow_pulse_music_on';
const MUSIC_VOLUME = 0.035;

function readBool(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === '0') return false;
    if (value === '1') return true;
  } catch (e) {}
  return fallback;
}

function persistBool(key, value) {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch (e) {}
}

window.soundEnabled = readBool(SOUND_KEY, true);
window.musicEnabled = readBool(MUSIC_KEY, true);
window.isSoundOn = function () { return window.soundEnabled !== false; };
window.isMusicOn = function () { return window.musicEnabled !== false; };
window.audioGestureUnlocked = false;
window.musicStarting = false;

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

function musicGain(ctx) {
  if (!window.musicMasterGain || window.musicMasterGain.context !== ctx) {
    window.musicMasterGain = ctx.createGain();
    window.musicMasterGain.gain.value = MUSIC_VOLUME;
    window.musicMasterGain.connect(ctx.destination);
  }
  return window.musicMasterGain;
}

function restoreMusicGain(ctx) {
  const master = musicGain(ctx);
  try {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value || 0.0001), now);
    master.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.12);
  } catch (e) {
    try { master.gain.value = MUSIC_VOLUME; } catch (e2) {}
  }
  return master;
}

function startAmbientLoop(ctx) {
  if (!window.isMusicOn() || !ctx || ctx.state !== 'running' || window.musicTimer) return;
  restoreMusicGain(ctx);
  window.musicStep = window.musicStep || 0;

  const playNote = () => {
    if (!window.isMusicOn() || !ctx || ctx.state !== 'running' || ctx.state === 'closed') return;
    try {
      const scale = [220, 261.63, 329.63, 392, 493.88, 392, 329.63, 293.66];
      const freq = scale[window.musicStep % scale.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.72, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      osc.connect(gain);
      gain.connect(musicGain(ctx));
      osc.start(now);
      osc.stop(now + 0.68);
      window.musicStep = (window.musicStep + 1) % scale.length;
    } catch (e) {}
  };

  playNote();
  window.musicTimer = setInterval(playNote, 760);
}

window.startAmbientMusic = function () {
  if (!window.isMusicOn() || window.musicTimer || window.musicStarting) return;
  const ctx = window.ensureGameAudio();
  if (!ctx || ctx.state === 'closed') return;

  const begin = () => {
    window.musicStarting = false;
    if (window.isMusicOn() && ctx.state === 'running') startAmbientLoop(ctx);
  };

  if (ctx.state === 'suspended') {
    window.musicStarting = true;
    ctx.resume().then(begin).catch(() => { window.musicStarting = false; });
  } else {
    begin();
  }
};

window.stopAmbientMusic = function () {
  if (window.musicTimer) {
    clearInterval(window.musicTimer);
    window.musicTimer = null;
  }
  const ctx = window.gameAudioCtx;
  if (window.musicMasterGain && ctx) {
    try {
      const now = ctx.currentTime;
      window.musicMasterGain.gain.cancelScheduledValues(now);
      window.musicMasterGain.gain.setTargetAtTime(0.0001, now, 0.06);
    } catch (e) {}
  }
};

window.suspendGameAudio = function () {
  const ctx = window.gameAudioCtx;
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
};

window.resumeGameAudio = function () {
  const ctx = window.gameAudioCtx;
  if (!ctx || (!window.isSoundOn() && !window.isMusicOn())) return;
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (window.isMusicOn()) window.startAmbientMusic();
    }).catch(() => {});
  } else if (window.isMusicOn()) {
    window.startAmbientMusic();
  }
};

window.unlockGameAudio = function () {
  window.audioGestureUnlocked = true;
  const ctx = window.ensureGameAudio();
  if (!ctx) return;
  const begin = () => {
    if (window.isMusicOn()) window.startAmbientMusic();
  };
  if (ctx.state === 'suspended') ctx.resume().then(begin).catch(() => {});
  else begin();
};

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
  if (window.musicEnabled) {
    window.unlockGameAudio();
    window.startAmbientMusic();
  } else {
    window.stopAmbientMusic();
    if (!window.isSoundOn()) window.suspendGameAudio();
  }
  if (typeof window.onMusicToggle === 'function') {
    try { window.onMusicToggle(window.musicEnabled); } catch (e) {}
  }
  return window.musicEnabled;
};
window.toggleMusic = function () { return window.setMusicOn(!window.isMusicOn()); };

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
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (duration || 0.08) + 0.02);
    } catch (e) {}
  };
  if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {});
  else play();
};

// Kept for backward compatibility. The game no longer renders these as corner icons;
// audio is managed from the dedicated Settings scene.
window.createSoundToggle = function () { return null; };
window.createMusicToggle = function () { return null; };

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.suspendGameAudio();
  } else if (window.isSoundOn() || window.isMusicOn()) {
    window.resumeGameAudio();
  }
});

// A click, tap or keyboard input is a valid Web Audio unlock point. Listening in capture
// phase means music resumes before the scene button callback executes.
const unlockFromGesture = () => window.unlockGameAudio();
window.addEventListener('pointerdown', unlockFromGesture, { once: true, capture: true, passive: true });
window.addEventListener('keydown', unlockFromGesture, { once: true, capture: true });

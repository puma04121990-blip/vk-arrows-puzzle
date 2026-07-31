// ============================================
// Progress + Stages + Achievement stats
// ============================================

window.gameProgress = {
  maxLevel: 0,
  stars: {},
  stats: {
    totalMistakes: 0,
    levelsCleared: 0,
    perfectStreak: 0,
    bestStreak: 0,
    unlocked: {},
    newlyUnlocked: []
  },
  loaded: false
};

const STORAGE_KEY = 'arrow_pulse_progress_v3';

window.STAGES = [
  { id: 1, name: 'Этап 1', from: 0,  to: 9,  needStars: 0 },
  { id: 2, name: 'Этап 2', from: 10, to: 19, needStars: 25 },
  { id: 3, name: 'Этап 3', from: 20, to: 29, needStars: 50 },
  { id: 4, name: 'Этап 4', from: 30, to: 39, needStars: 75 },
  { id: 5, name: 'Этап 5', from: 40, to: 49, needStars: 100 }
];

function isVK() {
  return typeof vkBridge !== 'undefined';
}

window.persistProgress = function () {
  const data = JSON.stringify({
    maxLevel: window.gameProgress.maxLevel,
    stars: window.gameProgress.stars || {},
    stats: window.gameProgress.stats || {}
  });
  try { localStorage.setItem(STORAGE_KEY, data); } catch (e) {}
  if (isVK()) {
    vkBridge.send('VKWebAppStorageSet', { key: STORAGE_KEY, value: data }).catch(() => {});
  }
};

window.saveProgress = function (maxLevel, levelIndex, stars) {
  if (typeof maxLevel === 'number' && maxLevel > window.gameProgress.maxLevel) {
    window.gameProgress.maxLevel = maxLevel;
  }
  if (typeof levelIndex === 'number' && typeof stars === 'number') {
    if (!window.gameProgress.stars) window.gameProgress.stars = {};
    const key = String(levelIndex);
    const prev = window.gameProgress.stars[key] || 0;
    if (stars > prev) window.gameProgress.stars[key] = stars;
  }
  window.persistProgress();
};

window.getLevelStars = function (levelIndex) {
  if (!window.gameProgress.stars) return 0;
  return window.gameProgress.stars[String(levelIndex)] || 0;
};

window.getTotalStars = function () {
  const s = window.gameProgress.stars || {};
  let sum = 0;
  for (const k in s) sum += s[k] || 0;
  return sum;
};

window.getStageForLevel = function (levelIndex) {
  const stages = window.STAGES || [];
  for (let i = 0; i < stages.length; i++) {
    if (levelIndex >= stages[i].from && levelIndex <= stages[i].to) return stages[i];
  }
  return stages[0];
};

window.isStageUnlocked = function (stage) {
  if (!stage) return true;
  return window.getTotalStars() >= (stage.needStars || 0);
};

window.isLevelPlayable = function (levelIndex) {
  const maxOpened = (window.gameProgress && window.gameProgress.maxLevel) || 0;
  if (levelIndex > maxOpened) return false;
  const stage = window.getStageForLevel(levelIndex);
  return window.isStageUnlocked(stage);
};

window.getStarsNeededForLevel = function (levelIndex) {
  const stage = window.getStageForLevel(levelIndex);
  return stage ? stage.needStars : 0;
};

window.loadProgress = function () {
  return new Promise((resolve) => {
    const apply = (parsed) => {
      if (!parsed) return;
      if (typeof parsed.maxLevel === 'number') {
        window.gameProgress.maxLevel = Math.max(window.gameProgress.maxLevel, parsed.maxLevel);
      }
      if (parsed.stars && typeof parsed.stars === 'object') {
        window.gameProgress.stars = Object.assign({}, window.gameProgress.stars || {}, parsed.stars);
      }
      if (parsed.stats && typeof parsed.stats === 'object') {
        window.gameProgress.stats = Object.assign({}, window.gameProgress.stats || {}, parsed.stats);
        if (!window.gameProgress.stats.unlocked) window.gameProgress.stats.unlocked = {};
        if (!window.gameProgress.stats.newlyUnlocked) window.gameProgress.stats.newlyUnlocked = [];
      }
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) apply(JSON.parse(raw));
    } catch (e) {}

    // migrate old key if needed
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const old = localStorage.getItem('arrow_pulse_progress_v2');
        if (old) apply(JSON.parse(old));
      }
    } catch (e) {}

    if (!isVK()) {
      window.gameProgress.loaded = true;
      resolve(window.gameProgress);
      return;
    }

    vkBridge.send('VKWebAppStorageGet', { keys: [STORAGE_KEY] })
      .then((result) => {
        const keys = result.keys || [];
        const item = keys.find(k => k.key === STORAGE_KEY);
        if (item && item.value) {
          try { apply(JSON.parse(item.value)); } catch (e) {}
        }
        window.gameProgress.loaded = true;
        resolve(window.gameProgress);
      })
      .catch(() => {
        window.gameProgress.loaded = true;
        resolve(window.gameProgress);
      });
  });
};

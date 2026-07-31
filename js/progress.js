// ============================================
// Progress + Stages (10 levels each)
// Next stage needs +25 total stars
// ============================================

window.gameProgress = {
  maxLevel: 0,
  stars: {},
  loaded: false
};

const STORAGE_KEY = 'arrow_pulse_progress_v2';

// Этапы: по 10 уровней
// Этап 1 (ур. 1–10)  — всегда открыт
// Этап 2 (ур. 11–20) — нужно 25 ★
// Этап 3 (ур. 21–30) — нужно 50 ★
// Этап 4 (ур. 31–40) — нужно 75 ★
// Этап 5 (ур. 41–50) — нужно 100 ★
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

function persist() {
  const data = JSON.stringify({
    maxLevel: window.gameProgress.maxLevel,
    stars: window.gameProgress.stars || {}
  });
  try { localStorage.setItem(STORAGE_KEY, data); } catch (e) {}
  if (isVK()) {
    vkBridge.send('VKWebAppStorageSet', { key: STORAGE_KEY, value: data }).catch(() => {});
  }
}

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
  persist();
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
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) apply(JSON.parse(raw));
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

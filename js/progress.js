// ============================================
// Progress: maxLevel + stars per level
// ============================================

window.gameProgress = {
  maxLevel: 0,
  stars: {}, // { "0": 3, "1": 2, ... }
  loaded: false
};

const STORAGE_KEY = 'arrow_pulse_progress_v2';

function isVK() {
  return typeof vkBridge !== 'undefined';
}

function persist() {
  const data = JSON.stringify({
    maxLevel: window.gameProgress.maxLevel,
    stars: window.gameProgress.stars || {}
  });

  try {
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {}

  if (isVK()) {
    vkBridge.send('VKWebAppStorageSet', {
      key: STORAGE_KEY,
      value: data
    }).catch(() => {});
  }
}

// Открыть уровень + сохранить лучшие звёзды
window.saveProgress = function (maxLevel, levelIndex, stars) {
  if (typeof maxLevel === 'number' && maxLevel > window.gameProgress.maxLevel) {
    window.gameProgress.maxLevel = maxLevel;
  }

  if (typeof levelIndex === 'number' && typeof stars === 'number') {
    if (!window.gameProgress.stars) window.gameProgress.stars = {};
    const key = String(levelIndex);
    const prev = window.gameProgress.stars[key] || 0;
    if (stars > prev) {
      window.gameProgress.stars[key] = stars;
    }
  }

  persist();
};

window.getLevelStars = function (levelIndex) {
  if (!window.gameProgress.stars) return 0;
  return window.gameProgress.stars[String(levelIndex)] || 0;
};

window.loadProgress = function () {
  return new Promise((resolve) => {
    const apply = (parsed) => {
      if (!parsed) return;
      if (typeof parsed.maxLevel === 'number') {
        window.gameProgress.maxLevel = Math.max(
          window.gameProgress.maxLevel,
          parsed.maxLevel
        );
      }
      if (parsed.stars && typeof parsed.stars === 'object') {
        window.gameProgress.stars = Object.assign(
          {},
          window.gameProgress.stars || {},
          parsed.stars
        );
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

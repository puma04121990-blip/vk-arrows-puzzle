// ============================================
// Progress: maxLevel + stars + star gates
// ============================================

window.gameProgress = {
  maxLevel: 0,
  stars: {},
  loaded: false
};

const STORAGE_KEY = 'arrow_pulse_progress_v2';

// Пороги звёзд для каждых 10 уровней
// Чтобы открыть уровень 11+ нужно N звёзд, 21+ и т.д.
window.STAR_GATES = [
  { level: 10, need: 18 },  // уровень 11 (index 10) → 18★
  { level: 20, need: 40 },  // уровень 21 → 40★
  { level: 30, need: 65 },  // уровень 31 → 65★
  { level: 40, need: 95 }   // уровень 41 → 95★
];

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

window.getTotalStars = function () {
  const s = window.gameProgress.stars || {};
  let sum = 0;
  for (const k in s) sum += s[k] || 0;
  return sum;
};

/** Сколько звёзд нужно, чтобы открыть этот levelIndex (0-based). 0 = не нужен порог */
window.getStarsNeededForLevel = function (levelIndex) {
  let need = 0;
  const gates = window.STAR_GATES || [];
  for (let i = 0; i < gates.length; i++) {
    if (levelIndex >= gates[i].level) {
      need = gates[i].need;
    }
  }
  return need;
};

/** Можно ли играть уровень: открыт по прогрессу + хватает звёзд */
window.isLevelPlayable = function (levelIndex) {
  const maxOpened = (window.gameProgress && window.gameProgress.maxLevel) || 0;
  if (levelIndex > maxOpened) return false;

  const need = window.getStarsNeededForLevel(levelIndex);
  if (need <= 0) return true;

  return window.getTotalStars() >= need;
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

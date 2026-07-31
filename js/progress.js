// ============================================
// Progress save/load
// VK Storage inside VK, localStorage outside
// ============================================

window.gameProgress = {
  maxLevel: 0,   // максимальный открытый уровень (0-based)
  loaded: false
};

const STORAGE_KEY = 'arrow_pulse_progress';

function isVK() {
  return typeof vkBridge !== 'undefined';
}

// Сохранить прогресс
window.saveProgress = function (maxLevel) {
  if (typeof maxLevel === 'number' && maxLevel > window.gameProgress.maxLevel) {
    window.gameProgress.maxLevel = maxLevel;
  }

  const data = JSON.stringify({
    maxLevel: window.gameProgress.maxLevel
  });

  // localStorage всегда (на случай теста)
  try {
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {}

  // VK Storage
  if (isVK()) {
    vkBridge.send('VKWebAppStorageSet', {
      key: STORAGE_KEY,
      value: data
    }).catch(() => {});
  }
};

// Загрузить прогресс (возвращает Promise)
window.loadProgress = function () {
  return new Promise((resolve) => {
    // Сначала пробуем localStorage (быстро)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.maxLevel === 'number') {
          window.gameProgress.maxLevel = parsed.maxLevel;
        }
      }
    } catch (e) {}

    if (!isVK()) {
      window.gameProgress.loaded = true;
      resolve(window.gameProgress);
      return;
    }

    // Потом VK Storage (приоритетнее)
    vkBridge.send('VKWebAppStorageGet', {
      keys: [STORAGE_KEY]
    })
      .then((result) => {
        const keys = result.keys || [];
        const item = keys.find(k => k.key === STORAGE_KEY);
        if (item && item.value) {
          try {
            const parsed = JSON.parse(item.value);
            if (typeof parsed.maxLevel === 'number') {
              window.gameProgress.maxLevel = Math.max(
                window.gameProgress.maxLevel,
                parsed.maxLevel
              );
            }
          } catch (e) {}
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

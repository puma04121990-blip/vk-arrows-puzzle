// ============================================
// Retention: Daily streak + Daily puzzle + Next goal
// Daily puzzle uses baked LEVELS (no runtime generateLevel)
// to avoid main-thread freeze on mobile.
// ============================================

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

window.getTodayKey = function () {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
};

window.getTodaySeedInt = function () {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

function ensureDailyFields() {
  if (!window.gameProgress) window.gameProgress = {};
  const p = window.gameProgress;
  if (typeof p.loginStreak !== 'number') p.loginStreak = 0;
  if (!p.lastLoginDate) p.lastLoginDate = '';
  if (!p.lastClaimDate) p.lastClaimDate = '';
  if (typeof p.hints !== 'number') p.hints = 0;
  if (typeof p.doubleStarsNext !== 'boolean') p.doubleStarsNext = false;
  if (!p.daily || typeof p.daily !== 'object') {
    p.daily = { date: '', bestStars: 0, bestTime: 0, plays: 0 };
  }
  return p;
}

window.refreshLoginStreak = function () {
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  const last = p.lastLoginDate || '';

  if (last === today) {
    return { streak: p.loginStreak || 0, isNewDay: false, broken: false };
  }

  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday =
    y.getFullYear() + '-' + pad2(y.getMonth() + 1) + '-' + pad2(y.getDate());

  let broken = false;
  if (!last) {
    p.loginStreak = 1;
  } else if (last === yesterday) {
    p.loginStreak = (p.loginStreak || 0) + 1;
  } else {
    broken = (p.loginStreak || 0) > 0;
    p.loginStreak = 1;
  }
  p.lastLoginDate = today;
  if (window.persistProgress) {
    try { window.persistProgress(); } catch (e) {}
  }
  return { streak: p.loginStreak, isNewDay: true, broken: broken };
};

window.canClaimDailyReward = function () {
  const p = ensureDailyFields();
  return p.lastClaimDate !== window.getTodayKey();
};

window.getLoginStreak = function () {
  return ensureDailyFields().loginStreak || 0;
};

window.getHints = function () {
  return ensureDailyFields().hints || 0;
};

window.claimDailyReward = function () {
  try {
    if (!window.canClaimDailyReward()) {
      return { ok: false, message: 'Уже получено сегодня' };
    }
    const p = ensureDailyFields();
    window.refreshLoginStreak();
    const streak = p.loginStreak || 1;
    const day = ((streak - 1) % 7) + 1;
    let message = '';
    let hintsGain = 0;

    if (day === 1) { hintsGain = 1; message = '+1 подсказка'; }
    else if (day === 2) { hintsGain = 1; message = '+1 подсказка'; }
    else if (day === 3) { hintsGain = 2; message = '+2 подсказки'; }
    else if (day === 4) {
      p.doubleStarsNext = true;
      message = 'x2 ★ на следующий уровень кампании';
    } else if (day === 5) { hintsGain = 2; message = '+2 подсказки'; }
    else if (day === 6) { hintsGain = 3; message = '+3 подсказки'; }
    else {
      hintsGain = 5;
      message = 'Неделя! +5 подсказок';
      if (window.ARROW_SKINS && window.unlockSkin && window.isSkinUnlocked) {
        const locked = window.ARROW_SKINS.find(s => !s.free && !window.isSkinUnlocked(s.id));
        if (locked) {
          try { window.unlockSkin(locked.id); } catch (e) {}
          message += ' · стиль «' + locked.name + '»';
        }
      }
    }

    p.hints = (p.hints || 0) + hintsGain;
    p.lastClaimDate = window.getTodayKey();
    if (window.persistProgress) {
      try { window.persistProgress(); } catch (e) {}
    }

    return {
      ok: true,
      day: day,
      streak: streak,
      hintsGain: hintsGain,
      message: message,
      hints: p.hints
    };
  } catch (e) {
    console.warn('[ArrowPulse] claimDailyReward error:', e);
    return { ok: false, message: 'Ошибка награды' };
  }
};

/**
 * Daily puzzle — same for everyone today.
 * Uses baked LEVELS only (no generateLevel) so mobile never freezes.
 */
window.getDailyPuzzleLevel = function () {
  const list = (typeof LEVELS !== 'undefined' && LEVELS.length)
    ? LEVELS
    : (window.LEVELS || []);
  const n = list.length || 50;
  // Mid-range levels for daily variety (avoid tutorial + extreme end)
  const base = 8 + (dayOfYear() % Math.max(1, Math.min(30, n - 10)));
  const idx = ((base % n) + n) % n;
  const src = list[idx] || list[0] || { size: 4, arrows: [{ x: 0, y: 0, dir: 1 }], walls: [] };

  // Shallow clone so daily mode never mutates campaign data
  const arrows = (src.arrows || []).map(a => {
    const o = { x: a.x | 0, y: a.y | 0, dir: a.dir | 0 };
    if (a.lockId != null) o.lockId = a.lockId;
    if (a.keyId != null) o.keyId = a.keyId;
    if (a.lockColor != null) o.lockColor = a.lockColor;
    if (a.rotates) o.rotates = true;
    return o;
  });
  const walls = (src.walls || []).map(w => ({ x: w.x | 0, y: w.y | 0 }));

  return {
    size: src.size || 4,
    arrows: arrows,
    walls: walls,
    index: -1,
    isDaily: true,
    dailyKey: window.getTodayKey(),
    sourceIndex: idx
  };
};

window.startDailyPuzzle = function () {
  try {
    const p = ensureDailyFields();
    const today = window.getTodayKey();
    if (p.daily.date !== today) {
      p.daily = { date: today, bestStars: 0, bestTime: 0, plays: 0 };
      if (window.persistProgress) {
        try { window.persistProgress(); } catch (e) {}
      }
    }
    window.gameData = window.gameData || {};
    window.gameData.mode = 'daily';
    window.gameData.dailyLevel = window.getDailyPuzzleLevel();
    window.gameData.currentLevel = 0;
    return window.gameData.dailyLevel;
  } catch (e) {
    console.warn('[ArrowPulse] startDailyPuzzle error:', e);
    window.gameData = window.gameData || {};
    window.gameData.mode = 'campaign';
    window.gameData.dailyLevel = null;
    window.gameData.currentLevel = 0;
    return null;
  }
};

window.startCampaignLevel = function (levelIndex) {
  window.gameData = window.gameData || {};
  window.gameData.mode = 'campaign';
  window.gameData.dailyLevel = null;
  window.gameData.currentLevel = levelIndex || 0;
};

window.saveDailyResult = function (stars, mistakes, elapsed) {
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  if (p.daily.date !== today) {
    p.daily = { date: today, bestStars: 0, bestTime: 0, plays: 0 };
  }
  p.daily.plays = (p.daily.plays || 0) + 1;
  const s = stars || 0;
  if (s > (p.daily.bestStars || 0)) {
    p.daily.bestStars = s;
    p.daily.bestTime = elapsed || 0;
  } else if (s === (p.daily.bestStars || 0) && elapsed > 0) {
    if (!p.daily.bestTime || elapsed < p.daily.bestTime) {
      p.daily.bestTime = elapsed;
    }
  }
  if (window.persistProgress) {
    try { window.persistProgress(); } catch (e) {}
  }
  return p.daily;
};

window.getDailyBest = function () {
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  if (p.daily.date !== today) return { date: today, bestStars: 0, bestTime: 0, plays: 0 };
  return p.daily;
};

window.getNextGoalText = function () {
  const p = ensureDailyFields();

  if (window.canClaimDailyReward()) {
    return 'Цель: забери награду дня (серия ' + (p.loginStreak || 1) + ' дн.)';
  }

  const daily = window.getDailyBest();
  if (!daily.bestStars || daily.bestStars < 3) {
    if (!daily.plays) return 'Цель: пройди ежедневный уровень';
    return 'Цель: 3★ в ежедневном уровне (сейчас ' + (daily.bestStars || 0) + '★)';
  }

  const maxLevel = p.maxLevel || 0;
  const total = (typeof LEVELS !== 'undefined' && LEVELS.length) ? LEVELS.length : 50;
  if (maxLevel < total) {
    const next = Math.min(maxLevel, total - 1) + 1;
    const starsNow = window.getTotalStars ? window.getTotalStars() : 0;
    return 'Цель: пройти уровень ' + next + ' · звёзд: ' + starsNow;
  }

  const stars = window.getTotalStars ? window.getTotalStars() : 0;
  if (stars < total * 3) {
    return 'Цель: собери все звёзды (' + stars + '/' + (total * 3) + ')';
  }

  return 'Цель: улучшай рекорд дня · серия ' + (p.loginStreak || 0) + ' дн.';
};

window.applyDoubleStarsIfNeeded = function (stars) {
  const p = ensureDailyFields();
  if (!p.doubleStarsNext) return stars;
  p.doubleStarsNext = false;
  if (window.persistProgress) {
    try { window.persistProgress(); } catch (e) {}
  }
  if (stars >= 3) {
    p.hints = (p.hints || 0) + 2;
    if (window.persistProgress) {
      try { window.persistProgress(); } catch (e) {}
    }
    return stars;
  }
  return Math.min(3, stars * 2);
};

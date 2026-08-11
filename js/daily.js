// ============================================
// Retention Phase A: Daily streak + Daily puzzle + Next goal
// ============================================

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

/** Local calendar day YYYY-MM-DD */
window.getTodayKey = function () {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
};

/** Compact YYYYMMDD number for seeds */
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

/**
 * Update login streak when app opens (does not auto-claim reward).
 * Returns { streak, isNewDay, broken }.
 */
window.refreshLoginStreak = function () {
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  const last = p.lastLoginDate || '';

  if (last === today) {
    return { streak: p.loginStreak || 0, isNewDay: false, broken: false };
  }

  // Yesterday?
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
  if (window.persistProgress) window.persistProgress();
  return { streak: p.loginStreak, isNewDay: true, broken: broken };
};

window.canClaimDailyReward = function () {
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  return p.lastClaimDate !== today;
};

window.getLoginStreak = function () {
  return ensureDailyFields().loginStreak || 0;
};

window.getHints = function () {
  return ensureDailyFields().hints || 0;
};

/**
 * Claim daily login reward. Cycle day = ((streak-1) % 7) + 1
 * Rewards: soft (hints / double stars) — no hard gates.
 */
window.claimDailyReward = function () {
  if (!window.canClaimDailyReward()) {
    return { ok: false, message: 'Уже получено сегодня' };
  }
  const p = ensureDailyFields();
  // Ensure streak is fresh for today
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
    // Bonus free skin if any locked
    if (window.ARROW_SKINS && window.unlockSkin) {
      const locked = window.ARROW_SKINS.find(s => !s.free && !window.isSkinUnlocked(s.id));
      if (locked) {
        window.unlockSkin(locked.id);
        message += ' · стиль «' + locked.name + '»';
      }
    }
  }

  p.hints = (p.hints || 0) + hintsGain;
  p.lastClaimDate = window.getTodayKey();
  if (window.persistProgress) window.persistProgress();

  return {
    ok: true,
    day: day,
    streak: streak,
    hintsGain: hintsGain,
    message: message,
    hints: p.hints
  };
};

/**
 * Daily puzzle level — same for everyone today (seed from date).
 */
window.getDailyPuzzleLevel = function () {
  const seedBase = window.getTodaySeedInt();
  const diff = 8 + (dayOfYear() % 35); // variety mid-range
  const size = window.getSizeForLevel ? window.getSizeForLevel(diff) : 6;
  const count = window.getArrowCount ? window.getArrowCount(diff, size) : 12;
  const wallsN = window.getWallCount ? window.getWallCount(diff) : 2;
  const locksN = window.getLockPairs ? window.getLockPairs(diff) : 1;
  const rotN = window.getRotateCount ? window.getRotateCount(diff) : 1;

  if (typeof window.generateLevel !== 'function') {
    // Fallback: use a campaign level by day
    const idx = dayOfYear() % (LEVELS.length || 50);
    const base = LEVELS[idx] || LEVELS[0];
    return Object.assign({}, base, { index: -1, isDaily: true, dailyKey: window.getTodayKey() });
  }

  const seed = (seedBase * 7919 + 0xD41) >>> 0;
  const lv = window.generateLevel(size, count, wallsN, locksN, rotN, seed);
  lv.index = -1;
  lv.isDaily = true;
  lv.dailyKey = window.getTodayKey();
  return lv;
};

window.startDailyPuzzle = function () {
  // Reset daily bucket if date rolled
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  if (p.daily.date !== today) {
    p.daily = { date: today, bestStars: 0, bestTime: 0, plays: 0 };
    if (window.persistProgress) window.persistProgress();
  }
  window.gameData = window.gameData || {};
  window.gameData.mode = 'daily';
  window.gameData.dailyLevel = window.getDailyPuzzleLevel();
  window.gameData.currentLevel = 0;
  return window.gameData.dailyLevel;
};

window.startCampaignLevel = function (levelIndex) {
  window.gameData = window.gameData || {};
  window.gameData.mode = 'campaign';
  window.gameData.dailyLevel = null;
  window.gameData.currentLevel = levelIndex || 0;
};

/**
 * Save daily run result (best stars / time for today).
 */
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
  if (window.persistProgress) window.persistProgress();
  return p.daily;
};

window.getDailyBest = function () {
  const p = ensureDailyFields();
  const today = window.getTodayKey();
  if (p.daily.date !== today) return { date: today, bestStars: 0, bestTime: 0, plays: 0 };
  return p.daily;
};

/**
 * One-line next goal for menu.
 */
window.getNextGoalText = function () {
  const p = ensureDailyFields();
  const today = window.getTodayKey();

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

/** Apply double-stars buff if set (campaign only). Returns final stars. */
window.applyDoubleStarsIfNeeded = function (stars) {
  const p = ensureDailyFields();
  if (!p.doubleStarsNext) return stars;
  p.doubleStarsNext = false;
  if (window.persistProgress) window.persistProgress();
  // Cap at 3 for campaign star display consistency, but grant visual "x2" as extra?
  // Plan: double for reward feel but campaign max is 3 per level — instead give +1 hint if already 3
  if (stars >= 3) {
    p.hints = (p.hints || 0) + 2;
    if (window.persistProgress) window.persistProgress();
    return stars;
  }
  return Math.min(3, stars * 2);
};

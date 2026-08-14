// ============================================
// Retention: Daily streak + Daily puzzle + Next goal
// Daily = max 9x9 full board (deterministic peel, no freeze)
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

/** Таблица 7-дневного цикла наград (день серии 1..7). */
window.DAILY_REWARD_TABLE = [
  { day: 1, icon: '💡', title: 'Старт серии', items: [{ type: 'hints', amount: 2, label: '+2 подсказки' }] },
  { day: 2, icon: '💡', title: 'Продолжаем', items: [{ type: 'hints', amount: 3, label: '+3 подсказки' }] },
  { day: 3, icon: '❤️', title: 'Запас прочности', items: [
    { type: 'hints', amount: 2, label: '+2 подсказки' },
    { type: 'error', amount: 1, label: '+1 ошибка навсегда' }
  ]},
  { day: 4, icon: '⭐', title: 'Удвоение', items: [
    { type: 'double', amount: 1, label: '×2 ★ на след. уровень' },
    { type: 'hints', amount: 2, label: '+2 подсказки' }
  ]},
  { day: 5, icon: '💡', title: 'Запас подсказок', items: [{ type: 'hints', amount: 4, label: '+4 подсказки' }] },
  { day: 6, icon: '🔥', title: 'Почти неделя', items: [
    { type: 'hints', amount: 5, label: '+5 подсказок' },
    { type: 'double', amount: 1, label: '×2 ★ на след. уровень' }
  ]},
  { day: 7, icon: '🏆', title: 'Неделя!', items: [
    { type: 'hints', amount: 5, label: '+5 подсказок' },
    { type: 'error', amount: 1, label: '+1 ошибка навсегда' },
    { type: 'skin', amount: 1, label: 'Новый стиль' },
    { type: 'double', amount: 1, label: '×2 ★ на след. уровень' }
  ]}
];

window.getDailyRewardPreview = function (day) {
  const d = ((Math.max(1, day | 0) - 1) % 7);
  return window.DAILY_REWARD_TABLE[d];
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
    const table = window.getDailyRewardPreview(day);
    const rewards = [];
    let hintsGain = 0;
    let errorGain = 0;
    let skinName = null;
    let gotDouble = false;

    (table.items || []).forEach((it) => {
      if (it.type === 'hints') {
        hintsGain += it.amount || 0;
        rewards.push({ icon: '💡', text: it.label });
      } else if (it.type === 'double') {
        p.doubleStarsNext = true;
        gotDouble = true;
        rewards.push({ icon: '⭐', text: it.label });
      } else if (it.type === 'error') {
        p.bonusMaxMistakes = (p.bonusMaxMistakes || 0) + (it.amount || 1);
        errorGain += it.amount || 1;
        rewards.push({ icon: '❤️', text: it.label });
      } else if (it.type === 'skin') {
        if (window.ARROW_SKINS && window.unlockSkin && window.isSkinUnlocked) {
          const locked = window.ARROW_SKINS.find(s => !s.free && !window.isSkinUnlocked(s.id));
          if (locked) {
            try { window.unlockSkin(locked.id); } catch (e) {}
            skinName = locked.name;
            rewards.push({ icon: '🎨', text: 'Стиль «' + locked.name + '»' });
          } else {
            hintsGain += 3;
            rewards.push({ icon: '💡', text: '+3 подсказки (все стили открыты)' });
          }
        }
      }
    });

    p.hints = (p.hints || 0) + hintsGain;
    p.lastClaimDate = window.getTodayKey();
    if (window.persistProgress) {
      try { window.persistProgress(); } catch (e) {}
    }

    const message = rewards.map(r => r.text).join(' · ');
    const nextDay = (day % 7) + 1;
    const nextPreview = window.getDailyRewardPreview(nextDay);

    return {
      ok: true,
      day: day,
      streak: streak,
      title: table.title || 'Награда дня',
      icon: table.icon || '🎁',
      hintsGain: hintsGain,
      errorGain: errorGain,
      skinName: skinName,
      doubleStars: gotDouble,
      rewards: rewards,
      message: message,
      hints: p.hints,
      nextDay: nextDay,
      nextTitle: nextPreview ? nextPreview.title : '',
      nextItems: nextPreview ? (nextPreview.items || []).map(i => i.label) : []
    };
  } catch (e) {
    console.warn('[ArrowPulse] claimDailyReward error:', e);
    return { ok: false, message: 'Ошибка награды' };
  }
};

/**
 * Daily puzzle — max difficulty for everyone today:
 * 9x9 field, every cell is an arrow (full board).
 * Deterministic peel layout (fast, always solvable, no mobile freeze).
 */
window.getDailyPuzzleLevel = function () {
  const seed = (window.getTodaySeedInt && window.getTodaySeedInt()) || dayOfYear() * 10007;
  let src;
  try {
    if (typeof window.generateDailyMaxLevel === 'function') {
      src = window.generateDailyMaxLevel(seed);
    }
  } catch (e) {
    console.warn('[ArrowPulse] daily max gen failed:', e);
    src = null;
  }
  if (!src || !src.arrows || !src.arrows.length) {
    const size = 9;
    const arrows = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dUp = y, dRight = size - 1 - x, dDown = size - 1 - y, dLeft = x;
        let dir = 0, best = dUp;
        if (dRight < best) { best = dRight; dir = 1; }
        if (dDown < best) { best = dDown; dir = 2; }
        if (dLeft < best) { dir = 3; }
        arrows.push({ x: x, y: y, dir: dir });
      }
    }
    src = { size: size, arrows: arrows, walls: [] };
  }

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
    size: src.size || 9,
    arrows: arrows,
    walls: walls,
    index: -1,
    isDaily: true,
    dailyKey: window.getTodayKey(),
    sourceIndex: -1
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

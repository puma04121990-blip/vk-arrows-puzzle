// ============================================
// Achievements
// ============================================

window.ACHIEVEMENTS = [
  {
    id: 'first_win',
    title: 'Первый шаг',
    desc: 'Пройти 1 уровень',
    icon: '🏁'
  },
  {
    id: 'perfect_level',
    title: 'Идеально',
    desc: 'Уровень на 3★ без ошибок',
    icon: '⭐'
  },
  {
    id: 'streak_5',
    title: 'Серия 5',
    desc: '5 уровней подряд 3★',
    icon: '🔥'
  },
  {
    id: 'streak_20',
    title: 'Мастер серии',
    desc: '20 уровней подряд 3★',
    icon: '💎'
  },
  {
    id: 'stage1_perfect',
    title: 'Этап 1 без ошибок',
    desc: 'Этап 1 — все на 3★',
    icon: '🛡️'
  },
  {
    id: 'stage2_perfect',
    title: 'Этап 2 без ошибок',
    desc: 'Этап 2 — все на 3★',
    icon: '🛡️'
  },
  {
    id: 'stage3_perfect',
    title: 'Этап 3 без ошибок',
    desc: 'Этап 3 — все на 3★',
    icon: '🛡️'
  },
  {
    id: 'stage4_perfect',
    title: 'Этап 4 без ошибок',
    desc: 'Этап 4 — все на 3★',
    icon: '🛡️'
  },
  {
    id: 'stage5_perfect',
    title: 'Этап 5 без ошибок',
    desc: 'Этап 5 — все на 3★',
    icon: '👑'
  },
  {
    id: 'stars_25',
    title: 'Коллекционер',
    desc: 'Собрать 25 ★',
    icon: '✨'
  },
  {
    id: 'stars_75',
    title: 'Звёздный путь',
    desc: 'Собрать 75 ★',
    icon: '🌟'
  },
  {
    id: 'stars_150',
    title: 'Полный комплект',
    desc: 'Собрать все 150 ★',
    icon: '🏆'
  },
  {
    id: 'mistakes_50',
    title: 'Учусь на ошибках',
    desc: 'Набрать 50 ошибок за всё время',
    icon: '📚'
  },
  {
    id: 'mistakes_100',
    title: 'Стойкий',
    desc: 'Набрать 100 ошибок за всё время',
    icon: '💪'
  },
  {
    id: 'levels_10',
    title: 'Разгон',
    desc: 'Пройти 10 уровней',
    icon: '🚀'
  },
  {
    id: 'levels_50',
    title: 'Финишёр',
    desc: 'Пройти все 50 уровней',
    icon: '🎯'
  },
  {
    id: 'speedster',
    title: 'Молния',
    desc: 'Пройти уровень меньше чем за 15 сек',
    icon: '⚡'
  },
  {
    id: 'no_hint_style',
    title: 'Хладнокровие',
    desc: 'Пройти уровень с 2 ошибками (1★)',
    icon: '🧊'
  }
];

function ensureStats() {
  if (!window.gameProgress.stats) {
    window.gameProgress.stats = {
      totalMistakes: 0,
      levelsCleared: 0,
      perfectStreak: 0,
      bestStreak: 0,
      unlocked: {}, // id -> timestamp
      newlyUnlocked: []
    };
  }
  if (!window.gameProgress.stats.unlocked) window.gameProgress.stats.unlocked = {};
  if (!window.gameProgress.stats.newlyUnlocked) window.gameProgress.stats.newlyUnlocked = [];
}

function unlockAchievement(id) {
  ensureStats();
  const st = window.gameProgress.stats;
  if (st.unlocked[id]) return false;
  st.unlocked[id] = Date.now();
  st.newlyUnlocked.push(id);
  return true;
}

function stageAllPerfect(stageId) {
  const stage = (window.STAGES || []).find(s => s.id === stageId);
  if (!stage) return false;
  for (let i = stage.from; i <= stage.to; i++) {
    if ((window.getLevelStars(i) || 0) < 3) return false;
  }
  // этап считается пройденным только если все уровни открыты/есть звёзды
  return true;
}

/**
 * Вызывать после прохождения уровня.
 * mistakes, stars, elapsed — за этот забег
 */
window.trackLevelResult = function (levelIndex, stars, mistakes, elapsed) {
  ensureStats();
  const st = window.gameProgress.stats;

  st.totalMistakes += mistakes || 0;
  st.levelsCleared = Math.max(st.levelsCleared, (levelIndex || 0) + 1);

  if (stars >= 3) {
    st.perfectStreak = (st.perfectStreak || 0) + 1;
    st.bestStreak = Math.max(st.bestStreak || 0, st.perfectStreak);
  } else {
    st.perfectStreak = 0;
  }

  // Checks
  if (st.levelsCleared >= 1) unlockAchievement('first_win');
  if (stars >= 3) unlockAchievement('perfect_level');
  if (st.perfectStreak >= 5) unlockAchievement('streak_5');
  if (st.perfectStreak >= 20) unlockAchievement('streak_20');

  if (stageAllPerfect(1)) unlockAchievement('stage1_perfect');
  if (stageAllPerfect(2)) unlockAchievement('stage2_perfect');
  if (stageAllPerfect(3)) unlockAchievement('stage3_perfect');
  if (stageAllPerfect(4)) unlockAchievement('stage4_perfect');
  if (stageAllPerfect(5)) unlockAchievement('stage5_perfect');

  const totalStars = window.getTotalStars ? window.getTotalStars() : 0;
  if (totalStars >= 25) unlockAchievement('stars_25');
  if (totalStars >= 75) unlockAchievement('stars_75');
  if (totalStars >= 150) unlockAchievement('stars_150');

  if (st.totalMistakes >= 50) unlockAchievement('mistakes_50');
  if (st.totalMistakes >= 100) unlockAchievement('mistakes_100');

  if (st.levelsCleared >= 10) unlockAchievement('levels_10');
  if (st.levelsCleared >= 50) unlockAchievement('levels_50');

  if (elapsed > 0 && elapsed < 15 && stars >= 1) unlockAchievement('speedster');
  if (stars === 1) unlockAchievement('no_hint_style');

  if (window.persistProgress) window.persistProgress();
  else if (typeof persist === 'function') { /* internal */ }
};

window.getUnlockedAchievements = function () {
  ensureStats();
  return window.gameProgress.stats.unlocked || {};
};

window.popNewAchievements = function () {
  ensureStats();
  const list = window.gameProgress.stats.newlyUnlocked || [];
  window.gameProgress.stats.newlyUnlocked = [];
  return list;
};

window.getAchievementById = function (id) {
  return (window.ACHIEVEMENTS || []).find(a => a.id === id) || null;
};

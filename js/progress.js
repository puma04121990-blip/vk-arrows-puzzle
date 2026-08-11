// ============================================
// Progress + Stages + Stats + Skin + Unlocked skins
// Cloud-first: VK Storage (user_id) + localStorage cache
// Rule 2.3.8 — progress sync across Android / iOS / Web
// ============================================

window.gameProgress = {
  maxLevel: 0,
  stars: {},
  skin: 'neon',
  unlockedSkins: {},
  stats: {
    totalMistakes: 0,
    levelsCleared: 0,
    perfectStreak: 0,
    bestStreak: 0,
    unlocked: {},
    newlyUnlocked: []
  },
  // Retention Phase A
  loginStreak: 0,
  lastLoginDate: '',
  lastClaimDate: '',
  hints: 0,
  doubleStarsNext: false,
  daily: { date: '', bestStars: 0, bestTime: 0, plays: 0 },
  loaded: false,
  cloudSynced: false
};

const LOCAL_KEY = 'arrow_pulse_progress_v3';
const LOCAL_KEY_LEGACY = 'arrow_pulse_progress_v2';

// Split keys + atomic full snapshot (primary for 2.3.8)
const VK_KEY_FULL = 'ap_full';
const VK_KEY_CORE = 'ap_core';
const VK_KEY_STARS = 'ap_stars';
const VK_KEY_STATS = 'ap_stats';
const VK_KEY_LEGACY = 'arrow_pulse_progress_v3';

window.STAGES = [
  { id: 1, name: 'Этап 1', from: 0,  to: 9,  needStars: 0 },
  { id: 2, name: 'Этап 2', from: 10, to: 19, needStars: 25 },
  { id: 3, name: 'Этап 3', from: 20, to: 29, needStars: 50 },
  { id: 4, name: 'Этап 4', from: 30, to: 39, needStars: 75 },
  { id: 5, name: 'Этап 5', from: 40, to: 49, needStars: 100 }
];

function isVK() {
  if (typeof vkBridge === 'undefined' || typeof vkBridge.send !== 'function') return false;
  if (window.isVK === true) return true;
  try {
    const s = String(window.location.search || '');
    if (/vk_user_id=|vk_app_id=|sign=/.test(s)) return true;
  } catch (e) {}
  // Try storage when bridge is present (inside VK iframe)
  return true;
}

function defaultStats() {
  return {
    totalMistakes: 0,
    levelsCleared: 0,
    perfectStreak: 0,
    bestStreak: 0,
    unlocked: {},
    newlyUnlocked: []
  };
}

function defaultDaily() {
  return { date: '', bestStars: 0, bestTime: 0, plays: 0 };
}

function snapshotProgress() {
  const st = window.gameProgress.stats || defaultStats();
  const daily = window.gameProgress.daily || defaultDaily();
  return {
    maxLevel: window.gameProgress.maxLevel || 0,
    stars: window.gameProgress.stars || {},
    skin: window.gameProgress.skin || 'neon',
    unlockedSkins: window.gameProgress.unlockedSkins || {},
    stats: {
      totalMistakes: st.totalMistakes || 0,
      levelsCleared: st.levelsCleared || 0,
      perfectStreak: st.perfectStreak || 0,
      bestStreak: st.bestStreak || 0,
      unlocked: st.unlocked || {}
    },
    loginStreak: window.gameProgress.loginStreak || 0,
    lastLoginDate: window.gameProgress.lastLoginDate || '',
    lastClaimDate: window.gameProgress.lastClaimDate || '',
    hints: window.gameProgress.hints || 0,
    doubleStarsNext: !!window.gameProgress.doubleStarsNext,
    daily: {
      date: daily.date || '',
      bestStars: daily.bestStars || 0,
      bestTime: daily.bestTime || 0,
      plays: daily.plays || 0
    },
    v: 5,
    ts: Date.now()
  };
}

function parseJSON(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function mergeProgress(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;

  if (typeof incoming.maxLevel === 'number') {
    base.maxLevel = Math.max(base.maxLevel || 0, incoming.maxLevel);
  }

  if (incoming.stars && typeof incoming.stars === 'object') {
    if (!base.stars) base.stars = {};
    if (Array.isArray(incoming.stars)) {
      for (let i = 0; i < incoming.stars.length; i++) {
        const v = incoming.stars[i] || 0;
        const prev = base.stars[String(i)] || 0;
        if (v > prev) base.stars[String(i)] = v;
      }
    } else {
      for (const k in incoming.stars) {
        if (!Object.prototype.hasOwnProperty.call(incoming.stars, k)) continue;
        const v = incoming.stars[k] || 0;
        const prev = base.stars[k] || 0;
        if (v > prev) base.stars[k] = v;
      }
    }
  }

  if (incoming.skin && typeof incoming.skin === 'string') {
    if (!base.skin || base.skin === 'neon') {
      base.skin = incoming.skin;
    } else if (incoming.skin !== 'neon' && (incoming.maxLevel || 0) >= (base.maxLevel || 0)) {
      base.skin = incoming.skin;
    }
  }

  if (incoming.unlockedSkins && typeof incoming.unlockedSkins === 'object') {
    if (!base.unlockedSkins) base.unlockedSkins = {};
    for (const id in incoming.unlockedSkins) {
      if (!Object.prototype.hasOwnProperty.call(incoming.unlockedSkins, id)) continue;
      if (incoming.unlockedSkins[id]) base.unlockedSkins[id] = true;
    }
  }

  if (incoming.stats && typeof incoming.stats === 'object') {
    if (!base.stats) base.stats = defaultStats();
    const bs = base.stats;
    const is = incoming.stats;
    bs.totalMistakes = Math.max(bs.totalMistakes || 0, is.totalMistakes || 0);
    bs.levelsCleared = Math.max(bs.levelsCleared || 0, is.levelsCleared || 0);
    bs.bestStreak = Math.max(bs.bestStreak || 0, is.bestStreak || 0);
    bs.perfectStreak = Math.max(bs.perfectStreak || 0, is.perfectStreak || 0);
    if (!bs.unlocked) bs.unlocked = {};
    if (is.unlocked && typeof is.unlocked === 'object') {
      for (const id in is.unlocked) {
        if (!Object.prototype.hasOwnProperty.call(is.unlocked, id)) continue;
        if (!bs.unlocked[id]) bs.unlocked[id] = is.unlocked[id];
      }
    }
    if (!Array.isArray(bs.newlyUnlocked)) bs.newlyUnlocked = [];
  }

  // Retention fields — take best streak / max hints / fresher daily
  if (typeof incoming.loginStreak === 'number') {
    base.loginStreak = Math.max(base.loginStreak || 0, incoming.loginStreak);
  }
  if (incoming.lastLoginDate && (!base.lastLoginDate || incoming.lastLoginDate > base.lastLoginDate)) {
    base.lastLoginDate = incoming.lastLoginDate;
    if (typeof incoming.loginStreak === 'number') base.loginStreak = Math.max(base.loginStreak || 0, incoming.loginStreak);
  }
  if (incoming.lastClaimDate && (!base.lastClaimDate || incoming.lastClaimDate > base.lastClaimDate)) {
    base.lastClaimDate = incoming.lastClaimDate;
  }
  if (typeof incoming.hints === 'number') {
    base.hints = Math.max(base.hints || 0, incoming.hints);
  }
  if (incoming.doubleStarsNext) base.doubleStarsNext = true;

  if (incoming.daily && typeof incoming.daily === 'object') {
    if (!base.daily) base.daily = defaultDaily();
    const bd = base.daily;
    const id = incoming.daily;
    // Prefer same-day best; if remote is newer date, take it
    if (!bd.date || (id.date && id.date > bd.date)) {
      base.daily = {
        date: id.date || '',
        bestStars: id.bestStars || 0,
        bestTime: id.bestTime || 0,
        plays: id.plays || 0
      };
    } else if (id.date === bd.date) {
      bd.bestStars = Math.max(bd.bestStars || 0, id.bestStars || 0);
      if (id.bestTime && (!bd.bestTime || id.bestTime < bd.bestTime)) bd.bestTime = id.bestTime;
      bd.plays = Math.max(bd.plays || 0, id.plays || 0);
    }
  }

  return base;
}

function applyToGameProgress(parsed) {
  if (!parsed) return;
  mergeProgress(window.gameProgress, parsed);
  if (!window.gameProgress.unlockedSkins) window.gameProgress.unlockedSkins = {};
  if (!window.gameProgress.stats) window.gameProgress.stats = defaultStats();
  if (!window.gameProgress.stats.unlocked) window.gameProgress.stats.unlocked = {};
  if (!Array.isArray(window.gameProgress.stats.newlyUnlocked)) {
    window.gameProgress.stats.newlyUnlocked = [];
  }
  if (window.gameProgress.skin && window.gameProgress.skin !== 'neon') {
    if (!window.gameProgress.unlockedSkins[window.gameProgress.skin]) {
      window.gameProgress.skin = 'neon';
    }
  }
}

function readLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return parseJSON(raw);
  } catch (e) {}
  try {
    const old = localStorage.getItem(LOCAL_KEY_LEGACY);
    if (old) return parseJSON(old);
  } catch (e) {}
  return null;
}

function writeLocalCache() {
  const data = JSON.stringify(snapshotProgress());
  try { localStorage.setItem(LOCAL_KEY, data); } catch (e) {
    console.warn('[ArrowPulse] localStorage write failed:', e);
  }
  return data;
}

function starsToCompact(starsObj) {
  const out = [];
  const s = starsObj || {};
  let maxIdx = -1;
  for (const k in s) {
    const i = parseInt(k, 10);
    if (!isNaN(i) && i > maxIdx) maxIdx = i;
  }
  const n = Math.max(maxIdx + 1, window.gameProgress.maxLevel || 0, 0);
  for (let i = 0; i < n; i++) out.push(s[String(i)] || 0);
  return out;
}

function starsFromCompact(arr) {
  const stars = {};
  if (!Array.isArray(arr)) return stars;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] || 0;
    if (v > 0) stars[String(i)] = v;
  }
  return stars;
}

function buildVkPayloads() {
  const snap = snapshotProgress();
  const unlockedList = Object.keys(snap.unlockedSkins || {}).filter(k => snap.unlockedSkins[k]);

  // Compact full blob for atomic sync (must stay < 4096 chars)
  const full = JSON.stringify({
    m: snap.maxLevel,
    s: starsToCompact(snap.stars),
    k: snap.skin,
    us: unlockedList,
    st: {
      tm: snap.stats.totalMistakes || 0,
      lc: snap.stats.levelsCleared || 0,
      ps: snap.stats.perfectStreak || 0,
      bs: snap.stats.bestStreak || 0,
      u: snap.stats.unlocked || {}
    },
    // daily retention compact
    r: {
      ls: snap.loginStreak || 0,
      ld: snap.lastLoginDate || '',
      cd: snap.lastClaimDate || '',
      h: snap.hints || 0,
      ds: snap.doubleStarsNext ? 1 : 0,
      dd: (snap.daily && snap.daily.date) || '',
      db: (snap.daily && snap.daily.bestStars) || 0,
      dt: (snap.daily && snap.daily.bestTime) || 0,
      dp: (snap.daily && snap.daily.plays) || 0
    },
    v: 5,
    ts: snap.ts
  });

  const core = JSON.stringify({
    m: snap.maxLevel,
    k: snap.skin,
    us: unlockedList,
    v: 1
  });
  const stars = JSON.stringify(starsToCompact(snap.stars));
  const stats = JSON.stringify({
    tm: snap.stats.totalMistakes || 0,
    lc: snap.stats.levelsCleared || 0,
    ps: snap.stats.perfectStreak || 0,
    bs: snap.stats.bestStreak || 0,
    u: snap.stats.unlocked || {}
  });
  return { full, core, stars, stats };
}

function parseVkFull(raw) {
  const o = parseJSON(raw);
  if (!o) return null;
  const unlockedSkins = {};
  if (Array.isArray(o.us)) o.us.forEach(id => { if (id) unlockedSkins[id] = true; });
  const stars = Array.isArray(o.s) ? starsFromCompact(o.s) : (o.stars || {});
  const st = o.st || o.stats || {};
  const r = o.r || {};
  return {
    maxLevel: typeof o.m === 'number' ? o.m : (o.maxLevel || 0),
    skin: o.k || o.skin || 'neon',
    unlockedSkins: Object.keys(unlockedSkins).length ? unlockedSkins : (o.unlockedSkins || {}),
    stars: stars,
    stats: {
      totalMistakes: st.tm || st.totalMistakes || 0,
      levelsCleared: st.lc || st.levelsCleared || 0,
      perfectStreak: st.ps || st.perfectStreak || 0,
      bestStreak: st.bs || st.bestStreak || 0,
      unlocked: st.u || st.unlocked || {},
      newlyUnlocked: []
    },
    loginStreak: r.ls || o.loginStreak || 0,
    lastLoginDate: r.ld || o.lastLoginDate || '',
    lastClaimDate: r.cd || o.lastClaimDate || '',
    hints: r.h || o.hints || 0,
    doubleStarsNext: !!(r.ds || o.doubleStarsNext),
    daily: {
      date: r.dd || (o.daily && o.daily.date) || '',
      bestStars: r.db || (o.daily && o.daily.bestStars) || 0,
      bestTime: r.dt || (o.daily && o.daily.bestTime) || 0,
      plays: r.dp || (o.daily && o.daily.plays) || 0
    }
  };
}

function parseVkCore(raw) {
  const o = parseJSON(raw);
  if (!o) return null;
  if (typeof o.m === 'number' || o.k || o.us) {
    const unlockedSkins = {};
    if (Array.isArray(o.us)) o.us.forEach(id => { if (id) unlockedSkins[id] = true; });
    return { maxLevel: o.m || 0, skin: o.k || 'neon', unlockedSkins };
  }
  return {
    maxLevel: typeof o.maxLevel === 'number' ? o.maxLevel : 0,
    skin: o.skin || 'neon',
    unlockedSkins: o.unlockedSkins || {},
    stars: o.stars,
    stats: o.stats
  };
}

function parseVkStars(raw) {
  const o = parseJSON(raw);
  if (!o) return null;
  if (Array.isArray(o)) return { stars: starsFromCompact(o) };
  if (o.stars) return { stars: o.stars };
  if (typeof o === 'object' && !Array.isArray(o)) {
    const keys = Object.keys(o);
    if (keys.length && keys.every(k => !isNaN(parseInt(k, 10)))) return { stars: o };
  }
  return null;
}

function parseVkStats(raw) {
  const o = parseJSON(raw);
  if (!o) return null;
  if (typeof o.tm === 'number' || o.u || typeof o.lc === 'number') {
    return {
      stats: {
        totalMistakes: o.tm || 0,
        levelsCleared: o.lc || 0,
        perfectStreak: o.ps || 0,
        bestStreak: o.bs || 0,
        unlocked: o.u || {},
        newlyUnlocked: []
      }
    };
  }
  if (o.stats) return { stats: o.stats };
  if (o.unlocked || typeof o.totalMistakes === 'number') {
    return {
      stats: {
        totalMistakes: o.totalMistakes || 0,
        levelsCleared: o.levelsCleared || 0,
        perfectStreak: o.perfectStreak || 0,
        bestStreak: o.bestStreak || 0,
        unlocked: o.unlocked || {},
        newlyUnlocked: []
      }
    };
  }
  return null;
}

function vkStorageSet(key, value) {
  if (typeof value !== 'string') value = String(value);
  // VK Storage value limit is 4096
  if (value.length > 4000) {
    console.warn('[ArrowPulse] storage value too long for', key, value.length);
  }
  return vkBridge.send('VKWebAppStorageSet', { key: key, value: value })
    .catch((err) => {
      console.warn('[ArrowPulse] VKWebAppStorageSet failed:', key, err);
      return new Promise((resolve) => setTimeout(resolve, 120)).then(() =>
        vkBridge.send('VKWebAppStorageSet', { key: key, value: value })
          .catch((err2) => {
            console.warn('[ArrowPulse] VKWebAppStorageSet retry failed:', key, err2);
            return null;
          })
      );
    });
}

function vkStorageGet(keys) {
  return vkBridge.send('VKWebAppStorageGet', { keys: keys })
    .then((result) => {
      const map = {};
      const list = (result && result.keys) || [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item && item.key) map[item.key] = item.value || '';
      }
      return map;
    });
}

let _persistChain = Promise.resolve();

window.persistProgress = function () {
  writeLocalCache();
  if (!isVK()) {
    window.gameProgress.cloudSynced = false;
    return Promise.resolve(true);
  }

  const payloads = buildVkPayloads();

  // Serialize writes so concurrent saves don't race
  _persistChain = _persistChain.then(() => {
    // Primary atomic full blob first (2.3.8), then split keys as backup
    return vkStorageSet(VK_KEY_FULL, payloads.full)
      .then(() => Promise.all([
        vkStorageSet(VK_KEY_CORE, payloads.core),
        vkStorageSet(VK_KEY_STARS, payloads.stars),
        vkStorageSet(VK_KEY_STATS, payloads.stats)
      ]))
      .then(() => {
        window.gameProgress.cloudSynced = true;
        return true;
      })
      .catch((err) => {
        console.warn('[ArrowPulse] persistProgress cloud failed:', err);
        window.gameProgress.cloudSynced = false;
        return false;
      });
  });

  return _persistChain;
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
  return window.persistProgress();
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
    const finish = (writeBack) => {
      window.gameProgress.loaded = true;
      if (writeBack) {
        window.persistProgress().finally(() => resolve(window.gameProgress));
      } else {
        writeLocalCache();
        resolve(window.gameProgress);
      }
    };

    // Start from local cache, then merge cloud (best-of)
    const local = readLocalCache();
    if (local) applyToGameProgress(local);

    if (!isVK()) {
      finish(false);
      return;
    }

    const keys = [VK_KEY_FULL, VK_KEY_CORE, VK_KEY_STARS, VK_KEY_STATS, VK_KEY_LEGACY];

    vkStorageGet(keys)
      .then((map) => {
        let gotCloud = false;

        // Prefer atomic full snapshot
        if (map[VK_KEY_FULL]) {
          const full = parseVkFull(map[VK_KEY_FULL]);
          if (full) {
            applyToGameProgress(full);
            gotCloud = true;
          }
        }

        if (map[VK_KEY_CORE]) {
          const core = parseVkCore(map[VK_KEY_CORE]);
          if (core) {
            applyToGameProgress(core);
            gotCloud = true;
          }
        }
        if (map[VK_KEY_STARS]) {
          const st = parseVkStars(map[VK_KEY_STARS]);
          if (st) {
            applyToGameProgress(st);
            gotCloud = true;
          }
        }
        if (map[VK_KEY_STATS]) {
          const ss = parseVkStats(map[VK_KEY_STATS]);
          if (ss) {
            applyToGameProgress(ss);
            gotCloud = true;
          }
        }
        if (map[VK_KEY_LEGACY]) {
          const leg = parseJSON(map[VK_KEY_LEGACY]);
          if (leg) {
            applyToGameProgress(leg);
            gotCloud = true;
          }
        }

        window.gameProgress.cloudSynced = gotCloud;
        // Always write back merged best-of so all platforms converge
        finish(true);
      })
      .catch((err) => {
        console.warn('[ArrowPulse] VKWebAppStorageGet failed, using local cache:', err);
        finish(false);
      });
  });
};

window.whenProgressReady = new Promise((resolve) => {
  window.__resolveProgressReady = resolve;
});

window.markProgressReady = function () {
  if (window.__resolveProgressReady) {
    window.__resolveProgressReady(window.gameProgress);
    window.__resolveProgressReady = null;
  }
  window.whenProgressReady = Promise.resolve(window.gameProgress);
};

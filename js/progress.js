// ============================================
// Один источник прогресса: VK Storage ключ «pulse»
// Телефон и веб читают/пишут один и тот же blob.
// Старые ключи читаются один раз для миграции и больше не пишутся.
// ============================================

window.STAGES = [
  { id: 1, name: 'Этап 1', from: 0,  to: 9,  needStars: 0 },
  { id: 2, name: 'Этап 2', from: 10, to: 19, needStars: 25 },
  { id: 3, name: 'Этап 3', from: 20, to: 29, needStars: 50 },
  { id: 4, name: 'Этап 4', from: 30, to: 39, needStars: 75 },
  { id: 5, name: 'Этап 5', from: 40, to: 49, needStars: 100 }
];

window.gameProgress = emptyProgress();
window.cloudStatus = {
  ready: false, synced: false, pulled: false,
  userId: '', lastSync: 0, lastPull: 0, error: '', source: ''
};

const PULSE_KEY = 'pulse';
const MIGRATE_KEYS = [
  'pulse', 'ap_full', 'ap_core', 'ap_stars', 'ap_stats', 'ap_shop', 'ap_max',
  'ap_consent', 'arrow_pulse_progress_v3'
];

let pulled = false;
let pendingWrite = false;
let chain = Promise.resolve();
let timer = 0;

function emptyProgress() {
  return {
    maxLevel: 0,
    stars: {},
    skin: 'neon',
    unlockedSkins: {},
    stats: {
      totalMistakes: 0, levelsCleared: 0, perfectStreak: 0, bestStreak: 0,
      unlocked: {}, newlyUnlocked: [], bestCombo: 0, chainsCompleted: 0, mastery: {}
    },
    loginStreak: 0,
    lastLoginDate: '',
    lastClaimDate: '',
    hints: 0,
    doubleStarsNext: false,
    daily: { date: '', bestStars: 0, bestTime: 0, plays: 0 },
    noAds: false,
    bonusMaxMistakes: 0,
    purchased: {},
    consentAccepted: false,
    loaded: false,
    cloudSynced: false
  };
}

function parseJSON(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function hasBridge() {
  return typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function';
}

function launchQuery() {
  try { return String(window.location.search || '') + String(window.location.hash || ''); }
  catch (e) { return ''; }
}

function inIframe() {
  try { return window.parent !== window; } catch (e) { return true; }
}

function isLocalHost() {
  try { return /^(localhost|127\.0\.0\.1)$/i.test(String(window.location.hostname || '')); }
  catch (e) { return false; }
}

function canUseCloud() {
  if (!hasBridge() || isLocalHost()) return false;
  if (window.isVK === true) return true;
  if (window.vkUser && window.vkUser.id) return true;
  if (/vk_user_id=|vk_app_id=|sign=/.test(launchQuery())) return true;
  if (inIframe()) return true;
  return false;
}

function currentUserId() {
  if (window.vkUser && window.vkUser.id) return String(window.vkUser.id);
  try {
    const m = launchQuery().match(/vk_user_id=(\d+)/);
    if (m) return m[1];
  } catch (e) {}
  return '';
}

function vkSet(key, value) {
  if (typeof value !== 'string') value = String(value);
  if (value.length > 4096) value = value.slice(0, 4096);
  return vkBridge.send('VKWebAppStorageSet', { key: key, value: value }).catch(function (err) {
    console.warn('[ArrowPulse] StorageSet', key, err);
    return new Promise(function (r) { setTimeout(r, 160); }).then(function () {
      return vkBridge.send('VKWebAppStorageSet', { key: key, value: value }).catch(function () { return null; });
    });
  });
}

function vkGet(keys) {
  return vkBridge.send('VKWebAppStorageGet', { keys: keys }).then(function (result) {
    const map = {};
    const list = (result && result.keys) || [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].key) map[list[i].key] = list[i].value || '';
    }
    return map;
  });
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

function starsToCompact(starsObj, maxLevel) {
  const s = starsObj || {};
  let maxIdx = -1;
  for (const k in s) {
    const i = parseInt(k, 10);
    if (!isNaN(i) && i > maxIdx) maxIdx = i;
  }
  const n = Math.max(maxIdx + 1, maxLevel || 0, 0);
  const out = [];
  for (let i = 0; i < n; i++) out.push(s[String(i)] || 0);
  return out;
}

function mergeIncoming(incoming) {
  if (!incoming || typeof incoming !== 'object') return;
  const p = window.gameProgress;
  if (typeof incoming.maxLevel === 'number') {
    p.maxLevel = Math.max(p.maxLevel || 0, incoming.maxLevel);
  }
  if (incoming.stars && typeof incoming.stars === 'object') {
    if (!p.stars) p.stars = {};
    if (Array.isArray(incoming.stars)) {
      for (let i = 0; i < incoming.stars.length; i++) {
        const v = incoming.stars[i] || 0;
        if (v > (p.stars[String(i)] || 0)) p.stars[String(i)] = v;
      }
    } else {
      for (const k in incoming.stars) {
        const v = incoming.stars[k] || 0;
        if (v > (p.stars[k] || 0)) p.stars[k] = v;
      }
    }
  }
  if (incoming.skin && typeof incoming.skin === 'string') {
    if (!p.skin || p.skin === 'neon' || (incoming.maxLevel || 0) >= (p.maxLevel || 0)) {
      p.skin = incoming.skin;
    }
  }
  if (incoming.unlockedSkins && typeof incoming.unlockedSkins === 'object') {
    if (!p.unlockedSkins) p.unlockedSkins = {};
    for (const id in incoming.unlockedSkins) {
      if (incoming.unlockedSkins[id]) p.unlockedSkins[id] = true;
    }
  }
  if (typeof incoming.hints === 'number') p.hints = Math.max(p.hints || 0, incoming.hints);
  if (incoming.doubleStarsNext) p.doubleStarsNext = true;
  if (incoming.consentAccepted) p.consentAccepted = true;
  if (incoming.noAds) p.noAds = true;
  if (typeof incoming.bonusMaxMistakes === 'number') {
    p.bonusMaxMistakes = Math.max(p.bonusMaxMistakes || 0, incoming.bonusMaxMistakes);
  }
  if (incoming.purchased && typeof incoming.purchased === 'object') {
    if (!p.purchased) p.purchased = {};
    for (const k in incoming.purchased) {
      p.purchased[k] = Math.max(p.purchased[k] || 0, incoming.purchased[k] || 0);
    }
  }
  if (incoming.stats && typeof incoming.stats === 'object') {
    if (!p.stats) p.stats = emptyProgress().stats;
    const bs = p.stats;
    const is = incoming.stats;
    bs.totalMistakes = Math.max(bs.totalMistakes || 0, is.totalMistakes || 0);
    bs.levelsCleared = Math.max(bs.levelsCleared || 0, is.levelsCleared || 0);
    bs.bestStreak = Math.max(bs.bestStreak || 0, is.bestStreak || 0);
    bs.perfectStreak = Math.max(bs.perfectStreak || 0, is.perfectStreak || 0);
    bs.bestCombo = Math.max(bs.bestCombo || 0, is.bestCombo || 0);
    bs.chainsCompleted = Math.max(bs.chainsCompleted || 0, is.chainsCompleted || 0);
    if (is.mastery && typeof is.mastery === 'object') {
      if (!bs.mastery) bs.mastery = {};
      for (const id in is.mastery) bs.mastery[id] = Math.max(bs.mastery[id] || 0, is.mastery[id] || 0);
    }
    if (is.unlocked && typeof is.unlocked === 'object') {
      if (!bs.unlocked) bs.unlocked = {};
      for (const id in is.unlocked) {
        if (is.unlocked[id] && !bs.unlocked[id]) bs.unlocked[id] = is.unlocked[id];
      }
    }
  }
  if (incoming.daily && typeof incoming.daily === 'object') {
    if (!p.daily) p.daily = { date: '', bestStars: 0, bestTime: 0, plays: 0 };
    const bd = p.daily;
    const id = incoming.daily;
    if (!bd.date || (id.date && id.date > bd.date)) {
      p.daily = {
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
  if (typeof incoming.loginStreak === 'number') {
    p.loginStreak = Math.max(p.loginStreak || 0, incoming.loginStreak);
  }
  if (incoming.lastLoginDate && (!p.lastLoginDate || incoming.lastLoginDate > p.lastLoginDate)) {
    p.lastLoginDate = incoming.lastLoginDate;
  }
  if (incoming.lastClaimDate && (!p.lastClaimDate || incoming.lastClaimDate > p.lastClaimDate)) {
    p.lastClaimDate = incoming.lastClaimDate;
  }
}

function decodePulse(raw) {
  const o = parseJSON(raw);
  if (!o) return null;
  if (typeof o.maxLevel === 'number' && o.stars) return o;
  const unlockedSkins = {};
  if (Array.isArray(o.us)) o.us.forEach(function (id) { if (id) unlockedSkins[id] = true; });
  const st = o.st || o.stats || {};
  const r = o.r || {};
  const shop = o.shop || {};
  return {
    maxLevel: typeof o.m === 'number' ? o.m : (o.maxLevel || 0),
    skin: o.k || o.skin || 'neon',
    unlockedSkins: Object.keys(unlockedSkins).length ? unlockedSkins : (o.unlockedSkins || {}),
    stars: Array.isArray(o.s) ? starsFromCompact(o.s) : (o.stars || {}),
    stats: {
      totalMistakes: st.tm || st.totalMistakes || 0,
      levelsCleared: st.lc || st.levelsCleared || 0,
      perfectStreak: st.ps || st.perfectStreak || 0,
      bestStreak: st.bs || st.bestStreak || 0,
      bestCombo: st.bc || st.bestCombo || 0,
      chainsCompleted: st.cc || st.chainsCompleted || 0,
      mastery: st.ma || st.mastery || {},
      unlocked: st.u || st.unlocked || {},
      newlyUnlocked: []
    },
    loginStreak: r.ls || o.loginStreak || 0,
    lastLoginDate: r.ld || o.lastLoginDate || '',
    lastClaimDate: r.cd || o.lastClaimDate || '',
    hints: (typeof shop.h === 'number' ? shop.h : (r.h || o.hints || 0)),
    doubleStarsNext: !!(shop.ds || r.ds || o.doubleStarsNext),
    daily: {
      date: r.dd || (o.daily && o.daily.date) || '',
      bestStars: r.db || (o.daily && o.daily.bestStars) || 0,
      bestTime: r.dt || (o.daily && o.daily.bestTime) || 0,
      plays: r.dp || (o.daily && o.daily.plays) || 0
    },
    noAds: !!(shop.na || o.noAds),
    bonusMaxMistakes: shop.bm || o.bonusMaxMistakes || 0,
    purchased: shop.p || o.purchased || {},
    consentAccepted: !!(o.c || shop.c || o.consentAccepted)
  };
}

function encodePulse() {
  const p = window.gameProgress || {};
  const st = p.stats || {};
  const daily = p.daily || {};
  const unlockedList = Object.keys(p.unlockedSkins || {}).filter(function (k) { return p.unlockedSkins[k]; });
  return JSON.stringify({
    v: 7,
    ts: Date.now(),
    m: p.maxLevel || 0,
    s: starsToCompact(p.stars, p.maxLevel || 0),
    k: p.skin || 'neon',
    us: unlockedList,
    st: {
      tm: st.totalMistakes || 0,
      lc: st.levelsCleared || 0,
      ps: st.perfectStreak || 0,
      bs: st.bestStreak || 0,
      bc: st.bestCombo || 0,
      cc: st.chainsCompleted || 0,
      ma: st.mastery || {},
      u: st.unlocked || {}
    },
    r: {
      ls: p.loginStreak || 0,
      ld: p.lastLoginDate || '',
      cd: p.lastClaimDate || '',
      dd: daily.date || '',
      db: daily.bestStars || 0,
      dt: daily.bestTime || 0,
      dp: daily.plays || 0
    },
    shop: {
      na: p.noAds ? 1 : 0,
      bm: p.bonusMaxMistakes || 0,
      p: p.purchased || {},
      h: p.hints || 0,
      ds: p.doubleStarsNext ? 1 : 0
    },
    c: p.consentAccepted ? 1 : 0
  });
}

function applyCloudMap(map) {
  if (!map) return false;
  let got = false;
  if (map[PULSE_KEY]) {
    const pulse = decodePulse(map[PULSE_KEY]);
    if (pulse) { mergeIncoming(pulse); got = true; }
  }
  if (map.ap_full) {
    const full = decodePulse(map.ap_full);
    if (full) { mergeIncoming(full); got = true; }
  }
  if (map.ap_core) {
    const core = parseJSON(map.ap_core);
    if (core) {
      const unlockedSkins = {};
      if (Array.isArray(core.us)) core.us.forEach(function (id) { if (id) unlockedSkins[id] = true; });
      mergeIncoming({
        maxLevel: typeof core.m === 'number' ? core.m : (core.maxLevel || 0),
        skin: core.k || core.skin,
        unlockedSkins: Object.keys(unlockedSkins).length ? unlockedSkins : (core.unlockedSkins || {})
      });
      got = true;
    }
  }
  if (map.ap_stars) {
    const st = parseJSON(map.ap_stars);
    if (Array.isArray(st)) { mergeIncoming({ stars: starsFromCompact(st) }); got = true; }
    else if (st && st.stars) { mergeIncoming({ stars: st.stars }); got = true; }
    else if (st && typeof st === 'object') { mergeIncoming({ stars: st }); got = true; }
  }
  if (map.ap_stats) {
    const ss = parseJSON(map.ap_stats);
    if (ss) {
      mergeIncoming({
        stats: {
          totalMistakes: ss.tm || ss.totalMistakes || 0,
          levelsCleared: ss.lc || ss.levelsCleared || 0,
          perfectStreak: ss.ps || ss.perfectStreak || 0,
          bestStreak: ss.bs || ss.bestStreak || 0,
          unlocked: ss.u || ss.unlocked || {}
        }
      });
      got = true;
    }
  }
  if (map.ap_shop) {
    const shop = parseJSON(map.ap_shop);
    if (shop) {
      mergeIncoming({
        noAds: !!shop.na,
        bonusMaxMistakes: shop.bm || 0,
        purchased: shop.p || {},
        consentAccepted: !!shop.c,
        hints: typeof shop.h === 'number' ? shop.h : 0,
        doubleStarsNext: !!shop.ds
      });
      got = true;
    }
  }
  if (map.ap_max) {
    const m = parseInt(map.ap_max, 10);
    if (!isNaN(m)) {
      mergeIncoming({ maxLevel: m });
      got = true;
    }
  }
  if (map.ap_consent === '1') {
    mergeIncoming({ consentAccepted: true });
    got = true;
  }
  if (map.arrow_pulse_progress_v3) {
    const leg = decodePulse(map.arrow_pulse_progress_v3) || parseJSON(map.arrow_pulse_progress_v3);
    if (leg) { mergeIncoming(leg); got = true; }
  }
  return got;
}

function persistNow() {
  if (!pulled) {
    pendingWrite = true;
    return Promise.resolve(false);
  }
  const blob = encodePulse();
  if (!canUseCloud()) {
    window.cloudStatus.synced = false;
    window.cloudStatus.source = 'memory';
    window.cloudStatus.ready = true;
    window.gameProgress.cloudSynced = false;
    return Promise.resolve(false);
  }
  const uid = currentUserId();
  chain = chain.then(function () {
    return vkSet(PULSE_KEY, blob).then(function () {
      window.gameProgress.cloudSynced = true;
      window.cloudStatus.synced = true;
      window.cloudStatus.userId = uid;
      window.cloudStatus.lastSync = Date.now();
      window.cloudStatus.error = '';
      window.cloudStatus.source = 'cloud';
      window.cloudStatus.ready = true;
      pendingWrite = false;
      return true;
    }).catch(function (err) {
      console.warn('[ArrowPulse] pulse save failed', err);
      window.cloudStatus.synced = false;
      window.cloudStatus.error = 'save_failed';
      window.gameProgress.cloudSynced = false;
      return false;
    });
  });
  return chain;
}

window.persistProgress = function (immediate) {
  if (immediate) {
    if (timer) { clearTimeout(timer); timer = 0; }
    return persistNow();
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(function () { timer = 0; persistNow(); }, 120);
  return Promise.resolve(true);
};

function pullAndMerge() {
  if (!canUseCloud()) {
    pulled = true;
    window.cloudStatus.ready = true;
    window.cloudStatus.pulled = true;
    window.cloudStatus.synced = false;
    window.cloudStatus.source = 'memory';
    window.gameProgress.loaded = true;
    return Promise.resolve(window.gameProgress);
  }
  if (canUseCloud()) window.isVK = true;
  return vkGet(MIGRATE_KEYS).then(function (map) {
    const got = applyCloudMap(map);
    pulled = true;
    window.cloudStatus.pulled = true;
    window.cloudStatus.ready = true;
    window.cloudStatus.synced = got;
    window.cloudStatus.userId = currentUserId();
    window.cloudStatus.lastPull = Date.now();
    window.cloudStatus.source = got ? 'cloud' : 'cloud-empty';
    window.cloudStatus.error = '';
    window.gameProgress.cloudSynced = got;
    window.gameProgress.loaded = true;
    if (pendingWrite || got || (window.gameProgress.maxLevel || 0) > 0 || window.gameProgress.consentAccepted) {
      persistNow();
    }
    return window.gameProgress;
  }).catch(function (err) {
    console.warn('[ArrowPulse] pulse load failed', err);
    pulled = true;
    window.cloudStatus.ready = true;
    window.cloudStatus.pulled = true;
    window.cloudStatus.error = 'pull_failed';
    window.cloudStatus.synced = false;
    window.gameProgress.loaded = true;
    if (pendingWrite) persistNow();
    return window.gameProgress;
  });
}

window.loadProgress = function () {
  return pullAndMerge();
};

window.pullCloudProgress = function () {
  return pullAndMerge();
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
  return window.persistProgress(true);
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

window.getCloudStatusText = function () {
  const cs = window.cloudStatus || {};
  const m = ((window.gameProgress && window.gameProgress.maxLevel) || 0) + 1;
  if (!canUseCloud()) return 'Прогресс в памяти · ур. ' + m;
  if (cs.synced) return 'Облако ВК · открыт уровень ' + m;
  if (cs.error) return 'Облако недоступно';
  if (!cs.ready || !cs.pulled) return 'Загрузка облака…';
  return 'Облако ВК · ур. ' + m;
};

window.whenProgressReady = new Promise(function (resolve) {
  window.__resolveProgressReady = resolve;
});

window.markProgressReady = function () {
  if (window.__resolveProgressReady) {
    window.__resolveProgressReady(window.gameProgress);
    window.__resolveProgressReady = null;
  }
  window.whenProgressReady = Promise.resolve(window.gameProgress);
};

if (!window.__pulseLifecycle) {
  window.__pulseLifecycle = true;
  const flush = function () { try { window.persistProgress(true); } catch (e) {} };
  try {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) flush();
      else if (canUseCloud() && Date.now() - (window.cloudStatus.lastPull || 0) > 2500) {
        window.pullCloudProgress().catch(function () {});
      }
    });
  } catch (e) {}
  try {
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
  } catch (e) {}
  if (hasBridge()) {
    try {
      vkBridge.subscribe(function (e) {
        const type = e && e.detail && e.detail.type;
        if (type === 'VKWebAppViewHide') flush();
        if (type === 'VKWebAppViewRestore') window.pullCloudProgress().catch(function () {});
      });
    } catch (e) {}
  }
}

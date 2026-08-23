// ============================================
// Cloud overlay: VK Storage is the source of truth
// Android / iOS / Mob.Web / Web  (same user_id)
// Loaded AFTER js/progress.js
// ============================================

(function () {
  const VK_KEY_FULL = 'ap_full';
  const VK_KEY_CORE = 'ap_core';
  const VK_KEY_STARS = 'ap_stars';
  const VK_KEY_STATS = 'ap_stats';
  const VK_KEY_SHOP = 'ap_shop';
  const VK_KEY_MAX = 'ap_max';
  const VK_KEY_LEGACY = 'arrow_pulse_progress_v3';
  const LOCAL_PREFIX = 'arrow_pulse_progress_v4_';
  const LOCAL_V3 = 'arrow_pulse_progress_v3';
  const ALL_KEYS = [VK_KEY_FULL, VK_KEY_CORE, VK_KEY_STARS, VK_KEY_STATS, VK_KEY_SHOP, VK_KEY_MAX, VK_KEY_LEGACY];

  if (!window.cloudStatus) {
    window.cloudStatus = {
      ready: false,
      synced: false,
      pulled: false,
      userId: '',
      lastSync: 0,
      lastPull: 0,
      error: '',
      source: 'local'
    };
  }

  function hasBridge() {
    return typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function';
  }

  function isLocalHost() {
    try {
      return /^(localhost|127\.0\.0\.1)$/i.test(String(window.location.hostname || ''));
    } catch (e) {
      return false;
    }
  }

  function launchQuery() {
    try {
      return String(window.location.search || '') + String(window.location.hash || '');
    } catch (e) {
      return '';
    }
  }

  function inIframe() {
    try { return window.parent !== window; } catch (e) { return true; }
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

  function parseJSON(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function ensureShopFields() {
    const p = window.gameProgress || (window.gameProgress = {});
    if (typeof p.noAds !== 'boolean') p.noAds = !!p.noAds;
    if (typeof p.bonusMaxMistakes !== 'number') p.bonusMaxMistakes = p.bonusMaxMistakes || 0;
    if (!p.purchased || typeof p.purchased !== 'object') p.purchased = {};
    if (!p.stars || typeof p.stars !== 'object') p.stars = {};
    if (!p.unlockedSkins || typeof p.unlockedSkins !== 'object') p.unlockedSkins = {};
  }

  function writeUserLocal() {
    ensureShopFields();
    const uid = currentUserId();
    try {
      const raw = localStorage.getItem(LOCAL_V3);
      if (raw) localStorage.setItem(LOCAL_PREFIX + (uid || 'anon'), raw);
    } catch (e) {}
  }

  function readUserLocal() {
    const uid = currentUserId();
    const keys = [LOCAL_PREFIX + (uid || 'anon')];
    if (uid) keys.push(LOCAL_PREFIX + 'anon');
    keys.push(LOCAL_V3);
    for (let i = 0; i < keys.length; i++) {
      try {
        const parsed = parseJSON(localStorage.getItem(keys[i]));
        if (parsed) return parsed;
      } catch (e) {}
    }
    return null;
  }

  window.getCloudStatusText = function () {
    const cs = window.cloudStatus || {};
    const m = ((window.gameProgress && window.gameProgress.maxLevel) || 0) + 1;
    if (!canUseCloud()) return 'Локальное сохранение · ур. ' + m;
    if (cs.synced) return 'Облако ВК · открыт уровень ' + m;
    if (cs.error) return 'Облако недоступно — локальная копия';
    if (!cs.ready || !cs.pulled) return 'Загрузка облака…';
    return 'Ожидание облака ВК';
  };

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
    const out = [];
    const s = starsObj || {};
    let maxIdx = -1;
    for (const k in s) {
      const i = parseInt(k, 10);
      if (!isNaN(i) && i > maxIdx) maxIdx = i;
    }
    const n = Math.max(maxIdx + 1, maxLevel || 0, 0);
    for (let i = 0; i < n; i++) out.push(s[String(i)] || 0);
    return out;
  }

  function mergeIncoming(incoming) {
    if (!incoming || typeof incoming !== 'object') return;
    const p = window.gameProgress || (window.gameProgress = {});
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
      if (!p.stats) p.stats = {};
      const bs = p.stats;
      const is = incoming.stats;
      bs.totalMistakes = Math.max(bs.totalMistakes || 0, is.totalMistakes || 0);
      bs.levelsCleared = Math.max(bs.levelsCleared || 0, is.levelsCleared || 0);
      bs.bestStreak = Math.max(bs.bestStreak || 0, is.bestStreak || 0);
      bs.perfectStreak = Math.max(bs.perfectStreak || 0, is.perfectStreak || 0);
      bs.bestCombo = Math.max(bs.bestCombo || 0, is.bestCombo || 0);
      bs.chainsCompleted = Math.max(bs.chainsCompleted || 0, is.chainsCompleted || 0);
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

  function parseFull(raw) {
    const o = parseJSON(raw);
    if (!o) return null;
    if (typeof o.maxLevel === 'number' && o.stars) return o;
    const unlockedSkins = {};
    if (Array.isArray(o.us)) o.us.forEach(function (id) { if (id) unlockedSkins[id] = true; });
    const st = o.st || o.stats || {};
    const r = o.r || {};
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

  function applyShop(raw) {
    const o = parseJSON(raw);
    if (!o) return;
    mergeIncoming({
      noAds: !!o.na,
      bonusMaxMistakes: o.bm || 0,
      purchased: o.p || {},
      consentAccepted: !!o.c,
      hints: typeof o.h === 'number' ? o.h : 0,
      doubleStarsNext: !!o.ds
    });
  }

  function applyCloudMap(map) {
    if (!map) return false;
    let got = false;
    if (map[VK_KEY_FULL]) {
      const full = parseFull(map[VK_KEY_FULL]);
      if (full) { mergeIncoming(full); got = true; }
    }
    if (map[VK_KEY_CORE]) {
      const core = parseJSON(map[VK_KEY_CORE]);
      if (core) {
        const unlockedSkins = {};
        if (Array.isArray(core.us)) core.us.forEach(function (id) { if (id) unlockedSkins[id] = true; });
        mergeIncoming({
          maxLevel: typeof core.m === 'number' ? core.m : (core.maxLevel || 0),
          skin: core.k || core.skin,
          unlockedSkins: Object.keys(unlockedSkins).length ? unlockedSkins : (core.unlockedSkins || {}),
          stars: core.stars,
          stats: core.stats
        });
        got = true;
      }
    }
    if (map[VK_KEY_STARS]) {
      const st = parseJSON(map[VK_KEY_STARS]);
      if (Array.isArray(st)) { mergeIncoming({ stars: starsFromCompact(st) }); got = true; }
      else if (st && st.stars) { mergeIncoming({ stars: st.stars }); got = true; }
      else if (st && typeof st === 'object') { mergeIncoming({ stars: st }); got = true; }
    }
    if (map[VK_KEY_STATS]) {
      const ss = parseJSON(map[VK_KEY_STATS]);
      if (ss) {
        mergeIncoming({
          stats: {
            totalMistakes: ss.tm || ss.totalMistakes || 0,
            levelsCleared: ss.lc || ss.levelsCleared || 0,
            perfectStreak: ss.ps || ss.perfectStreak || 0,
            bestStreak: ss.bs || ss.bestStreak || 0,
            bestCombo: ss.bc || ss.bestCombo || 0,
            chainsCompleted: ss.cc || ss.chainsCompleted || 0,
            unlocked: ss.u || ss.unlocked || {}
          }
        });
        got = true;
      }
    }
    if (map[VK_KEY_LEGACY]) {
      const leg = parseJSON(map[VK_KEY_LEGACY]);
      if (leg) { mergeIncoming(leg); got = true; }
    }
    if (map[VK_KEY_SHOP]) { applyShop(map[VK_KEY_SHOP]); got = true; }
    if (map[VK_KEY_MAX]) {
      const m = parseInt(map[VK_KEY_MAX], 10);
      if (!isNaN(m) && m > ((window.gameProgress && window.gameProgress.maxLevel) || 0)) {
        window.gameProgress.maxLevel = m;
        got = true;
      }
    }
    return got;
  }

  function compactShop() {
    const p = window.gameProgress || {};
    return JSON.stringify({
      na: p.noAds ? 1 : 0,
      bm: p.bonusMaxMistakes || 0,
      p: p.purchased || {},
      c: p.consentAccepted ? 1 : 0,
      h: p.hints || 0,
      ds: p.doubleStarsNext ? 1 : 0,
      ts: Date.now()
    });
  }

  function compactFull() {
    const p = window.gameProgress || {};
    const st = p.stats || {};
    const daily = p.daily || {};
    const unlockedList = Object.keys(p.unlockedSkins || {}).filter(function (k) { return p.unlockedSkins[k]; });
    return JSON.stringify({
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
        h: p.hints || 0,
        ds: p.doubleStarsNext ? 1 : 0,
        dd: daily.date || '',
        db: daily.bestStars || 0,
        dt: daily.bestTime || 0,
        dp: daily.plays || 0
      },
      v: 6,
      ts: Date.now()
    });
  }

  const origPersist = window.persistProgress;
  let chain = Promise.resolve();
  let timer = 0;
  let cloudPullDone = false;
  let pendingWrite = false;

  function persistCloudNow() {
    writeUserLocal();

    if (!canUseCloud()) {
      if (typeof origPersist === 'function') {
        try { origPersist(); } catch (e) {}
      }
      window.cloudStatus.synced = false;
      window.cloudStatus.source = 'local';
      window.cloudStatus.ready = true;
      return Promise.resolve(false);
    }

    // Do not push a device-local snapshot to VK until cloud has been pulled.
    // Otherwise Web (level 4) overwrites Phone (level 6).
    if (!cloudPullDone) {
      pendingWrite = true;
      return Promise.resolve(false);
    }

    const origP = (typeof origPersist === 'function') ? origPersist() : Promise.resolve();
    const uid = currentUserId();
    const full = compactFull();
    const shop = compactShop();
    const max = String((window.gameProgress && window.gameProgress.maxLevel) || 0);

    chain = chain.then(function () {
      return Promise.resolve(origP).then(function () {
        return Promise.all([
          vkSet(VK_KEY_FULL, full),
          vkSet(VK_KEY_SHOP, shop),
          vkSet(VK_KEY_MAX, max)
        ]);
      }).then(function () {
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
        console.warn('[ArrowPulse] cloud persist failed', err);
        window.cloudStatus.synced = false;
        window.cloudStatus.error = 'save_failed';
        return false;
      });
    });
    return chain;
  }

  window.persistProgress = function (immediate) {
    writeUserLocal();
    if (immediate) {
      if (timer) { clearTimeout(timer); timer = 0; }
      return persistCloudNow();
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = 0; persistCloudNow(); }, 120);
    return Promise.resolve(true);
  };

  function pullAndMerge() {
    if (!canUseCloud()) {
      window.cloudStatus.ready = true;
      window.cloudStatus.pulled = true;
      window.cloudStatus.synced = false;
      window.cloudStatus.source = 'local';
      cloudPullDone = true;
      return Promise.resolve(window.gameProgress);
    }
    return vkGet(ALL_KEYS).then(function (map) {
      const got = applyCloudMap(map);
      cloudPullDone = true;
      window.cloudStatus.pulled = true;
      window.cloudStatus.ready = true;
      window.cloudStatus.synced = got || window.cloudStatus.synced;
      window.cloudStatus.userId = currentUserId();
      window.cloudStatus.lastPull = Date.now();
      window.cloudStatus.source = got ? 'cloud' : 'local';
      window.cloudStatus.error = '';
      window.gameProgress.cloudSynced = !!window.cloudStatus.synced;
      writeUserLocal();
      if (pendingWrite || got) persistCloudNow();
      return window.gameProgress;
    }).catch(function (err) {
      console.warn('[ArrowPulse] cloud pull failed', err);
      cloudPullDone = true;
      window.cloudStatus.ready = true;
      window.cloudStatus.pulled = true;
      window.cloudStatus.error = 'pull_failed';
      window.cloudStatus.synced = false;
      if (pendingWrite) persistCloudNow();
      return window.gameProgress;
    });
  }

  const origLoad = window.loadProgress;
  window.loadProgress = function () {
    if (canUseCloud()) window.isVK = true;
    const uid = currentUserId();
    const localUser = readUserLocal();
    if (localUser) {
      try { localStorage.setItem(LOCAL_V3, JSON.stringify(localUser)); } catch (e) {}
      mergeIncoming(localUser);
    }

    const run = typeof origLoad === 'function' ? origLoad() : Promise.resolve(window.gameProgress);

    return Promise.resolve(run).then(function (prog) {
      window.cloudStatus.userId = uid;
      return pullAndMerge().then(function () { return prog || window.gameProgress; });
    });
  };

  window.pullCloudProgress = function () {
    if (canUseCloud()) window.isVK = true;
    return pullAndMerge();
  };

  const origSave = window.saveProgress;
  if (typeof origSave === 'function') {
    window.saveProgress = function (maxLevel, levelIndex, stars) {
      const result = origSave(maxLevel, levelIndex, stars);
      try { window.persistProgress(true); } catch (e) {}
      return result;
    };
  }

  if (!window.__cloudLifecycleBound3) {
    window.__cloudLifecycleBound3 = true;
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
})();

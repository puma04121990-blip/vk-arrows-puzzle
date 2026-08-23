// ============================================
// Cloud overlay: bind save to VK user_id
// Android / iOS / Mob.Web / Web
// Loaded AFTER js/progress.js
// ============================================

(function () {
  const VK_KEY_FULL = 'ap_full';
  const VK_KEY_CORE = 'ap_core';
  const VK_KEY_STARS = 'ap_stars';
  const VK_KEY_STATS = 'ap_stats';
  const VK_KEY_SHOP = 'ap_shop';
  const VK_KEY_LEGACY = 'arrow_pulse_progress_v3';
  const LOCAL_PREFIX = 'arrow_pulse_progress_v4_';

  if (!window.cloudStatus) {
    window.cloudStatus = {
      ready: false, synced: false, userId: '', lastSync: 0, lastPull: 0, error: '', source: 'local'
    };
  }

  function hasBridge() {
    return typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function';
  }

  function isVKRuntime() {
    if (!hasBridge()) return false;
    if (window.isVK === true) return true;
    if (window.isVK === false) return false;
    try {
      if (/vk_user_id=|vk_app_id=|sign=/.test(String(window.location.search || ''))) return true;
    } catch (e) {}
    try { if (window.parent && window.parent !== window) return true; } catch (e) { return true; }
    return false;
  }

  function currentUserId() {
    if (window.vkUser && window.vkUser.id) return String(window.vkUser.id);
    try {
      const m = String(window.location.search || '').match(/vk_user_id=(\d+)/);
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
  }

  function writeUserLocal() {
    ensureShopFields();
    const uid = currentUserId();
    try {
      const raw = localStorage.getItem('arrow_pulse_progress_v3');
      if (raw) localStorage.setItem(LOCAL_PREFIX + (uid || 'anon'), raw);
    } catch (e) {}
  }

  function readUserLocal() {
    const uid = currentUserId();
    const keys = [LOCAL_PREFIX + (uid || 'anon')];
    if (uid) keys.push(LOCAL_PREFIX + 'anon');
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
    if (!isVKRuntime()) return 'Локальное сохранение';
    if (cs.synced) return 'Облако ВК синхронизировано' + (cs.userId ? (' · id ' + cs.userId) : '');
    if (cs.error) return 'Облако недоступно — локальная копия';
    if (!cs.ready) return 'Загрузка облака…';
    return 'Ожидание облака ВК';
  };

  function vkSet(key, value) {
    if (typeof value !== 'string') value = String(value);
    if (value.length > 4096) value = value.slice(0, 4096);
    return vkBridge.send('VKWebAppStorageSet', { key: key, value: value }).catch(function (err) {
      console.warn('[ArrowPulse] StorageSet', key, err);
      return new Promise(function (r) { setTimeout(r, 180); }).then(function () {
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

  function applyShop(raw) {
    const o = parseJSON(raw);
    if (!o) return;
    const p = window.gameProgress || (window.gameProgress = {});
    if (o.na) p.noAds = true;
    if (typeof o.bm === 'number') p.bonusMaxMistakes = Math.max(p.bonusMaxMistakes || 0, o.bm);
    if (o.p && typeof o.p === 'object') {
      if (!p.purchased) p.purchased = {};
      for (const k in o.p) p.purchased[k] = Math.max(p.purchased[k] || 0, o.p[k] || 0);
    }
    if (o.c) p.consentAccepted = true;
    if (typeof o.h === 'number') p.hints = o.h;
    if (o.ds) p.doubleStarsNext = true;
  }

  const origPersist = window.persistProgress;
  let chain = Promise.resolve();
  let timer = 0;

  function persistCloudNow() {
    writeUserLocal();
    if (typeof origPersist === 'function') {
      try { origPersist(); } catch (e) {}
    }
    if (!isVKRuntime()) {
      window.cloudStatus.synced = false;
      window.cloudStatus.source = 'local';
      window.cloudStatus.ready = true;
      return Promise.resolve(false);
    }
    const uid = currentUserId();
    chain = chain.then(function () {
      return vkSet(VK_KEY_SHOP, compactShop()).then(function () {
        window.gameProgress.cloudSynced = true;
        window.cloudStatus.synced = true;
        window.cloudStatus.userId = uid;
        window.cloudStatus.lastSync = Date.now();
        window.cloudStatus.error = '';
        window.cloudStatus.source = 'cloud';
        window.cloudStatus.ready = true;
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
    timer = setTimeout(function () { timer = 0; persistCloudNow(); }, 280);
    return Promise.resolve(true);
  };

  const origLoad = window.loadProgress;
  window.loadProgress = function () {
    const uid = currentUserId();
    const localUser = readUserLocal();
    if (localUser) {
      try { localStorage.setItem('arrow_pulse_progress_v3', JSON.stringify(localUser)); } catch (e) {}
    }

    const run = typeof origLoad === 'function' ? origLoad() : Promise.resolve(window.gameProgress);

    return Promise.resolve(run).then(function (prog) {
      if (!isVKRuntime()) {
        window.cloudStatus.ready = true;
        window.cloudStatus.synced = false;
        window.cloudStatus.source = 'local';
        window.cloudStatus.userId = uid;
        return prog;
      }
      return vkGet([VK_KEY_FULL, VK_KEY_CORE, VK_KEY_STARS, VK_KEY_STATS, VK_KEY_SHOP, VK_KEY_LEGACY])
        .then(function (map) {
          const got = !!(map[VK_KEY_FULL] || map[VK_KEY_CORE] || map[VK_KEY_LEGACY] || map[VK_KEY_SHOP]);
          if (map[VK_KEY_SHOP]) applyShop(map[VK_KEY_SHOP]);
          window.gameProgress.cloudSynced = got || !!window.gameProgress.cloudSynced;
          window.cloudStatus.synced = !!window.gameProgress.cloudSynced;
          window.cloudStatus.ready = true;
          window.cloudStatus.userId = uid;
          window.cloudStatus.lastPull = Date.now();
          window.cloudStatus.source = window.cloudStatus.synced ? 'cloud' : 'local';
          window.cloudStatus.error = '';
          writeUserLocal();
          return window.gameProgress;
        })
        .catch(function (err) {
          console.warn('[ArrowPulse] cloud pull failed', err);
          window.cloudStatus.ready = true;
          window.cloudStatus.error = 'pull_failed';
          window.cloudStatus.synced = false;
          return window.gameProgress;
        });
    });
  };

  window.pullCloudProgress = function () {
    if (!isVKRuntime()) return Promise.resolve(window.gameProgress);
    return vkGet([VK_KEY_FULL, VK_KEY_CORE, VK_KEY_STARS, VK_KEY_STATS, VK_KEY_SHOP, VK_KEY_LEGACY])
      .then(function (map) {
        if (map[VK_KEY_SHOP]) applyShop(map[VK_KEY_SHOP]);
        window.cloudStatus.lastPull = Date.now();
        window.cloudStatus.synced = !!(map[VK_KEY_FULL] || map[VK_KEY_CORE] || window.cloudStatus.synced);
        writeUserLocal();
        return window.gameProgress;
      })
      .catch(function () { return window.gameProgress; });
  };

  if (!window.__cloudLifecycleBound2) {
    window.__cloudLifecycleBound2 = true;
    const flush = function () { try { window.persistProgress(true); } catch (e) {} };
    try {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) flush();
        else if (isVKRuntime() && Date.now() - (window.cloudStatus.lastPull || 0) > 8000) {
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

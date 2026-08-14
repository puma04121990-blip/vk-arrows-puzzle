// ============================================
// Levels: walls + color locks + rotate arrows
// Fast greedy solvability (must rotate before remove)
// ============================================

window.LOCK_COLOR_META = [
  { id: 0, name: 'red', hex: 0xff6b6b, label: '\uD83D\uDD34' },
  { id: 1, name: 'blue', hex: 0x4cc9f0, label: '\uD83D\uDD35' },
  { id: 2, name: 'yellow', hex: 0xffd166, label: '\uD83D\uDFE1' }
];

function cellKey(x, y) {
  return x + ',' + y;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _rng = Math.random;
function rnd() { return _rng(); }
function rndInt(n) { return Math.floor(rnd() * n); }

function canEscapeSim(arrow, remaining, size, wallSet) {
  let cx = arrow.x, cy = arrow.y, guard = 0;
  while (guard++ < 40) {
    if (arrow.dir === 0) cy--;
    else if (arrow.dir === 1) cx++;
    else if (arrow.dir === 2) cy++;
    else cx--;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;
    if (wallSet && wallSet.has(cellKey(cx, cy))) return false;
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].x === cx && remaining[i].y === cy) return false;
    }
  }
  return false;
}

function isLockedSim(arrow, remaining) {
  if (arrow.lockId == null) return false;
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].keyId === arrow.lockId) return true;
  }
  return false;
}

function canRemoveSim(arrow, remaining, size, wallSet) {
  if (isLockedSim(arrow, remaining)) return false;
  if (arrow.rotates && !arrow.rotated) return false;
  return canEscapeSim(arrow, remaining, size, wallSet);
}

function isSolvable(arrows, size, walls) {
  const wallSet = new Set();
  if (walls) for (let i = 0; i < walls.length; i++) wallSet.add(cellKey(walls[i].x, walls[i].y));
  const remaining = arrows.map(a => ({
    x: a.x, y: a.y, dir: a.dir,
    lockId: a.lockId != null ? a.lockId : null,
    keyId: a.keyId != null ? a.keyId : null,
    rotates: !!a.rotates, rotated: false
  }));
  let guard = 0;
  const limit = remaining.length * 6 + 30;
  while (remaining.length > 0 && guard++ < limit) {
    let progress = false;
    for (let i = 0; i < remaining.length; i++) {
      if (canRemoveSim(remaining[i], remaining, size, wallSet)) {
        remaining.splice(i, 1); progress = true; break;
      }
    }
    if (progress) continue;
    for (let i = 0; i < remaining.length; i++) {
      const a = remaining[i];
      if (a.rotates && !a.rotated && !isLockedSim(a, remaining)) {
        a.rotated = true;
        a.dir = (a.dir + 1) % 4;
        progress = true;
        break;
      }
    }
    if (!progress) return false;
  }
  return remaining.length === 0;
}

function pickDir(x, y, size, wallSet) {
  const dirs = [0, 1, 2, 3];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = rndInt(i + 1);
    const t = dirs[i]; dirs[i] = dirs[j]; dirs[j] = t;
  }
  for (let d = 0; d < 4; d++) {
    const dir = dirs[d];
    let cx = x, cy = y, ok = true, steps = 0;
    while (steps++ < size + 2) {
      if (dir === 0) cy--;
      else if (dir === 1) cx++;
      else if (dir === 2) cy++;
      else cx--;
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) return dir;
      if (wallSet && wallSet.has(cellKey(cx, cy))) { ok = false; break; }
    }
    if (ok) return dir;
  }
  return rndInt(4);
}

function assignLocks(arrows, pairs) {
  if (!pairs || pairs < 1 || arrows.length < pairs * 2) return;
  const idxs = arrows.map((_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = rndInt(i + 1);
    const t = idxs[i]; idxs[i] = idxs[j]; idxs[j] = t;
  }
  let used = 0;
  for (let p = 0; p < pairs && used + 1 < idxs.length; p++) {
    const iKey = idxs[used++];
    const iLock = idxs[used++];
    const id = p + 1;
    const color = p % 3;
    if (arrows[iKey].lockId != null || arrows[iLock].lockId != null) continue;
    if (arrows[iKey].keyId != null || arrows[iLock].keyId != null) continue;
    arrows[iKey].keyId = id; arrows[iKey].lockColor = color;
    arrows[iLock].lockId = id; arrows[iLock].lockColor = color;
  }
}

function getRotateCandidates(arrows) {
  const out = [];
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    if (a.lockId != null || a.keyId != null || a.rotates) continue;
    out.push(i);
  }
  return out;
}

function assignRotatesSafe(arrows, count, size, walls) {
  const cand = getRotateCandidates(arrows);
  for (let i = cand.length - 1; i > 0; i--) {
    const j = rndInt(i + 1);
    const t = cand[i]; cand[i] = cand[j]; cand[j] = t;
  }
  let added = 0;
  for (let c = 0; c < cand.length && added < count; c++) {
    const i = cand[c];
    arrows[i].rotates = true;
    if (isSolvable(arrows, size, walls)) added++;
    else delete arrows[i].rotates;
  }
  return added;
}

function generateLevel(size, count, wallCount, lockPairs, rotateCount, seed) {
  _rng = mulberry32((seed == null ? 1 : seed) >>> 0);
  const dense = count > size * size * 0.55;
  const maxAttempts = dense ? 80 : 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    _rng = mulberry32((((seed == null ? 1 : seed) + attempt * 9973) >>> 0));
    const occupied = new Set();
    const walls = [];
    const wallSet = new Set();
    let wSafety = 0;
    while (walls.length < wallCount && wSafety < 80) {
      wSafety++;
      const x = rndInt(size), y = rndInt(size);
      if (rnd() < 0.3 && (x === 0 || y === 0 || x === size - 1 || y === size - 1)) continue;
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;
      walls.push({ x: x, y: y }); wallSet.add(k); occupied.add(k);
    }
    const arrows = [];
    let placed = 0, safety = 0;
    const placeLimit = dense ? 500 : 250;
    while (placed < count && safety < placeLimit) {
      safety++;
      const x = rndInt(size), y = rndInt(size);
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;
      const dir = pickDir(x, y, size, wallSet);
      if (dir < 0) continue;
      arrows.push({ x: x, y: y, dir: dir });
      occupied.add(k); placed++;
    }
    if (placed < Math.floor(count * 0.9)) continue;
    if (wallCount > 0 && walls.length < wallCount) continue;
    assignLocks(arrows, lockPairs);
    if (!isSolvable(arrows, size, walls)) continue;
    if (rotateCount > 0) assignRotatesSafe(arrows, rotateCount, size, walls);
    return { size: size, arrows: arrows, walls: walls };
  }
  return createGuaranteedSafe(size);
}

function createGuaranteedSafe(size) {
  const arrows = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % 3 === 0) continue;
      const dUp = y, dRight = size - 1 - x, dDown = size - 1 - y, dLeft = x;
      let dir = 0, best = dUp;
      if (dRight < best) { best = dRight; dir = 1; }
      if (dDown < best) { best = dDown; dir = 2; }
      if (dLeft < best) { dir = 3; }
      arrows.push({ x: x, y: y, dir: dir });
    }
  }
  return { size: size, arrows: arrows, walls: [] };
}

function getSizeForLevel(levelIndex) {
  if (levelIndex < 5) return 4;
  if (levelIndex < 15) return 5;
  if (levelIndex < 25) return 6;
  if (levelIndex < 35) return 7;
  if (levelIndex < 45) return 8;
  return 9;
}
function getWallCount(levelIndex) {
  if (levelIndex < 5) return 0;
  if (levelIndex < 10) return 1;
  if (levelIndex < 20) return 2;
  if (levelIndex < 30) return 3;
  if (levelIndex < 40) return 4;
  return 5;
}
function getArrowCount(levelIndex, size) {
  const wallsN = getWallCount(levelIndex);
  const free = Math.max(4, size * size - wallsN);
  let count = Math.max(4, Math.floor(free * 0.22));
  const steps = Math.floor(levelIndex / 3);
  for (let s = 0; s < steps; s++) count += 1 + (s % 3);
  if (levelIndex >= 36) {
    const t = Math.min(1, (levelIndex - 36) / 12);
    count = Math.max(count, Math.floor(free * (0.78 + 0.20 * t)));
  }
  return Math.max(4, Math.min(free, count));
}
function getLockPairs(levelIndex) {
  if (levelIndex < 7) return 0;
  if (levelIndex < 15) return 1;
  if (levelIndex < 30) return 2;
  return 3;
}
function getRotateCount(levelIndex) {
  if (levelIndex < 12) return 0;
  if (levelIndex < 22) return 1;
  if (levelIndex < 35) return 2;
  return 2;
}

function normalizeBakedLevel(raw, index) {
  if (!raw) return null;
  const size = raw.size | 0;
  const walls = Array.isArray(raw.walls) ? raw.walls.map(w => ({ x: w.x | 0, y: w.y | 0 })) : [];
  const arrows = (raw.arrows || []).map(a => {
    const o = { x: a.x | 0, y: a.y | 0, dir: a.dir | 0 };
    if (a.lockId != null) o.lockId = a.lockId;
    if (a.keyId != null) o.keyId = a.keyId;
    if (a.lockColor != null) o.lockColor = a.lockColor;
    if (a.rotates) o.rotates = true;
    return o;
  });
  return { size: size, arrows: arrows, walls: walls, index: index };
}

function bakeLevelsFromSeed() {
  return null;
}

const LEVELS = (function buildFixedLevels() {
  if (typeof window !== 'undefined' && window.LEVELS_DATA && Array.isArray(window.LEVELS_DATA) && window.LEVELS_DATA.length) {
    return window.LEVELS_DATA.map((raw, i) => normalizeBakedLevel(raw, i)).filter(Boolean);
  }
  const out = [];
  for (let i = 0; i < 50; i++) {
    const size = getSizeForLevel(i);
    const wallsN = getWallCount(i);
    const count = getArrowCount(i, size);
    const locks = getLockPairs(i);
    const rotates = getRotateCount(i);
    const lvl = generateLevel(size, count, wallsN, locks, rotates, 1000 + i * 7919);
    out.push(Object.assign({ index: i }, lvl));
  }
  return out;
})();

/**
 * Ежедневный уровень — 9×9 + стены + замки + двухходовые.
 * Детерминированно по seed, всегда с механиками, всегда решаемо.
 */
window.generateDailyMaxLevel = function (seed) {
  const size = 9;
  const base = (seed == null ? 1 : seed) >>> 0;

  // Реалистичные конфиги (слишком плотные часто не проходят isSolvable)
  const configs = [
    { count: 42, walls: 5, locks: 2, rotates: 3 },
    { count: 40, walls: 4, locks: 2, rotates: 3 },
    { count: 38, walls: 4, locks: 2, rotates: 2 },
    { count: 36, walls: 4, locks: 1, rotates: 2 },
    { count: 34, walls: 3, locks: 2, rotates: 2 },
    { count: 32, walls: 3, locks: 1, rotates: 2 },
    { count: 28, walls: 3, locks: 1, rotates: 1 },
    { count: 24, walls: 2, locks: 1, rotates: 1 }
  ];

  for (let c = 0; c < configs.length; c++) {
    const cfg = configs[c];
    for (let attempt = 0; attempt < 40; attempt++) {
      const s = (base + c * 10007 + attempt * 9973) >>> 0;
      const lvl = generateLevel(size, cfg.count, cfg.walls, cfg.locks, cfg.rotates, s);
      if (!lvl || !lvl.arrows || !lvl.arrows.length) continue;

      const wallsN = (lvl.walls || []).length;
      // Отклоняем createGuaranteedSafe (без стен) и слабые варианты
      if (cfg.walls > 0 && wallsN < Math.max(1, cfg.walls - 1)) continue;

      const lockN = lvl.arrows.filter(function (a) { return a.lockId != null; }).length;
      if (cfg.locks > 0 && lockN < 1) continue;

      if (!isSolvable(lvl.arrows, size, lvl.walls || [])) continue;

      return {
        size: size,
        arrows: lvl.arrows,
        walls: lvl.walls || [],
        isDaily: true
      };
    }
  }

  // Конструктивный fallback: гарантированно стены + замки + повороты
  const rng = mulberry32(base ^ 0xA5A5A5);
  const occupied = new Set();
  const walls = [];
  const wallSet = new Set();

  let safety = 0;
  while (walls.length < 5 && safety < 120) {
    safety++;
    const x = 1 + ((rng() * (size - 2)) | 0);
    const y = 1 + ((rng() * (size - 2)) | 0);
    const k = cellKey(x, y);
    if (occupied.has(k)) continue;
    walls.push({ x: x, y: y });
    wallSet.add(k);
    occupied.add(k);
  }

  const candidates = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;
      const dUp = y, dRight = size - 1 - x, dDown = size - 1 - y, dLeft = x;
      let dir = 0, best = dUp;
      if (dRight < best) { best = dRight; dir = 1; }
      if (dDown < best) { best = dDown; dir = 2; }
      if (dLeft < best) { dir = 3; }
      candidates.push({ x: x, y: y, dir: dir, dist: best });
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const t = candidates[i]; candidates[i] = candidates[j]; candidates[j] = t;
  }
  candidates.sort(function (a, b) { return a.dist - b.dist; });

  const arrows = [];
  const targetCount = 40;
  for (let i = 0; i < candidates.length && arrows.length < targetCount; i++) {
    const a = candidates[i];
    const k = cellKey(a.x, a.y);
    if (occupied.has(k)) continue;
    let dir = a.dir;
    let cx = a.x, cy = a.y, blocked = false, steps = 0;
    while (steps++ < size + 2) {
      if (dir === 0) cy--;
      else if (dir === 1) cx++;
      else if (dir === 2) cy++;
      else cx--;
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) break;
      if (wallSet.has(cellKey(cx, cy))) { blocked = true; break; }
    }
    if (blocked) {
      let found = -1;
      for (let d = 0; d < 4; d++) {
        cx = a.x; cy = a.y; blocked = false; steps = 0;
        while (steps++ < size + 2) {
          if (d === 0) cy--;
          else if (d === 1) cx++;
          else if (d === 2) cy++;
          else cx--;
          if (cx < 0 || cx >= size || cy < 0 || cy >= size) { found = d; break; }
          if (wallSet.has(cellKey(cx, cy))) { blocked = true; break; }
        }
        if (found >= 0) { dir = found; break; }
      }
      if (found < 0) continue;
    }
    arrows.push({ x: a.x, y: a.y, dir: dir });
    occupied.add(k);
  }

  assignLocks(arrows, 2);
  if (!isSolvable(arrows, size, walls)) {
    arrows.forEach(function (a) {
      delete a.lockId; delete a.keyId; delete a.lockColor;
    });
    _rng = mulberry32(base ^ 0x1111);
    assignLocks(arrows, 1);
    if (!isSolvable(arrows, size, walls)) {
      arrows.forEach(function (a) {
        delete a.lockId; delete a.keyId; delete a.lockColor;
      });
    }
  }

  assignRotatesSafe(arrows, 3, size, walls);

  if (walls.length === 0) {
    walls.push({ x: 4, y: 4 });
  }

  return { size: size, arrows: arrows, walls: walls, isDaily: true };
};

if (typeof window !== 'undefined') {
  window.LEVELS = LEVELS;
  window.regenerateLevelsSeeded = bakeLevelsFromSeed;
  window.generateLevel = generateLevel;
  window.getSizeForLevel = getSizeForLevel;
  window.getWallCount = getWallCount;
  window.getArrowCount = getArrowCount;
  window.getLockPairs = getLockPairs;
  window.getRotateCount = getRotateCount;
  window.generateDailyMaxLevel = window.generateDailyMaxLevel;
}

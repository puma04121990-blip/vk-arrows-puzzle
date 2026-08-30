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

function assignLocksSafe(arrows, pairs, size, walls) {
  if (!pairs || pairs < 1 || arrows.length < pairs * 2) return 0;
  const idxs = arrows.map((_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = rndInt(i + 1);
    const t = idxs[i]; idxs[i] = idxs[j]; idxs[j] = t;
  }
  let added = 0;
  for (let n = 0; n + 1 < idxs.length && added < pairs; n += 2) {
    const iKey = idxs[n];
    const iLock = idxs[n + 1];
    const a = arrows[iKey], b = arrows[iLock];
    if (a.lockId != null || a.keyId != null || b.lockId != null || b.keyId != null) continue;
    const id = added + 1;
    const color = added % 3;
    a.keyId = id; a.lockColor = color;
    b.lockId = id; b.lockColor = color;
    if (isSolvable(arrows, size, walls)) added++;
    else {
      delete a.keyId; delete a.lockColor;
      delete b.lockId; delete b.lockColor;
    }
  }
  return added;
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

function escapesFrom(x, y, dir, size, occupied) {
  let cx = x, cy = y, steps = 0;
  while (steps++ < size + 2) {
    if (dir === 0) cy--;
    else if (dir === 1) cx++;
    else if (dir === 2) cy++;
    else cx--;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;
    if (occupied.has(cellKey(cx, cy))) return false;
  }
  return false;
}

function validEscapeDirs(x, y, size, occupied) {
  const out = [];
  for (let d = 0; d < 4; d++) {
    if (escapesFrom(x, y, d, size, occupied)) out.push(d);
  }
  return out;
}

function sitsOnRay(px, py, ax, ay, dir, size, occupied) {
  let cx = ax, cy = ay, steps = 0;
  while (steps++ < size + 2) {
    if (dir === 0) cy--;
    else if (dir === 1) cx++;
    else if (dir === 2) cy++;
    else cx--;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return false;
    if (cx === px && cy === py) return true;
    if (occupied.has(cellKey(cx, cy))) return false;
  }
  return false;
}

function countInitialFree(arrows, size, walls) {
  const wallSet = new Set();
  if (walls) for (let i = 0; i < walls.length; i++) wallSet.add(cellKey(walls[i].x, walls[i].y));
  let n = 0;
  for (let i = 0; i < arrows.length; i++) {
    if (canRemoveSim(arrows[i], arrows, size, wallSet)) n++;
  }
  return n;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rndInt(i + 1);
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function rayClearOfWalls(x, y, dir, size, wallSet) {
  let cx = x, cy = y, steps = 0;
  while (steps++ < size + 2) {
    if (dir === 0) cy--;
    else if (dir === 1) cx++;
    else if (dir === 2) cy++;
    else cx--;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;
    if (wallSet && wallSet.has(cellKey(cx, cy))) return false;
  }
  return false;
}

function tightenLevel(arrows, size, walls, minFree) {
  minFree = Math.max(1, minFree | 0);
  const wallSet = new Set();
  if (walls) for (let i = 0; i < walls.length; i++) wallSet.add(cellKey(walls[i].x, walls[i].y));
  const occupied = new Set(wallSet);
  for (let i = 0; i < arrows.length; i++) occupied.add(cellKey(arrows[i].x, arrows[i].y));

  for (let pass = 0; pass < arrows.length * 3; pass++) {
    const freeAll = countInitialFree(arrows, size, walls);
    if (freeAll <= minFree) break;
    const cand = [];
    for (let i = 0; i < arrows.length; i++) {
      const a = arrows[i];
      if (a.rotates || a.lockId != null || a.keyId != null) continue;
      if (canRemoveSim(a, arrows, size, wallSet)) cand.push(i);
    }
    if (cand.length <= 1) break;
    const i = cand[rndInt(cand.length)];
    const a = arrows[i];
    const old = a.dir;
    const dirs = [0, 1, 2, 3];
    shuffleInPlace(dirs);
    let changed = false;
    for (let d = 0; d < 4; d++) {
      const dir = dirs[d];
      if (dir === old) continue;
      if (escapesFrom(a.x, a.y, dir, size, occupied)) continue;
      if (!rayClearOfWalls(a.x, a.y, dir, size, wallSet)) continue;
      a.dir = dir;
      if (isSolvable(arrows, size, walls) && countInitialFree(arrows, size, walls) < freeAll) {
        changed = true;
        break;
      }
      a.dir = old;
    }
    if (!changed && cand.length <= 2) break;
  }
}

/**
 * Reverse-order constructor: each new arrow can escape with already-placed
 * arrows still on the board. Placement order is the reverse of a valid
 * solution, so the board is always solvable. Later arrows sit on earlier
 * rays to create peel-chains (few free moves at start).
 */
function constructLevel(size, count, wallCount, lockPairs, rotateCount, seed) {
  _rng = mulberry32((seed == null ? 1 : seed) >>> 0);
  const occupied = new Set();
  const walls = [];
  let wGuard = 0;
  while (walls.length < wallCount && wGuard++ < 220) {
    const interior = size > 4 && rnd() < 0.78;
    const x = interior ? 1 + rndInt(Math.max(1, size - 2)) : rndInt(size);
    const y = interior ? 1 + rndInt(Math.max(1, size - 2)) : rndInt(size);
    const k = cellKey(x, y);
    if (occupied.has(k)) continue;
    walls.push({ x: x, y: y });
    occupied.add(k);
  }

  const want = Math.max(4, Math.min(count, size * size - walls.length - 1));
  const arrows = [];
  const chainMode = wallCount > 0 || lockPairs > 0 || rotateCount > 0 || want > 6;

  for (let n = 0; n < want; n++) {
    const options = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const k = cellKey(x, y);
        if (occupied.has(k)) continue;
        const dirs = validEscapeDirs(x, y, size, occupied);
        if (!dirs.length) continue;
        let blocks = 0;
        for (let i = 0; i < arrows.length; i++) {
          const a = arrows[i];
          if (sitsOnRay(x, y, a.x, a.y, a.dir, size, occupied)) blocks++;
        }
        const edge = (x === 0 || y === 0 || x === size - 1 || y === size - 1) ? 1 : 0;
        options.push({ x: x, y: y, dirs: dirs, blocks: blocks, edge: edge, nDirs: dirs.length });
      }
    }
    if (!options.length) break;

    let pool = options;
    if (chainMode && n >= 2) {
      const blockers = options.filter(function (o) { return o.blocks > 0; });
      if (blockers.length) pool = blockers;
    }
    pool.sort(function (a, b) {
      if (b.blocks !== a.blocks) return b.blocks - a.blocks;
      if (a.nDirs !== b.nDirs) return a.nDirs - b.nDirs;
      if (n > want * 0.45) return b.edge - a.edge;
      return a.edge - b.edge;
    });
    const topN = Math.min(n < 3 ? 5 : 3, pool.length);
    const pick = pool[rndInt(topN)];
    let dir = pick.dirs[rndInt(pick.dirs.length)];
    if (pick.dirs.length > 1 && n > want * 0.35) {
      let bestDir = pick.dirs[0], bestLen = size + 4;
      for (let d = 0; d < pick.dirs.length; d++) {
        const dd = pick.dirs[d];
        let cx = pick.x, cy = pick.y, len = 0;
        while (len < size + 2) {
          if (dd === 0) cy--;
          else if (dd === 1) cx++;
          else if (dd === 2) cy++;
          else cx--;
          len++;
          if (cx < 0 || cx >= size || cy < 0 || cy >= size) break;
        }
        if (len < bestLen) { bestLen = len; bestDir = dd; }
      }
      dir = bestDir;
    }
    arrows.push({ x: pick.x, y: pick.y, dir: dir });
    occupied.add(cellKey(pick.x, pick.y));
  }

  if (rotateCount > 0 && arrows.length) {
    const scored = [];
    for (let i = 0; i < arrows.length; i++) {
      const a = arrows[i];
      const wrong = (a.dir + 3) % 4;
      const decoyBlocked = !escapesFrom(a.x, a.y, wrong, size, occupied);
      scored.push({ i: i, decoyBlocked: decoyBlocked ? 1 : 0, firstness: i });
    }
    scored.sort(function (a, b) {
      if (b.decoyBlocked !== a.decoyBlocked) return b.decoyBlocked - a.decoyBlocked;
      return b.firstness - a.firstness;
    });
    const pickOrder = [];
    if (scored.length) pickOrder.push(scored[0].i);
    for (let s = scored.length - 1; s >= 0; s--) {
      if (pickOrder.indexOf(scored[s].i) < 0) pickOrder.push(scored[s].i);
    }
    let added = 0;
    for (let p = 0; p < pickOrder.length && added < rotateCount; p++) {
      const a = arrows[pickOrder[p]];
      if (a.rotates) continue;
      a.rotates = true;
      a.dir = (a.dir + 3) % 4;
      added++;
    }
  }

  if (lockPairs > 0 && arrows.length >= lockPairs * 2) {
    const n = arrows.length;
    const lockSlots = [];
    const keySlots = [];
    for (let i = 0; i < n; i++) {
      const a = arrows[i];
      if (a.rotates || a.lockId != null || a.keyId != null) continue;
      if (i < n * 0.62) lockSlots.push(i);
      if (i > n * 0.32) keySlots.push(i);
    }
    let added = 0;
    for (let li = 0; li < lockSlots.length && added < lockPairs; li++) {
      const iLock = lockSlots[li];
      if (arrows[iLock].lockId != null || arrows[iLock].keyId != null || arrows[iLock].rotates) continue;
      let iKey = -1;
      for (let ki = keySlots.length - 1; ki >= 0; ki--) {
        const k = keySlots[ki];
        if (k <= iLock) continue;
        const a = arrows[k];
        if (a.rotates || a.lockId != null || a.keyId != null) continue;
        iKey = k;
        break;
      }
      if (iKey < 0) continue;
      const id = added + 1;
      const color = added % 3;
      arrows[iKey].keyId = id;
      arrows[iKey].lockColor = color;
      arrows[iLock].lockId = id;
      arrows[iLock].lockColor = color;
      added++;
    }
  }

  tightenLevel(arrows, size, walls, chainMode ? 2 : 2);
  shuffleInPlace(arrows);
  return { size: size, arrows: arrows, walls: walls };
}

function attemptGenerate(size, count, wallCount, lockPairs, rotateCount, seed, maxAttempts) {
  const dense = count > size * size * 0.55;
  const tries = maxAttempts || (dense ? 80 : 50);
  for (let attempt = 0; attempt < tries; attempt++) {
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
  return null;
}

function generateLevel(size, count, wallCount, lockPairs, rotateCount, seed) {
  const base = (seed == null ? 1 : seed) >>> 0;
  let best = null;
  let bestScore = -1e9;
  for (let t = 0; t < 14; t++) {
    const lv = constructLevel(size, count, wallCount, lockPairs, rotateCount, (base + t * 10007) >>> 0);
    if (!lv || !lv.arrows || lv.arrows.length < Math.max(4, Math.floor(count * 0.72))) continue;
    if (!isSolvable(lv.arrows, size, lv.walls || [])) continue;
    const lockN = lv.arrows.filter(function (a) { return a.lockId != null; }).length;
    const rotN = lv.arrows.filter(function (a) { return a.rotates; }).length;
    const free0 = countInitialFree(lv.arrows, size, lv.walls);
    const score =
      (lockN >= Math.min(lockPairs, 1) || lockPairs === 0 ? 180 : lockN * 45) +
      (rotN >= Math.min(rotateCount, 1) || rotateCount === 0 ? 180 : rotN * 40) +
      Math.min(lockN, lockPairs) * 25 +
      Math.min(rotN, rotateCount) * 22 +
      lv.arrows.length * 3 -
      free0 * 18 -
      Math.abs(lv.arrows.length - count) * 2;
    if (score > bestScore) {
      best = lv;
      bestScore = score;
    }
  }
  if (best) return best;

  const plans = [
    [count, wallCount, lockPairs, rotateCount],
    [Math.max(4, count - 2), wallCount, lockPairs, rotateCount],
    [Math.max(4, Math.floor(count * 0.9)), wallCount, lockPairs, Math.max(0, rotateCount - 1)],
    [Math.max(4, Math.floor(count * 0.86)), Math.max(0, wallCount - 1), Math.max(0, lockPairs - 1), Math.max(0, rotateCount - 1)]
  ];
  for (let p = 0; p < plans.length; p++) {
    const lv = attemptGenerate(size, plans[p][0], plans[p][1], plans[p][2], plans[p][3], (base + p * 10007) >>> 0, p === 0 ? 80 : 40);
    if (lv && isSolvable(lv.arrows, size, lv.walls || [])) return lv;
  }
  return constructLevel(size, Math.max(4, count - 2), wallCount, lockPairs, rotateCount, (base ^ 0xA5A55) >>> 0);
}

function createGuaranteedSafe(size, extras) {
  extras = extras || {};
  return constructLevel(
    size,
    Math.max(4, Math.floor(size * size * 0.42)),
    extras.walls | 0,
    extras.locks | 0,
    extras.rotates | 0,
    0xC0FFEE
  );
}

function getSizeForLevel(levelIndex) {
  if (levelIndex < 5) return 4;
  if (levelIndex < 12) return 5;
  if (levelIndex < 22) return 6;
  if (levelIndex < 32) return 7;
  if (levelIndex < 42) return 8;
  return 9;
}
function getWallCount(levelIndex) {
  if (levelIndex < 5) return 0;
  if (levelIndex < 8) return 1;
  if (levelIndex < 16) return 2;
  if (levelIndex < 26) return 3;
  if (levelIndex < 36) return 4;
  if (levelIndex < 45) return 5;
  return 6;
}
function getArrowCount(levelIndex, size) {
  if (levelIndex < 3) return 4;
  const wallsN = getWallCount(levelIndex);
  const free = Math.max(4, size * size - wallsN);
  const t = Math.min(1, levelIndex / 49);
  let count = Math.round(free * (0.42 + 0.10 * t));
  count += Math.floor(levelIndex / 7);
  return Math.max(4, Math.min(Math.floor(free * 0.54), Math.min(free - 2, count)));
}
function getLockPairs(levelIndex) {
  if (levelIndex < 7) return 0;
  if (levelIndex < 12) return 1;
  if (levelIndex < 20) return 2;
  return 3;
}
function getRotateCount(levelIndex) {
  if (levelIndex < 10) return 0;
  if (levelIndex < 16) return 1;
  if (levelIndex < 24) return 2;
  if (levelIndex < 36) return 3;
  return 4;
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
  const configs = [
    { count: 40, walls: 6, locks: 3, rotates: 4 },
    { count: 38, walls: 6, locks: 3, rotates: 4 },
    { count: 36, walls: 5, locks: 3, rotates: 3 },
    { count: 34, walls: 5, locks: 2, rotates: 3 }
  ];

  let best = null;
  let bestScore = -1e9;
  for (let c = 0; c < configs.length; c++) {
    const cfg = configs[c];
    for (let attempt = 0; attempt < 6; attempt++) {
      const s = (base + c * 10007 + attempt * 9973) >>> 0;
      const lvl = generateLevel(size, cfg.count, cfg.walls, cfg.locks, cfg.rotates, s);
      if (!lvl || !lvl.arrows || !lvl.arrows.length) continue;
      if (!isSolvable(lvl.arrows, size, lvl.walls || [])) continue;
      const wallsN = (lvl.walls || []).length;
      const lockN = lvl.arrows.filter(function (a) { return a.lockId != null; }).length;
      const rotN = lvl.arrows.filter(function (a) { return a.rotates; }).length;
      const free0 = countInitialFree(lvl.arrows, size, lvl.walls);
      if (cfg.walls > 0 && wallsN < 2) continue;
      const score = wallsN * 8 + lockN * 30 + rotN * 24 + lvl.arrows.length * 2 - free0 * 16;
      if (score > bestScore) {
        best = {
          size: size,
          arrows: lvl.arrows,
          walls: lvl.walls || [],
          isDaily: true
        };
        bestScore = score;
      }
      if (lockN >= 2 && rotN >= 3 && free0 <= 3) {
        return best;
      }
    }
  }
  if (best) return best;

  const fallback = constructLevel(size, 36, 5, 3, 4, (base ^ 0x51C0DE) >>> 0);
  return {
    size: size,
    arrows: fallback.arrows || [],
    walls: fallback.walls || [],
    isDaily: true
  };
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
  window.isSolvable = isSolvable;
  window.countInitialFree = countInitialFree;
}

// ============================================
// Levels: walls + color locks + rotate arrows
// Rotate: 1st tap ALWAYS turns 90°, only then can leave
// ============================================

window.LOCK_COLOR_META = [
  { id: 0, name: 'red', hex: 0xff6b6b, label: '🔴' },
  { id: 1, name: 'blue', hex: 0x4cc9f0, label: '🔵' },
  { id: 2, name: 'yellow', hex: 0xffd166, label: '🟡' }
];

function cellKey(x, y) {
  return x + ',' + y;
}

function canEscapeSim(arrow, remaining, size, wallSet) {
  let cx = arrow.x;
  let cy = arrow.y;
  let guard = 0;
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

// ВАЖНО: двухходовую без поворота снять нельзя (как в игре)
function canRemoveSim(arrow, remaining, size, wallSet) {
  if (isLockedSim(arrow, remaining)) return false;
  if (arrow.rotates && !arrow.rotated) return false;
  return canEscapeSim(arrow, remaining, size, wallSet);
}

function cloneArrows(arr) {
  return arr.map(a => ({
    x: a.x,
    y: a.y,
    dir: a.dir,
    lockId: a.lockId != null ? a.lockId : null,
    keyId: a.keyId != null ? a.keyId : null,
    rotates: !!a.rotates,
    rotated: !!a.rotated
  }));
}

function stateKey(arr) {
  return arr
    .map(a => a.x + ',' + a.y + ',' + a.dir + ',' + (a.rotated ? 1 : 0))
    .sort()
    .join('|');
}

// BFS — корректно учитывает обязательный поворот
function isSolvable(arrows, size, walls) {
  const wallSet = new Set();
  if (walls) {
    for (let i = 0; i < walls.length; i++) {
      wallSet.add(cellKey(walls[i].x, walls[i].y));
    }
  }

  const start = cloneArrows(arrows);
  const queue = [start];
  const seen = new Set([stateKey(start)]);
  let steps = 0;
  const maxSteps = 6000;

  while (queue.length > 0 && steps++ < maxSteps) {
    const cur = queue.shift();
    if (cur.length === 0) return true;

    // 1) снять любую, которую можно (незаблокированную и уже повёрнутую / обычную)
    for (let i = 0; i < cur.length; i++) {
      if (!canRemoveSim(cur[i], cur, size, wallSet)) continue;
      const next = cur.slice(0, i).concat(cur.slice(i + 1));
      const k = stateKey(next);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push(next);
      }
    }

    // 2) повернуть двухходовую (обязательный первый ход)
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i];
      if (!a.rotates || a.rotated) continue;
      if (isLockedSim(a, cur)) continue;

      const next = cur.map((x, idx) => {
        if (idx !== i) return x;
        return {
          x: x.x,
          y: x.y,
          dir: (x.dir + 1) % 4,
          lockId: x.lockId,
          keyId: x.keyId,
          rotates: true,
          rotated: true
        };
      });
      const k = stateKey(next);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push(next);
      }
    }
  }

  return false;
}

function validDirs(x, y, size, wallSet) {
  const dirs = [];
  for (let d = 0; d < 4; d++) {
    let cx = x, cy = y, ok = true, guard = 0;
    while (guard++ < 40) {
      if (d === 0) cy--;
      else if (d === 1) cx++;
      else if (d === 2) cy++;
      else cx--;
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) break;
      if (wallSet.has(cellKey(cx, cy))) { ok = false; break; }
    }
    if (ok) dirs.push(d);
  }
  return dirs;
}

function pickDir(x, y, size, wallSet) {
  const dirs = validDirs(x, y, size, wallSet);
  if (dirs.length === 0) return -1;
  const dist = [y, size - 1 - x, size - 1 - y, x];
  dirs.sort((a, b) => dist[a] - dist[b]);
  if (Math.random() < 0.7) return dirs[0];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

function createGuaranteedSafe(size) {
  const arrows = [];
  for (let y = 0; y < size; y++) {
    if (y % 2 === 0) arrows.push({ x: 0, y: y, dir: 3 });
    else arrows.push({ x: size - 1, y: y, dir: 1 });
  }
  return { size: size, arrows: arrows, walls: [] };
}

function assignLocks(arrows, pairCount) {
  if (pairCount <= 0 || arrows.length < 2) return;

  const idx = [];
  for (let i = 0; i < arrows.length; i++) idx.push(i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }

  let pairs = 0;
  let p = 0;
  while (pairs < pairCount && p + 1 < idx.length) {
    const iKey = idx[p];
    const iLock = idx[p + 1];
    p += 2;

    if (arrows[iKey].keyId != null || arrows[iKey].lockId != null) continue;
    if (arrows[iLock].keyId != null || arrows[iLock].lockId != null) continue;

    const id = pairs + 1;
    const color = pairs % 3;

    arrows[iKey].keyId = id;
    arrows[iKey].lockColor = color;
    arrows[iLock].lockId = id;
    arrows[iLock].lockColor = color;
    pairs++;
  }
}

function getRotateCandidates(arrows) {
  const candidates = [];
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    if (a.lockId != null || a.keyId != null) continue;
    if (a.rotates) continue;
    candidates.push(i);
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = candidates[i]; candidates[i] = candidates[j]; candidates[j] = t;
  }
  return candidates;
}

// Назначаем rotates только если уровень остаётся решаемым
function assignRotatesSafe(arrows, count, size, walls) {
  if (count <= 0) return 0;
  const candidates = getRotateCandidates(arrows);
  let added = 0;

  for (let c = 0; c < candidates.length && added < count; c++) {
    const i = candidates[c];
    arrows[i].rotates = true;
    if (isSolvable(arrows, size, walls)) {
      added++;
    } else {
      delete arrows[i].rotates;
    }
  }
  return added;
}

function generateLevel(size, count, wallCount, lockPairs, rotateCount) {
  const dense = count > size * size * 0.55;
  const maxAttempts = dense ? 150 : 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const occupied = new Set();
    const walls = [];
    const wallSet = new Set();

    let wSafety = 0;
    while (walls.length < wallCount && wSafety < 100) {
      wSafety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      if (Math.random() < 0.3 && (x === 0 || y === 0 || x === size - 1 || y === size - 1)) continue;
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;
      walls.push({ x: x, y: y });
      wallSet.add(k);
      occupied.add(k);
    }

    const arrows = [];
    let placed = 0;
    let safety = 0;
    const placeLimit = dense ? 800 : 300;
    while (placed < count && safety < placeLimit) {
      safety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;
      const dir = pickDir(x, y, size, wallSet);
      if (dir < 0) continue;
      arrows.push({ x: x, y: y, dir: dir });
      occupied.add(k);
      placed++;
    }

    if (placed < Math.floor(count * 0.9)) continue;
    if (wallCount > 0 && walls.length < wallCount) continue;

    assignLocks(arrows, lockPairs);

    if (!isSolvable(arrows, size, walls)) continue;

    // rotates только если после назначения уровень решаем
    if (rotateCount > 0) {
      assignRotatesSafe(arrows, rotateCount, size, walls);
    }

    return { size: size, arrows: arrows, walls: walls };
  }

  return createGuaranteedSafe(size);
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
  for (let s = 0; s < steps; s++) {
    count += 1 + (s % 3);
  }

  if (levelIndex >= 36) {
    const t = Math.min(1, (levelIndex - 36) / 12);
    const target = Math.floor(free * (0.78 + 0.20 * t));
    count = Math.max(count, target);
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

const LEVELS = [];

for (let i = 0; i < 50; i++) {
  const size = getSizeForLevel(i);
  const count = getArrowCount(i, size);
  const wallsN = getWallCount(i);
  const locksN = getLockPairs(i);
  const rotN = getRotateCount(i);
  LEVELS.push(generateLevel(size, count, wallsN, locksN, rotN));
}

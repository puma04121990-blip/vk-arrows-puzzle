// ============================================
// Levels: walls + color locks + rotate arrows
// Fast greedy solvability (mobile-safe)
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

function canRemoveSim(arrow, remaining, size, wallSet) {
  if (isLockedSim(arrow, remaining)) return false;
  return canEscapeSim(arrow, remaining, size, wallSet);
}

// Быстрый жадный решатель — не вешает телефон
function isSolvable(arrows, size, walls) {
  const wallSet = new Set();
  if (walls) {
    for (let i = 0; i < walls.length; i++) {
      wallSet.add(cellKey(walls[i].x, walls[i].y));
    }
  }

  const remaining = arrows.map(a => ({
    x: a.x,
    y: a.y,
    dir: a.dir,
    lockId: a.lockId != null ? a.lockId : null,
    keyId: a.keyId != null ? a.keyId : null,
    rotates: !!a.rotates,
    rotated: false
  }));

  let guard = 0;
  const limit = remaining.length * 4 + 20;

  while (remaining.length > 0 && guard++ < limit) {
    let progress = false;

    // Сначала снимаем всё, что можно
    for (let i = 0; i < remaining.length; i++) {
      if (canRemoveSim(remaining[i], remaining, size, wallSet)) {
        remaining.splice(i, 1);
        progress = true;
        break;
      }
    }
    if (progress) continue;

    // Иначе один поворот двухходовой
    for (let i = 0; i < remaining.length; i++) {
      const a = remaining[i];
      if (!a.rotates || a.rotated) continue;
      if (isLockedSim(a, remaining)) continue;
      a.dir = (a.dir + 1) % 4;
      a.rotated = true;
      progress = true;
      break;
    }
    if (!progress) return false;
  }

  return remaining.length === 0;
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

function assignRotates(arrows, count) {
  if (count <= 0) return;
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
  const n = Math.min(count, candidates.length);
  for (let i = 0; i < n; i++) {
    arrows[candidates[i]].rotates = true;
  }
}

function generateLevel(size, count, wallCount, lockPairs, rotateCount) {
  const maxAttempts = 80;

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
    while (placed < count && safety < 300) {
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

    if (placed < count) continue;
    if (wallCount > 0 && walls.length < wallCount) continue;

    assignLocks(arrows, lockPairs);

    // Сначала проверяем без поворотов
    if (!isSolvable(arrows, size, walls)) continue;

    // Потом добавляем двухходовые и проверяем снова
    if (rotateCount > 0) {
      assignRotates(arrows, rotateCount);
      if (!isSolvable(arrows, size, walls)) {
        // убираем rotates, уровень всё равно валиден
        for (let i = 0; i < arrows.length; i++) delete arrows[i].rotates;
      }
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

function getArrowCount(levelIndex, size) {
  const base = Math.floor(size * size * 0.26);
  const extra = Math.floor(levelIndex * 0.3);
  const count = base + extra;
  const min = Math.max(4, Math.floor(size * 1.1));
  const max = Math.floor(size * size * 0.45);
  return Math.min(max, Math.max(min, count));
}

function getWallCount(levelIndex) {
  if (levelIndex < 5) return 0;
  if (levelIndex < 10) return 1;
  if (levelIndex < 20) return 2;
  if (levelIndex < 30) return 3;
  if (levelIndex < 40) return 4;
  return 5;
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
  return 2; // max 2 на телефоне — быстрее генерация
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

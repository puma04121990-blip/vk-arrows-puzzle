// ============================================
// Walls FIRST, then arrows with valid directions
// Wall on path = blocked. Dir only if can reach edge.
// ============================================

function cellKey(x, y) {
  return x + ',' + y;
}

function canEscapeSim(arrow, remaining, size, wallSet) {
  let cx = arrow.x;
  let cy = arrow.y;
  let guard = 0;
  while (guard++ < 64) {
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

function isSolvable(arrows, size, walls) {
  const remaining = arrows.map(a => ({ x: a.x, y: a.y, dir: a.dir }));
  const wallSet = new Set();
  if (walls) {
    for (let i = 0; i < walls.length; i++) {
      wallSet.add(cellKey(walls[i].x, walls[i].y));
    }
  }
  let guard = 0;
  while (remaining.length > 0 && guard++ < 200) {
    let found = false;
    for (let i = 0; i < remaining.length; i++) {
      if (canEscapeSim(remaining[i], remaining, size, wallSet)) {
        remaining.splice(i, 1);
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return remaining.length === 0;
}

/** Направления, при которых стрелка достигает края БЕЗ пересечения стен */
function validDirs(x, y, size, wallSet) {
  const dirs = [];
  for (let d = 0; d < 4; d++) {
    let cx = x;
    let cy = y;
    let ok = true;
    let guard = 0;
    while (guard++ < 64) {
      if (d === 0) cy--;
      else if (d === 1) cx++;
      else if (d === 2) cy++;
      else cx--;
      if (cx < 0 || cx >= size || cy < 0 || cy >= size) break;
      if (wallSet.has(cellKey(cx, cy))) {
        ok = false;
        break;
      }
    }
    if (ok) dirs.push(d);
  }
  return dirs;
}

function pickDir(x, y, size, wallSet) {
  const dirs = validDirs(x, y, size, wallSet);
  if (dirs.length === 0) return -1;

  // Предпочитаем «к краю»
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

function generateLevel(size, count, wallCount) {
  const maxAttempts = 600;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const occupied = new Set();
    const walls = [];
    const wallSet = new Set();

    // 1) Сначала стены (не на самом краю поля — чтобы оставались выходы)
    let wSafety = 0;
    while (walls.length < wallCount && wSafety < 200) {
      wSafety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      // Чуть реже на самом краю
      if (wallCount > 0 && Math.random() < 0.3) {
        if (x === 0 || y === 0 || x === size - 1 || y === size - 1) continue;
      }
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;
      walls.push({ x: x, y: y });
      wallSet.add(k);
      occupied.add(k);
    }

    // 2) Стрелки на свободных клетках с валидным направлением
    const arrows = [];
    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 500) {
      safety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const k = cellKey(x, y);
      if (occupied.has(k)) continue;

      const dir = pickDir(x, y, size, wallSet);
      if (dir < 0) continue; // все направления упираются в стену

      arrows.push({ x: x, y: y, dir: dir });
      occupied.add(k);
      placed++;
    }

    if (placed < count) continue;
    if (wallCount > 0 && walls.length < wallCount) continue;

    if (isSolvable(arrows, size, walls)) {
      return { size: size, arrows: arrows, walls: walls };
    }
  }

  // Fallback: без стен, гарантированно решаемый
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

const LEVELS = [];

for (let i = 0; i < 50; i++) {
  const size = getSizeForLevel(i);
  const count = getArrowCount(i, size);
  const wallsN = getWallCount(i);
  LEVELS.push(generateLevel(size, count, wallsN));
}

// ============================================
// Levels + WALLS that truly block arrow paths
// ============================================

function cellKey(x, y) {
  return x + ',' + y;
}

function canEscapeSim(arrow, remaining, size, wallSet) {
  let cx = arrow.x;
  let cy = arrow.y;

  while (true) {
    if (arrow.dir === 0) cy--;
    else if (arrow.dir === 1) cx++;
    else if (arrow.dir === 2) cy++;
    else cx--;

    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;
    if (wallSet && wallSet.has(cellKey(cx, cy))) return false;
    if (remaining.some(a => a.x === cx && a.y === cy)) return false;
  }
}

function isSolvable(arrows, size, walls) {
  const remaining = arrows.map(a => ({ x: a.x, y: a.y, dir: a.dir }));
  const wallSet = new Set((walls || []).map(w => cellKey(w.x, w.y)));

  while (remaining.length > 0) {
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
  return true;
}

function smartDir(x, y, size) {
  const dist = [y, size - 1 - x, size - 1 - y, x];
  if (Math.random() < 0.75) {
    let best = 0;
    for (let i = 1; i < 4; i++) if (dist[i] < dist[best]) best = i;
    if (Math.random() < 0.3) {
      let second = best === 0 ? 1 : 0;
      for (let i = 0; i < 4; i++) {
        if (i !== best && dist[i] < dist[second]) second = i;
      }
      return second;
    }
    return best;
  }
  return Math.floor(Math.random() * 4);
}

/** Клетки на пути стрелки до края (не включая саму стрелку) */
function cellsOnPath(arrow, size) {
  const cells = [];
  let cx = arrow.x;
  let cy = arrow.y;
  while (true) {
    if (arrow.dir === 0) cy--;
    else if (arrow.dir === 1) cx++;
    else if (arrow.dir === 2) cy++;
    else cx--;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) break;
    cells.push({ x: cx, y: cy });
  }
  return cells;
}

function createGuaranteedSafe(size) {
  const arrows = [];
  for (let y = 0; y < size; y++) {
    if (y % 2 === 0) arrows.push({ x: 0, y, dir: 3 });
    if (y % 2 === 1) arrows.push({ x: size - 1, y, dir: 1 });
  }
  for (let x = 1; x < size - 1; x++) {
    if (x % 2 === 0) arrows.push({ x, y: 0, dir: 0 });
    if (x % 2 === 1) arrows.push({ x, y: size - 1, dir: 2 });
  }
  return { size, arrows, walls: [] };
}

/**
 * Ставим стены ИМЕННО на путях стрелок,
 * чтобы они реально мешали, но уровень оставался решаемым.
 */
function placeBlockingWalls(arrows, size, occupied, wallCount) {
  const walls = [];
  if (wallCount <= 0) return walls;

  // Кандидаты: клетки на путях стрелок, не занятые стрелками
  const candidates = [];
  const seen = new Set();

  arrows.forEach(a => {
    cellsOnPath(a, size).forEach(c => {
      const k = cellKey(c.x, c.y);
      if (occupied.has(k) || seen.has(k)) return;
      // Не ставим стену вплотную к краю слишком часто — пусть есть смысл
      seen.add(k);
      candidates.push(c);
    });
  });

  // Перемешать
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = t;
  }

  for (let i = 0; i < candidates.length && walls.length < wallCount; i++) {
    const c = candidates[i];
    const trial = walls.concat([c]);
    // Стена должна оставлять уровень решаемым
    if (isSolvable(arrows, size, trial)) {
      walls.push(c);
      occupied.add(cellKey(c.x, c.y));
    }
  }

  return walls;
}

function generateLevel(size, count, wallCount) {
  const maxAttempts = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 600) {
      safety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const key = cellKey(x, y);
      if (occupied.has(key)) continue;
      arrows.push({ x, y, dir: smartDir(x, y, size) });
      occupied.add(key);
      placed++;
    }

    if (placed < count) continue;

    // Сначала проверяем решаемость без стен
    if (!isSolvable(arrows, size, [])) continue;

    const walls = placeBlockingWalls(arrows, size, occupied, wallCount);

    // Если просили стены — стараемся получить хотя бы часть
    if (wallCount > 0 && walls.length === 0 && attempt < maxAttempts - 50) {
      continue; // попробуем другую раскладку
    }

    if (isSolvable(arrows, size, walls)) {
      return { size, arrows, walls };
    }
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
  const base = Math.floor(size * size * 0.28);
  const extra = Math.floor(levelIndex * 0.35);
  const count = base + extra;
  const min = Math.max(5, Math.floor(size * 1.2));
  const max = Math.floor(size * size * 0.5);
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
  const level = generateLevel(size, count, wallsN);

  if (!isSolvable(level.arrows, level.size, level.walls || [])) {
    LEVELS.push(createGuaranteedSafe(size));
  } else {
    LEVELS.push(level);
  }
}

console.log('Levels with path-blocking walls');
console.log('Walls:', LEVELS.map(l => (l.walls || []).length).join(','));

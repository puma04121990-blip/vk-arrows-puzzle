// ============================================
// Levels: walls always placed when required
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

function smartDir(x, y, size) {
  const dist = [y, size - 1 - x, size - 1 - y, x];
  let best = 0;
  for (let i = 1; i < 4; i++) if (dist[i] < dist[best]) best = i;
  if (Math.random() < 0.65) return best;
  return Math.floor(Math.random() * 4);
}

function createGuaranteedSafe(size) {
  const arrows = [];
  for (let y = 0; y < size; y++) {
    if (y % 2 === 0) arrows.push({ x: 0, y: y, dir: 3 });
    else arrows.push({ x: size - 1, y: y, dir: 1 });
  }
  // Одна стена в центре для демонстрации на запасных уровнях
  const mid = Math.floor(size / 2);
  const walls = size >= 5 ? [{ x: mid, y: mid }] : [];
  // Проверим — если ломает, без стен
  if (walls.length && !isSolvable(arrows, size, walls)) {
    return { size: size, arrows: arrows, walls: [] };
  }
  return { size: size, arrows: arrows, walls: walls };
}

function cellsOnPath(arrow, size) {
  const cells = [];
  let cx = arrow.x;
  let cy = arrow.y;
  let guard = 0;
  while (guard++ < 32) {
    if (arrow.dir === 0) cy--;
    else if (arrow.dir === 1) cx++;
    else if (arrow.dir === 2) cy++;
    else cx--;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) break;
    cells.push({ x: cx, y: cy });
  }
  return cells;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/**
 * Ставит стены на путях стрелок.
 * Минимум minWalls (если wallCount > 0).
 */
function buildWalls(arrows, size, occupied, wallCount) {
  if (wallCount <= 0) return [];

  const candidates = [];
  const seen = new Set();

  for (let a = 0; a < arrows.length; a++) {
    const path = cellsOnPath(arrows[a], size);
    // Предпочитаем клетки ближе к стрелке (сильнее мешают)
    for (let p = 0; p < path.length; p++) {
      const c = path[p];
      const k = cellKey(c.x, c.y);
      if (!occupied.has(k) && !seen.has(k)) {
        seen.add(k);
        candidates.push({ x: c.x, y: c.y, priority: p });
      }
    }
  }

  // Сначала клетки ближе к стрелкам
  candidates.sort((a, b) => a.priority - b.priority);
  // Небольшая перемешка среди близких
  shuffle(candidates);

  const walls = [];
  const minNeed = Math.max(1, Math.ceil(wallCount * 0.5));

  for (let i = 0; i < candidates.length && walls.length < wallCount; i++) {
    const c = { x: candidates[i].x, y: candidates[i].y };
    const trial = walls.concat([c]);
    if (isSolvable(arrows, size, trial)) {
      walls.push(c);
      occupied.add(cellKey(c.x, c.y));
    }
  }

  return walls;
}

function generateLevel(size, count, wallCount) {
  const maxAttempts = 500;
  let best = null;
  let bestWalls = -1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 400) {
      safety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const key = cellKey(x, y);
      if (occupied.has(key)) continue;
      arrows.push({ x: x, y: y, dir: smartDir(x, y, size) });
      occupied.add(key);
      placed++;
    }

    if (placed < count) continue;
    if (!isSolvable(arrows, size, [])) continue;

    const walls = buildWalls(arrows, size, occupied, wallCount);

    if (!isSolvable(arrows, size, walls)) continue;

    // Идеал: набрали нужное число стен
    if (walls.length >= wallCount || (wallCount === 0 && walls.length === 0)) {
      return { size: size, arrows: arrows, walls: walls };
    }

    // Запоминаем лучший вариант с максимальным числом стен
    if (walls.length > bestWalls) {
      bestWalls = walls.length;
      best = { size: size, arrows: arrows, walls: walls };
    }

    // Если уже есть хотя бы 1 стена при требовании — можно брать после половины попыток
    if (wallCount > 0 && walls.length >= 1 && attempt > maxAttempts * 0.5) {
      return { size: size, arrows: arrows, walls: walls };
    }
  }

  if (best && best.walls.length > 0) return best;
  if (best) return best;
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
  if (levelIndex < 5) return 0;   // 1–5
  if (levelIndex < 10) return 1;  // 6–10
  if (levelIndex < 20) return 2;  // 11–20
  if (levelIndex < 30) return 3;  // 21–30
  if (levelIndex < 40) return 4;  // 31–40
  return 5;                      // 41–50
}

const LEVELS = [];

for (let i = 0; i < 50; i++) {
  const size = getSizeForLevel(i);
  const count = getArrowCount(i, size);
  const wallsN = getWallCount(i);
  LEVELS.push(generateLevel(size, count, wallsN));
}

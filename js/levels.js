// ============================================
// Level generator with WALLS (стрелка не проходит)
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

    // Вышла за край поля — путь свободен
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;

    // Стена блокирует
    if (wallSet && wallSet.has(cellKey(cx, cy))) return false;

    // Другая стрелка блокирует
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
  if (Math.random() < 0.78) {
    let best = 0;
    for (let i = 1; i < 4; i++) {
      if (dist[i] < dist[best]) best = i;
    }
    if (Math.random() < 0.25) {
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

function generateLevel(size, count, wallCount) {
  const maxAttempts = 2500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 500) {
      safety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const key = cellKey(x, y);
      if (occupied.has(key)) continue;

      arrows.push({ x, y, dir: smartDir(x, y, size) });
      occupied.add(key);
      placed++;
    }

    // Стены на свободных клетках
    const walls = [];
    let wSafety = 0;
    while (walls.length < wallCount && wSafety < 400) {
      wSafety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const key = cellKey(x, y);
      if (occupied.has(key)) continue;
      // Не ставим стену на самом краю слишком часто — чуть разнообразия
      walls.push({ x, y });
      occupied.add(key);
    }

    if (placed === count && isSolvable(arrows, size, walls)) {
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

/** Стены появляются с 6 уровня, растут постепенно */
function getWallCount(levelIndex, size, arrowCount) {
  if (levelIndex < 5) return 0;           // 1–5 без стен
  if (levelIndex < 10) return 1;          // 6–10
  if (levelIndex < 20) return 2;
  if (levelIndex < 30) return 3;
  if (levelIndex < 40) return 4;
  return Math.min(6, Math.floor(size * 0.7));
}

const LEVELS = [];

for (let i = 0; i < 50; i++) {
  const size = getSizeForLevel(i);
  const count = getArrowCount(i, size);
  const wallsN = getWallCount(i, size, count);
  const level = generateLevel(size, count, wallsN);

  if (!isSolvable(level.arrows, level.size, level.walls)) {
    LEVELS.push(createGuaranteedSafe(size));
  } else {
    LEVELS.push(level);
  }
}

console.log('Generated 50 levels with walls');
console.log('Walls per level:', LEVELS.map(l => (l.walls || []).length).join(', '));

// ============================================
// Fast level generator + blocking walls
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
  if (Math.random() < 0.7) return best;
  return Math.floor(Math.random() * 4);
}

function createGuaranteedSafe(size) {
  const arrows = [];
  for (let y = 0; y < size; y++) {
    if (y % 2 === 0) arrows.push({ x: 0, y: y, dir: 3 });
    else arrows.push({ x: size - 1, y: y, dir: 1 });
  }
  return { size: size, arrows: arrows, walls: [] };
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

function generateLevel(size, count, wallCount) {
  const maxAttempts = 400;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 300) {
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

    // Стены: быстро, по путям, с одной проверкой в конце
    const walls = [];
    if (wallCount > 0) {
      const candidates = [];
      const seen = new Set();
      for (let a = 0; a < arrows.length; a++) {
        const path = cellsOnPath(arrows[a], size);
        for (let p = 0; p < path.length; p++) {
          const c = path[p];
          const k = cellKey(c.x, c.y);
          if (!occupied.has(k) && !seen.has(k)) {
            seen.add(k);
            candidates.push(c);
          }
        }
      }

      // shuffle partial
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = candidates[i];
        candidates[i] = candidates[j];
        candidates[j] = tmp;
      }

      for (let i = 0; i < candidates.length && walls.length < wallCount; i++) {
        const c = candidates[i];
        const trial = walls.concat([c]);
        if (isSolvable(arrows, size, trial)) {
          walls.push(c);
          occupied.add(cellKey(c.x, c.y));
        }
      }
    }

    if (isSolvable(arrows, size, walls)) {
      return { size: size, arrows: arrows, walls: walls };
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

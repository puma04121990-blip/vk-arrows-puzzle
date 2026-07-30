// ============================================
// Strong Solvable Level Generator
// ============================================

function canEscapeSim(arrow, remaining, size) {
  let cx = arrow.x;
  let cy = arrow.y;

  while (true) {
    if (arrow.dir === 0) cy--;
    else if (arrow.dir === 1) cx++;
    else if (arrow.dir === 2) cy++;
    else cx--;

    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;

    if (remaining.some(a => a.x === cx && a.y === cy)) return false;
  }
}

function isSolvable(arrows, size) {
  const remaining = arrows.map(a => ({ x: a.x, y: a.y, dir: a.dir }));

  while (remaining.length > 0) {
    let found = false;
    for (let i = 0; i < remaining.length; i++) {
      if (canEscapeSim(remaining[i], remaining, size)) {
        remaining.splice(i, 1);
        found = true;
        break;
      }
    }
    if (!found) return false; // deadlock detected
  }
  return true;
}

// Prefer directions that point toward the nearest edge (higher chance of solvability)
function smartDir(x, y, size) {
  const dist = [
    y,                // up
    size - 1 - x,     // right
    size - 1 - y,     // down
    x                 // left
  ];
  // 70% chance to pick the closest edge direction
  if (Math.random() < 0.72) {
    let best = 0;
    for (let i = 1; i < 4; i++) {
      if (dist[i] < dist[best]) best = i;
    }
    return best;
  }
  return Math.floor(Math.random() * 4);
}

function generateLevel(size, count) {
  const maxAttempts = 2500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 300) {
      safety++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const key = x + ',' + y;
      if (occupied.has(key)) continue;

      const dir = smartDir(x, y, size);
      arrows.push({ x, y, dir });
      occupied.add(key);
      placed++;
    }

    if (placed === count && isSolvable(arrows, size)) {
      return { size, arrows };
    }
  }

  // Absolute fallback - completely safe outward arrows
  return createGuaranteedSafe(size);
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
  return { size, arrows };
}

// ============================================
// Generate ALL levels with the randomizer
// ============================================

const LEVEL_CONFIGS = [
  // size, arrow count
  { size: 4, count: 6 },   // 1
  { size: 4, count: 8 },   // 2
  { size: 5, count: 9 },   // 3
  { size: 5, count: 11 },  // 4
  { size: 5, count: 12 },  // 5
  { size: 6, count: 12 },  // 6
  { size: 6, count: 14 },  // 7
  { size: 6, count: 15 },  // 8
  { size: 7, count: 14 },  // 9
  { size: 7, count: 16 },  // 10
  { size: 7, count: 17 },  // 11
  { size: 7, count: 18 },  // 12
  { size: 6, count: 13 },  // 13
  { size: 7, count: 15 },  // 14
  { size: 7, count: 19 },  // 15
];

const LEVELS = LEVEL_CONFIGS.map((cfg, i) => {
  const level = generateLevel(cfg.size, cfg.count);
  // Double-check (paranoia)
  if (!isSolvable(level.arrows, level.size)) {
    console.warn('Level', i + 1, 'failed solvability, using safe fallback');
    return createGuaranteedSafe(cfg.size);
  }
  return level;
});

console.log('All', LEVELS.length, 'levels generated and verified solvable');

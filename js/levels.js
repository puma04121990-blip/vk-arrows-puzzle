// ============================================
// Solvable Arrow Level Generator
// ============================================

function canEscapeSim(arrow, remaining, size) {
  let cx = arrow.x;
  let cy = arrow.y;

  while (true) {
    if (arrow.dir === 0) cy--;
    else if (arrow.dir === 1) cx++;
    else if (arrow.dir === 2) cy++;
    else if (arrow.dir === 3) cx--;

    if (cx < 0 || cx >= size || cy < 0 || cy >= size) return true;

    const blocked = remaining.some(a => a.x === cx && a.y === cy);
    if (blocked) return false;
  }
}

function isSolvable(arrows, size) {
  let remaining = arrows.map(a => ({ ...a }));

  while (remaining.length > 0) {
    const freeIdx = remaining.findIndex(a => canEscapeSim(a, remaining, size));
    if (freeIdx === -1) return false; // deadlock
    remaining.splice(freeIdx, 1);
  }
  return true;
}

function generateLevel(size, count, maxAttempts = 800) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let guard = 0;
    while (placed < count && guard < 200) {
      guard++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const key = `${x},${y}`;
      if (occupied.has(key)) continue;

      const dir = Math.floor(Math.random() * 4);
      arrows.push({ x, y, dir });
      occupied.add(key);
      placed++;
    }

    if (placed === count && isSolvable(arrows, size)) {
      return { size, arrows };
    }
  }

  // Fallback - very safe outward level
  return createSafeLevel(size);
}

function createSafeLevel(size) {
  const arrows = [];
  // Left side → left
  for (let y = 1; y < size - 1; y += 2) {
    arrows.push({ x: 0, y, dir: 3 });
  }
  // Right side → right
  for (let y = 1; y < size - 1; y += 2) {
    arrows.push({ x: size - 1, y, dir: 1 });
  }
  // Top → up
  for (let x = 1; x < size - 1; x += 2) {
    arrows.push({ x, y: 0, dir: 0 });
  }
  // Bottom → down
  for (let x = 1; x < size - 1; x += 2) {
    arrows.push({ x, y: size - 1, dir: 2 });
  }
  return { size, arrows };
}

// ============================================
// Pre-generated guaranteed solvable levels
// ============================================

const LEVELS = [];

// Level 1 - easy fixed
LEVELS.push({
  size: 4,
  arrows: [
    {x:0,y:1,dir:3}, {x:0,y:2,dir:3},
    {x:3,y:1,dir:1}, {x:3,y:2,dir:1},
    {x:1,y:0,dir:0}, {x:2,y:0,dir:0},
    {x:1,y:3,dir:2}, {x:2,y:3,dir:2}
  ]
});

// Level 2 - easy fixed
LEVELS.push({
  size: 5,
  arrows: [
    {x:0,y:0,dir:3}, {x:0,y:2,dir:3}, {x:0,y:4,dir:3},
    {x:4,y:0,dir:1}, {x:4,y:2,dir:1}, {x:4,y:4,dir:1},
    {x:1,y:0,dir:0}, {x:2,y:0,dir:0}, {x:3,y:0,dir:0},
    {x:1,y:4,dir:2}, {x:2,y:4,dir:2}, {x:3,y:4,dir:2},
    {x:2,y:2,dir:0}
  ]
});

// Generate remaining levels (3+)
const configs = [
  { size: 5, count: 10 },
  { size: 5, count: 12 },
  { size: 6, count: 12 },
  { size: 6, count: 14 },
  { size: 6, count: 15 },
  { size: 7, count: 14 },
  { size: 7, count: 16 },
  { size: 7, count: 18 },
  { size: 7, count: 16 },
  { size: 6, count: 13 },
];

configs.forEach(cfg => {
  LEVELS.push(generateLevel(cfg.size, cfg.count));
});

// Make sure we always have at least these
console.log(`Generated ${LEVELS.length} solvable levels`);

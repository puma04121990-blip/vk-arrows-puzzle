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
    if (!found) return false;
  }
  return true;
}

function smartDir(x, y, size) {
  const dist = [
    y,                // up
    size - 1 - x,     // right
    size - 1 - y,     // down
    x                 // left
  ];

  // Чем выше уровень — тем меньше «умных» направлений (сложнее)
  const smartChance = 0.78;
  if (Math.random() < smartChance) {
    let best = 0;
    for (let i = 1; i < 4; i++) {
      if (dist[i] < dist[best]) best = i;
    }
    // Иногда берём второе лучшее направление
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

function generateLevel(size, count) {
  const maxAttempts = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arrows = [];
    const occupied = new Set();

    let placed = 0;
    let safety = 0;
    while (placed < count && safety < 400) {
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

  // Fallback
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
// 50 LEVELS — progressive difficulty
// Grid size grows every 5 levels
// ============================================

function getSizeForLevel(levelIndex) {
  // levelIndex starts from 0
  if (levelIndex < 5)  return 4;  // 1-5
  if (levelIndex < 10) return 5;  // 6-10
  if (levelIndex < 15) return 5;  // 11-15
  if (levelIndex < 20) return 6;  // 16-20
  if (levelIndex < 25) return 6;  // 21-25
  if (levelIndex < 30) return 7;  // 26-30
  if (levelIndex < 35) return 7;  // 31-35
  if (levelIndex < 40) return 8;  // 36-40
  if (levelIndex < 45) return 8;  // 41-45
  return 9;                       // 46-50
}

function getArrowCount(levelIndex, size) {
  // Базовое количество + рост с уровнем
  const base = Math.floor(size * size * 0.28);
  const extra = Math.floor(levelIndex * 0.35);
  const count = base + extra;

  // Ограничения
  const min = Math.max(5, Math.floor(size * 1.2));
  const max = Math.floor(size * size * 0.55);

  return Math.min(max, Math.max(min, count));
}

const LEVELS = [];

for (let i = 0; i < 50; i++) {
  const size = getSizeForLevel(i);
  const count = getArrowCount(i, size);
  const level = generateLevel(size, count);

  // Финальная проверка
  if (!isSolvable(level.arrows, level.size)) {
    LEVELS.push(createGuaranteedSafe(size));
  } else {
    LEVELS.push(level);
  }
}

console.log('Generated 50 progressive levels');
console.log('Sizes:', LEVELS.map(l => l.size).join(', '));

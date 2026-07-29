// Levels data
// Each arrow: { x, y, dir } where dir: 0=up, 1=right, 2=down, 3=left
// All levels are carefully designed to be solvable (no deadlocks)

const LEVELS = [
  // ===== LEVEL 1 (очень лёгкий) =====
  // Почти все стрелки сразу имеют свободный путь
  {
    size: 5,
    arrows: [
      {x: 0, y: 1, dir: 1}, // →
      {x: 0, y: 3, dir: 1}, // →
      {x: 1, y: 0, dir: 2}, // ↓
      {x: 1, y: 4, dir: 0}, // ↑
      {x: 2, y: 2, dir: 0}, // ↑
      {x: 3, y: 0, dir: 2}, // ↓
      {x: 3, y: 4, dir: 0}, // ↑
      {x: 4, y: 1, dir: 3}, // ←
      {x: 4, y: 3, dir: 3}, // ←
    ]
  },

  // ===== LEVEL 2 =====
  {
    size: 5,
    arrows: [
      {x: 0, y: 0, dir: 1}, // →
      {x: 0, y: 2, dir: 1}, // →
      {x: 0, y: 4, dir: 1}, // →
      {x: 1, y: 1, dir: 2}, // ↓
      {x: 1, y: 3, dir: 0}, // ↑
      {x: 2, y: 0, dir: 2}, // ↓
      {x: 2, y: 2, dir: 1}, // →
      {x: 2, y: 4, dir: 0}, // ↑
      {x: 3, y: 1, dir: 2}, // ↓
      {x: 3, y: 3, dir: 0}, // ↑
      {x: 4, y: 0, dir: 3}, // ←
      {x: 4, y: 2, dir: 3}, // ←
      {x: 4, y: 4, dir: 3}, // ←
    ]
  },

  // ===== LEVEL 3 =====
  {
    size: 6,
    arrows: [
      {x: 0, y: 1, dir: 1},
      {x: 0, y: 3, dir: 1},
      {x: 0, y: 5, dir: 1},
      {x: 1, y: 0, dir: 2},
      {x: 1, y: 2, dir: 2},
      {x: 1, y: 4, dir: 0},
      {x: 2, y: 1, dir: 1},
      {x: 2, y: 3, dir: 3},
      {x: 2, y: 5, dir: 0},
      {x: 3, y: 0, dir: 2},
      {x: 3, y: 2, dir: 1},
      {x: 3, y: 4, dir: 0},
      {x: 4, y: 1, dir: 3},
      {x: 4, y: 3, dir: 2},
      {x: 4, y: 5, dir: 3},
      {x: 5, y: 0, dir: 3},
      {x: 5, y: 2, dir: 3},
      {x: 5, y: 4, dir: 3},
    ]
  },

  // ===== LEVEL 4 =====
  {
    size: 6,
    arrows: [
      {x: 0, y: 0, dir: 1},
      {x: 0, y: 2, dir: 1},
      {x: 0, y: 4, dir: 1},
      {x: 1, y: 1, dir: 2},
      {x: 1, y: 3, dir: 0},
      {x: 1, y: 5, dir: 1},
      {x: 2, y: 0, dir: 2},
      {x: 2, y: 2, dir: 1},
      {x: 2, y: 4, dir: 3},
      {x: 3, y: 1, dir: 0},
      {x: 3, y: 3, dir: 2},
      {x: 3, y: 5, dir: 3},
      {x: 4, y: 0, dir: 1},
      {x: 4, y: 2, dir: 3},
      {x: 4, y: 4, dir: 0},
      {x: 5, y: 1, dir: 3},
      {x: 5, y: 3, dir: 3},
      {x: 5, y: 5, dir: 3},
    ]
  },

  // ===== LEVEL 5 =====
  {
    size: 7,
    arrows: [
      {x: 0, y: 1, dir: 1},
      {x: 0, y: 3, dir: 1},
      {x: 0, y: 5, dir: 1},
      {x: 1, y: 0, dir: 2},
      {x: 1, y: 2, dir: 2},
      {x: 1, y: 4, dir: 0},
      {x: 1, y: 6, dir: 1},
      {x: 2, y: 1, dir: 1},
      {x: 2, y: 3, dir: 3},
      {x: 2, y: 5, dir: 0},
      {x: 3, y: 0, dir: 2},
      {x: 3, y: 2, dir: 1},
      {x: 3, y: 4, dir: 2},
      {x: 3, y: 6, dir: 0},
      {x: 4, y: 1, dir: 3},
      {x: 4, y: 3, dir: 0},
      {x: 4, y: 5, dir: 3},
      {x: 5, y: 0, dir: 2},
      {x: 5, y: 2, dir: 3},
      {x: 5, y: 4, dir: 0},
      {x: 5, y: 6, dir: 3},
      {x: 6, y: 1, dir: 3},
      {x: 6, y: 3, dir: 3},
      {x: 6, y: 5, dir: 3},
    ]
  }
];

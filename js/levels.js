// Levels with LONG arrows (paths)
// Each arrow: { path: [{x,y}, ...], dir: 0/1/2/3 }
// path goes from TAIL to HEAD
// dir = direction the HEAD is pointing
// 0=up, 1=right, 2=down, 3=left

const LEVELS = [

  // ===== LEVEL 1 (очень лёгкий) =====
  {
    size: 5,
    arrows: [
      // Горизонтальные
      { path: [{x:0,y:1}, {x:1,y:1}], dir: 3 },          // ←
      { path: [{x:4,y:1}, {x:3,y:1}], dir: 1 },          // →
      { path: [{x:0,y:3}, {x:1,y:3}, {x:2,y:3}], dir: 3 }, // ← длинная
      { path: [{x:4,y:3}, {x:3,y:3}], dir: 1 },          // →

      // Вертикальные
      { path: [{x:1,y:0}, {x:1,y:1}], dir: 0 },          // ↑
      { path: [{x:3,y:0}, {x:3,y:1}], dir: 0 },          // ↑
      { path: [{x:1,y:4}, {x:1,y:3}], dir: 2 },          // ↓
      { path: [{x:3,y:4}, {x:3,y:3}], dir: 2 },          // ↓

      // Центр
      { path: [{x:2,y:2}, {x:2,y:1}], dir: 0 },          // ↑
    ]
  },

  // ===== LEVEL 2 =====
  {
    size: 6,
    arrows: [
      // Длинные горизонтальные
      { path: [{x:0,y:1}, {x:1,y:1}, {x:2,y:1}], dir: 1 },
      { path: [{x:5,y:1}, {x:4,y:1}, {x:3,y:1}], dir: 3 },
      { path: [{x:0,y:4}, {x:1,y:4}, {x:2,y:4}], dir: 1 },
      { path: [{x:5,y:4}, {x:4,y:4}, {x:3,y:4}], dir: 3 },

      // Вертикальные с изгибом
      { path: [{x:1,y:0}, {x:1,y:1}, {x:1,y:2}], dir: 2 },
      { path: [{x:4,y:0}, {x:4,y:1}, {x:4,y:2}], dir: 2 },
      { path: [{x:1,y:5}, {x:1,y:4}, {x:1,y:3}], dir: 0 },
      { path: [{x:4,y:5}, {x:4,y:4}, {x:4,y:3}], dir: 0 },

      // Короткие по краям
      { path: [{x:2,y:0}, {x:2,y:1}], dir: 0 },
      { path: [{x:3,y:0}, {x:3,y:1}], dir: 0 },
      { path: [{x:2,y:5}, {x:2,y:4}], dir: 2 },
      { path: [{x:3,y:5}, {x:3,y:4}], dir: 2 },
    ]
  },

  // ===== LEVEL 3 =====
  {
    size: 6,
    arrows: [
      // Г-образные и длинные
      { path: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:2,y:1}], dir: 2 },
      { path: [{x:5,y:0}, {x:4,y:0}, {x:3,y:0}, {x:3,y:1}], dir: 2 },
      { path: [{x:0,y:5}, {x:1,y:5}, {x:2,y:5}, {x:2,y:4}], dir: 0 },
      { path: [{x:5,y:5}, {x:4,y:5}, {x:3,y:5}, {x:3,y:4}], dir: 0 },

      { path: [{x:0,y:2}, {x:1,y:2}, {x:1,y:3}], dir: 2 },
      { path: [{x:5,y:2}, {x:4,y:2}, {x:4,y:3}], dir: 2 },

      { path: [{x:1,y:1}, {x:1,y:2}], dir: 1 },
      { path: [{x:4,y:1}, {x:4,y:2}], dir: 3 },

      { path: [{x:2,y:2}, {x:3,y:2}], dir: 1 },
      { path: [{x:2,y:3}, {x:3,y:3}], dir: 3 },
    ]
  },

  // ===== LEVEL 4 =====
  {
    size: 7,
    arrows: [
      { path: [{x:0,y:1}, {x:1,y:1}, {x:2,y:1}, {x:2,y:2}], dir: 2 },
      { path: [{x:6,y:1}, {x:5,y:1}, {x:4,y:1}, {x:4,y:2}], dir: 2 },
      { path: [{x:0,y:5}, {x:1,y:5}, {x:2,y:5}, {x:2,y:4}], dir: 0 },
      { path: [{x:6,y:5}, {x:5,y:5}, {x:4,y:5}, {x:4,y:4}], dir: 0 },

      { path: [{x:0,y:3}, {x:1,y:3}, {x:2,y:3}], dir: 1 },
      { path: [{x:6,y:3}, {x:5,y:3}, {x:4,y:3}], dir: 3 },

      { path: [{x:3,y:0}, {x:3,y:1}, {x:3,y:2}], dir: 2 },
      { path: [{x:3,y:6}, {x:3,y:5}, {x:3,y:4}], dir: 0 },

      { path: [{x:1,y:0}, {x:1,y:1}], dir: 0 },
      { path: [{x:5,y:0}, {x:5,y:1}], dir: 0 },
      { path: [{x:1,y:6}, {x:1,y:5}], dir: 2 },
      { path: [{x:5,y:6}, {x:5,y:5}], dir: 2 },
    ]
  },

  // ===== LEVEL 5 =====
  {
    size: 7,
    arrows: [
      // Длинные змейки
      { path: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:2,y:1}, {x:2,y:2}], dir: 2 },
      { path: [{x:6,y:0}, {x:5,y:0}, {x:4,y:0}, {x:4,y:1}, {x:4,y:2}], dir: 2 },
      { path: [{x:0,y:6}, {x:1,y:6}, {x:2,y:6}, {x:2,y:5}, {x:2,y:4}], dir: 0 },
      { path: [{x:6,y:6}, {x:5,y:6}, {x:4,y:6}, {x:4,y:5}, {x:4,y:4}], dir: 0 },

      { path: [{x:0,y:2}, {x:0,y:3}, {x:1,y:3}, {x:2,y:3}], dir: 1 },
      { path: [{x:6,y:2}, {x:6,y:3}, {x:5,y:3}, {x:4,y:3}], dir: 3 },

      { path: [{x:0,y:4}, {x:1,y:4}], dir: 1 },
      { path: [{x:6,y:4}, {x:5,y:4}], dir: 3 },

      { path: [{x:3,y:0}, {x:3,y:1}], dir: 2 },
      { path: [{x:3,y:6}, {x:3,y:5}], dir: 0 },
      { path: [{x:3,y:2}, {x:3,y:3}, {x:3,y:4}], dir: 2 },
    ]
  }
];

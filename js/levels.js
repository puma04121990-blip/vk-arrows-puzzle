// Levels data
// Each arrow: { x, y, dir } where dir: 0=up, 1=right, 2=down, 3=left
// Grid is 0-based, size defined per level

const LEVELS = [
  // Level 1 - simple intro (inspired by video)
  {
    size: 5,
    arrows: [
      {x: 2, y: 0, dir: 0}, // up
      {x: 1, y: 1, dir: 1}, // right
      {x: 2, y: 1, dir: 0},
      {x: 3, y: 1, dir: 3}, // left
      {x: 0, y: 2, dir: 1},
      {x: 1, y: 2, dir: 0},
      {x: 2, y: 2, dir: 0},
      {x: 3, y: 2, dir: 0},
      {x: 4, y: 2, dir: 3},
      {x: 1, y: 3, dir: 1},
      {x: 2, y: 3, dir: 2}, // down
      {x: 3, y: 3, dir: 3},
      {x: 2, y: 4, dir: 0},
    ]
  },
  // Level 2 - medium
  {
    size: 6,
    arrows: [
      {x: 1, y: 0, dir: 2},
      {x: 2, y: 0, dir: 1},
      {x: 3, y: 0, dir: 2},
      {x: 4, y: 0, dir: 3},
      {x: 0, y: 1, dir: 1},
      {x: 1, y: 1, dir: 2},
      {x: 3, y: 1, dir: 0},
      {x: 4, y: 1, dir: 2},
      {x: 5, y: 1, dir: 3},
      {x: 0, y: 2, dir: 1},
      {x: 2, y: 2, dir: 0},
      {x: 3, y: 2, dir: 1},
      {x: 5, y: 2, dir: 2},
      {x: 1, y: 3, dir: 0},
      {x: 2, y: 3, dir: 3},
      {x: 4, y: 3, dir: 0},
      {x: 0, y: 4, dir: 1},
      {x: 1, y: 4, dir: 2},
      {x: 3, y: 4, dir: 3},
      {x: 4, y: 4, dir: 0},
      {x: 2, y: 5, dir: 0},
      {x: 3, y: 5, dir: 1},
    ]
  },
  // Level 3
  {
    size: 7,
    arrows: [
      {x: 3, y: 0, dir: 2},
      {x: 1, y: 1, dir: 1},
      {x: 2, y: 1, dir: 2},
      {x: 4, y: 1, dir: 2},
      {x: 5, y: 1, dir: 3},
      {x: 0, y: 2, dir: 1},
      {x: 1, y: 2, dir: 0},
      {x: 3, y: 2, dir: 1},
      {x: 5, y: 2, dir: 2},
      {x: 6, y: 2, dir: 3},
      {x: 2, y: 3, dir: 0},
      {x: 3, y: 3, dir: 2},
      {x: 4, y: 3, dir: 3},
      {x: 1, y: 4, dir: 1},
      {x: 2, y: 4, dir: 0},
      {x: 4, y: 4, dir: 0},
      {x: 5, y: 4, dir: 3},
      {x: 0, y: 5, dir: 1},
      {x: 3, y: 5, dir: 0},
      {x: 6, y: 5, dir: 3},
      {x: 2, y: 6, dir: 0},
      {x: 3, y: 6, dir: 1},
      {x: 4, y: 6, dir: 0},
    ]
  },
  // Level 4 - harder
  {
    size: 7,
    arrows: [
      {x: 0, y: 0, dir: 1},
      {x: 2, y: 0, dir: 2},
      {x: 4, y: 0, dir: 2},
      {x: 6, y: 0, dir: 3},
      {x: 1, y: 1, dir: 2},
      {x: 3, y: 1, dir: 1},
      {x: 5, y: 1, dir: 2},
      {x: 0, y: 2, dir: 1},
      {x: 2, y: 2, dir: 0},
      {x: 4, y: 2, dir: 3},
      {x: 6, y: 2, dir: 2},
      {x: 1, y: 3, dir: 0},
      {x: 3, y: 3, dir: 2},
      {x: 5, y: 3, dir: 0},
      {x: 0, y: 4, dir: 1},
      {x: 2, y: 4, dir: 3},
      {x: 4, y: 4, dir: 1},
      {x: 6, y: 4, dir: 3},
      {x: 1, y: 5, dir: 2},
      {x: 3, y: 5, dir: 0},
      {x: 5, y: 5, dir: 2},
      {x: 0, y: 6, dir: 1},
      {x: 2, y: 6, dir: 0},
      {x: 4, y: 6, dir: 0},
      {x: 6, y: 6, dir: 3},
    ]
  },
  // Level 5
  {
    size: 8,
    arrows: [
      {x: 2, y: 0, dir: 2},
      {x: 5, y: 0, dir: 2},
      {x: 0, y: 1, dir: 1},
      {x: 3, y: 1, dir: 2},
      {x: 6, y: 1, dir: 3},
      {x: 1, y: 2, dir: 0},
      {x: 4, y: 2, dir: 1},
      {x: 7, y: 2, dir: 2},
      {x: 2, y: 3, dir: 3},
      {x: 5, y: 3, dir: 0},
      {x: 0, y: 4, dir: 1},
      {x: 3, y: 4, dir: 2},
      {x: 6, y: 4, dir: 3},
      {x: 1, y: 5, dir: 0},
      {x: 4, y: 5, dir: 1},
      {x: 7, y: 5, dir: 2},
      {x: 2, y: 6, dir: 3},
      {x: 5, y: 6, dir: 0},
      {x: 0, y: 7, dir: 1},
      {x: 3, y: 7, dir: 0},
      {x: 6, y: 7, dir: 3},
    ]
  }
];

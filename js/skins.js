// ============================================
// Стили стрелок — кардинально разные формы
// ============================================

window.ARROW_SKINS = [
  {
    id: 'neon',
    name: 'Неон',
    icon: '💠',
    desc: 'Классика со свечением'
  },
  {
    id: 'pointer',
    name: 'Указатель',
    icon: '📍',
    desc: 'Как метка на карте'
  },
  {
    id: 'windows',
    name: 'Windows',
    icon: '🖱️',
    desc: 'Курсор мыши'
  },
  {
    id: 'game',
    name: 'Игровая',
    icon: '🎮',
    desc: 'Как в меню игр'
  },
  {
    id: 'pixel',
    name: 'Пиксель',
    icon: '👾',
    desc: 'Ретро 8-bit'
  },
  {
    id: 'chevron',
    name: 'Шеврон',
    icon: '》',
    desc: 'Дорожный указатель'
  }
];

window.getSelectedSkin = function () {
  const id = (window.gameProgress && window.gameProgress.skin) || 'neon';
  return window.ARROW_SKINS.find(s => s.id === id) || window.ARROW_SKINS[0];
};

window.setSelectedSkin = function (id) {
  if (!window.gameProgress) window.gameProgress = {};
  window.gameProgress.skin = id;
  if (window.persistProgress) window.persistProgress();
};

window.drawArrowSkin = function (g, dir, color, cellSize, skinId) {
  g.clear();
  const id = skinId || (window.getSelectedSkin() && window.getSelectedSkin().id) || 'neon';
  const s = cellSize * 0.34;

  if (id === 'pointer') drawPointer(g, dir, color, s);
  else if (id === 'windows') drawWindows(g, dir, color, s);
  else if (id === 'game') drawGame(g, dir, color, s);
  else if (id === 'pixel') drawPixel(g, dir, color, s);
  else if (id === 'chevron') drawChevron(g, dir, color, s);
  else drawNeon(g, dir, color, s);
};

// ---------- helpers ----------
function rotPoint(x, y, dir) {
  // base shape is drawn pointing RIGHT (dir=1)
  if (dir === 1) return [x, y];
  if (dir === 2) return [y, -x];   // 90 CW → down
  if (dir === 3) return [-x, -y];  // 180
  return [-y, x];                  // 270 CW → up (dir 0)
}

function fillPoly(g, pts) {
  if (pts.length < 3) return;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

function shapePoints(base, dir) {
  return base.map(p => rotPoint(p[0], p[1], dir));
}

// ---------- НЕОН: классическая стрелка со свечением ----------
function shapeClassic(g, dir, s) {
  if (dir === 0) {
    g.fillRoundedRect(-s * 0.2, -s * 0.1, s * 0.4, s * 0.8, 4);
    g.fillTriangle(0, -s * 1.0, -s * 0.55, -s * 0.1, s * 0.55, -s * 0.1);
  } else if (dir === 1) {
    g.fillRoundedRect(-s * 0.66, -s * 0.2, s * 0.8, s * 0.4, 4);
    g.fillTriangle(s * 1.0, 0, s * 0.1, -s * 0.55, s * 0.1, s * 0.55);
  } else if (dir === 2) {
    g.fillRoundedRect(-s * 0.2, -s * 0.7, s * 0.4, s * 0.8, 4);
    g.fillTriangle(0, s * 1.0, -s * 0.55, s * 0.1, s * 0.55, s * 0.1);
  } else {
    g.fillRoundedRect(-s * 0.14, -s * 0.2, s * 0.8, s * 0.4, 4);
    g.fillTriangle(-s * 1.0, 0, -s * 0.1, -s * 0.55, -s * 0.1, s * 0.55);
  }
}

function drawNeon(g, dir, color, s) {
  g.fillStyle(color, 0.18);
  shapeClassic(g, dir, s * 1.38);
  g.fillStyle(color, 1);
  shapeClassic(g, dir, s);
  g.fillStyle(0xffffff, 0.28);
  shapeClassic(g, dir, s * 0.42);
}

// ---------- УКАЗАТЕЛЬ: капля / метка на карте ----------
function drawPointer(g, dir, color, s) {
  // pin shape pointing in dir (tip is the pointy end)
  // base drawn pointing UP, then rotate via points
  const tip = s * 1.05;
  const wide = s * 0.55;
  const base = [
    [0, -tip],
    [wide, -s * 0.15],
    [wide * 0.45, -s * 0.15],
    [wide * 0.45, s * 0.7],
    [-wide * 0.45, s * 0.7],
    [-wide * 0.45, -s * 0.15],
    [-wide, -s * 0.15]
  ];
  // base is up (dir 0); remap for other dirs using rotPoint relative to up
  function toDir(x, y, d) {
    if (d === 0) return [x, y];
    if (d === 1) return [-y, x];
    if (d === 2) return [-x, -y];
    return [y, -x];
  }
  const pts = base.map(p => toDir(p[0], p[1], dir));

  g.fillStyle(0x000000, 0.35);
  fillPoly(g, pts.map(p => [p[0] + 2, p[1] + 2]));
  g.fillStyle(color, 1);
  fillPoly(g, pts);
  // highlight
  g.fillStyle(0xffffff, 0.35);
  const hi = [
    toDir(0, -tip * 0.55, dir),
    toDir(wide * 0.28, -s * 0.05, dir),
    toDir(-wide * 0.28, -s * 0.05, dir)
  ];
  fillPoly(g, hi);
}

// ---------- WINDOWS: классический курсор мыши ----------
function drawWindows(g, dir, color, s) {
  // Famous Windows mouse cursor: tall thin triangle with notch
  // Base drawn pointing UP-RIGHT-ish, mapped to dir
  // Simplified: white fill + black outline, classic arrow cursor shape
  const base = [
    [0, -s * 1.1],
    [s * 0.7, s * 0.15],
    [s * 0.28, s * 0.15],
    [s * 0.55, s * 0.85],
    [s * 0.28, s * 0.95],
    [0, s * 0.35],
    [-s * 0.15, s * 0.55],
    [-s * 0.35, s * 0.4]
  ];
  function toDir(x, y, d) {
    if (d === 0) return [x, y];
    if (d === 1) return [-y, x];
    if (d === 2) return [-x, -y];
    return [y, -x];
  }
  const pts = base.map(p => toDir(p[0], p[1], dir));

  // black outline (slightly larger)
  g.fillStyle(0x111118, 1);
  const outline = base.map(p => toDir(p[0] * 1.12, p[1] * 1.12, dir));
  fillPoly(g, outline);

  // main fill
  g.fillStyle(color, 1);
  fillPoly(g, pts);

  // white highlight on top edge
  g.fillStyle(0xffffff, 0.45);
  const hi = [
    toDir(0, -s * 0.95, dir),
    toDir(s * 0.35, -s * 0.15, dir),
    toDir(0, -s * 0.2, dir)
  ];
  fillPoly(g, hi);
}

// ---------- ИГРОВАЯ: толстая UI-стрелка как в меню ----------
function drawGame(g, dir, color, s) {
  // Chunky rounded arrow used in game menus / platformers
  const bodyW = s * 0.55;
  const bodyH = s * 0.42;
  const head = s * 0.95;

  function toDir(x, y, d) {
    if (d === 0) return [x, y];
    if (d === 1) return [-y, x];
    if (d === 2) return [-x, -y];
    return [y, -x];
  }

  // shadow
  g.fillStyle(0x000000, 0.4);
  const shadowPts = [
    toDir(0, -head + 3, dir),
    toDir(bodyW * 1.15, -s * 0.05 + 3, dir),
    toDir(bodyW * 0.5, -s * 0.05 + 3, dir),
    toDir(bodyW * 0.5, bodyH + 3, dir),
    toDir(-bodyW * 0.5, bodyH + 3, dir),
    toDir(-bodyW * 0.5, -s * 0.05 + 3, dir),
    toDir(-bodyW * 1.15, -s * 0.05 + 3, dir)
  ];
  fillPoly(g, shadowPts);

  // body
  g.fillStyle(color, 1);
  const pts = [
    toDir(0, -head, dir),
    toDir(bodyW * 1.15, -s * 0.05, dir),
    toDir(bodyW * 0.5, -s * 0.05, dir),
    toDir(bodyW * 0.5, bodyH, dir),
    toDir(-bodyW * 0.5, bodyH, dir),
    toDir(-bodyW * 0.5, -s * 0.05, dir),
    toDir(-bodyW * 1.15, -s * 0.05, dir)
  ];
  fillPoly(g, pts);

  // inner light
  g.fillStyle(0xffffff, 0.3);
  const inner = [
    toDir(0, -head * 0.7, dir),
    toDir(bodyW * 0.55, -s * 0.12, dir),
    toDir(-bodyW * 0.55, -s * 0.12, dir)
  ];
  fillPoly(g, inner);

  // border line suggestion
  g.lineStyle(2, 0xffffff, 0.2);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.strokePath();
}

// ---------- ПИКСЕЛЬ: жёсткий 8-bit ----------
function drawPixel(g, dir, color, s) {
  const u = Math.max(3, Math.floor(s * 0.2));
  g.fillStyle(color, 1);

  function px(x, y, w, h) {
    g.fillRect(x * u, y * u, w * u, h * u);
  }

  // shadow
  g.fillStyle(0x000000, 0.4);
  if (dir === 0) { px(-1, 2, 2, 4); px(-2, 1, 4, 1); px(-3, 0, 6, 1); px(-1, -1, 2, 1); }
  else if (dir === 1) { px(-5, -1, 4, 2); px(-1, -2, 1, 4); px(0, -3, 1, 6); px(1, -1, 1, 2); }
  else if (dir === 2) { px(-1, -6, 2, 4); px(-2, -2, 4, 1); px(-3, -1, 6, 1); px(-1, 0, 2, 1); }
  else { px(1, -1, 4, 2); px(0, -2, 1, 4); px(-1, -3, 1, 6); px(-2, -1, 1, 2); }

  g.fillStyle(color, 1);
  if (dir === 0) {
    px(-1, 1, 2, 4);
    px(-2, 0, 4, 1);
    px(-3, -1, 6, 1);
    px(-1, -2, 2, 1);
  } else if (dir === 1) {
    px(-4, -1, 4, 2);
    px(0, -2, 1, 4);
    px(1, -3, 1, 6);
    px(2, -1, 1, 2);
  } else if (dir === 2) {
    px(-1, -5, 2, 4);
    px(-2, -1, 4, 1);
    px(-3, 0, 6, 1);
    px(-1, 1, 2, 1);
  } else {
    px(0, -1, 4, 2);
    px(-1, -2, 1, 4);
    px(-2, -3, 1, 6);
    px(-3, -1, 1, 2);
  }

  // highlight pixel
  g.fillStyle(0xffffff, 0.5);
  if (dir === 0) px(-1, -1, 1, 1);
  else if (dir === 1) px(1, -1, 1, 1);
  else if (dir === 2) px(0, 0, 1, 1);
  else px(-2, -1, 1, 1);
}

// ---------- ШЕВРОН: дорожный указатель / >> ----------
function drawChevron(g, dir, color, s) {
  function toDir(x, y, d) {
    if (d === 0) return [x, y];
    if (d === 1) return [-y, x];
    if (d === 2) return [-x, -y];
    return [y, -x];
  }

  // double chevron pointing up by default
  function chevron(offsetY) {
    const t = s * 0.85;
    const w = s * 0.7;
    const thick = s * 0.28;
    return [
      toDir(0, -t + offsetY, dir),
      toDir(w, thick + offsetY, dir),
      toDir(w * 0.55, thick + s * 0.22 + offsetY, dir),
      toDir(0, -t + thick * 1.6 + offsetY, dir),
      toDir(-w * 0.55, thick + s * 0.22 + offsetY, dir),
      toDir(-w, thick + offsetY, dir)
    ];
  }

  // back chevron (darker)
  g.fillStyle(color, 0.4);
  fillPoly(g, chevron(s * 0.35));

  // front chevron
  g.fillStyle(color, 1);
  fillPoly(g, chevron(-s * 0.1));

  // white edge
  g.fillStyle(0xffffff, 0.35);
  const tip = [
    toDir(0, -s * 0.95, dir),
    toDir(s * 0.28, -s * 0.45, dir),
    toDir(-s * 0.28, -s * 0.45, dir)
  ];
  fillPoly(g, tip);
}

// ============================================
// Стили стрелок — формы + разблокировка
// ============================================

window.ARROW_SKINS = [
  {
    id: 'neon',
    name: 'Классика',
    icon: '➤',
    desc: 'Стандартная · бесплатно',
    free: true
  },
  {
    id: 'block',
    name: 'Блок',
    icon: '➡',
    desc: 'Толстая игровая · реклама'
  },
  {
    id: 'triangle',
    name: 'Треугольник',
    icon: '▶',
    desc: 'Чистый указатель · реклама'
  },
  {
    id: 'chevron',
    name: 'Шеврон',
    icon: '»',
    desc: 'Двойной шеврон · реклама'
  },
  {
    id: 'thin',
    name: 'Тонкая',
    icon: '→',
    desc: 'Длинный хвост · реклама'
  },
  {
    id: 'feather',
    name: 'Оперение',
    icon: '➳',
    desc: 'Как стрела из лука · реклама'
  }
];

window.isSkinUnlocked = function (id) {
  if (!id || id === 'neon') return true;
  const skin = (window.ARROW_SKINS || []).find(s => s.id === id);
  if (skin && skin.free) return true;
  const map = (window.gameProgress && window.gameProgress.unlockedSkins) || {};
  return !!map[id];
};

window.unlockSkin = function (id) {
  if (!id || id === 'neon') return;
  if (!window.gameProgress) window.gameProgress = {};
  if (!window.gameProgress.unlockedSkins) window.gameProgress.unlockedSkins = {};
  window.gameProgress.unlockedSkins[id] = true;
  if (window.persistProgress) window.persistProgress();
};

window.getSelectedSkin = function () {
  let id = (window.gameProgress && window.gameProgress.skin) || 'neon';
  if (!window.isSkinUnlocked(id)) id = 'neon';
  const found = window.ARROW_SKINS.find(s => s.id === id);
  return found || window.ARROW_SKINS[0];
};

window.setSelectedSkin = function (id) {
  if (!window.isSkinUnlocked(id)) return false;
  if (!window.gameProgress) window.gameProgress = {};
  window.gameProgress.skin = id;
  if (window.persistProgress) window.persistProgress();
  return true;
};

window.drawArrowSkin = function (g, dir, color, cellSize, skinId) {
  g.clear();
  const id = skinId || (window.getSelectedSkin() && window.getSelectedSkin().id) || 'neon';
  const s = cellSize * 0.36;

  if (id === 'block') drawBlock(g, dir, color, s);
  else if (id === 'triangle') drawTriangle(g, dir, color, s);
  else if (id === 'chevron') drawChevron(g, dir, color, s);
  else if (id === 'thin') drawThin(g, dir, color, s);
  else if (id === 'feather') drawFeather(g, dir, color, s);
  else drawClassic(g, dir, color, s);
};

function toDir(x, y, dir) {
  if (dir === 1) return [x, y];
  if (dir === 2) return [-y, x];
  if (dir === 3) return [-x, -y];
  return [y, -x];
}

function fillPoly(g, pts) {
  if (!pts || pts.length < 3) return;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

function poly(base, dir) {
  return base.map(p => toDir(p[0], p[1], dir));
}

function drawClassic(g, dir, color, s) {
  const head = s * 0.95;
  const shaftW = s * 0.28;
  const shaftL = s * 0.7;
  const body = [
    [head, 0],
    [s * 0.15, -s * 0.55],
    [s * 0.15, -shaftW],
    [-shaftL, -shaftW],
    [-shaftL, shaftW],
    [s * 0.15, shaftW],
    [s * 0.15, s * 0.55]
  ];
  g.fillStyle(color, 0.2);
  fillPoly(g, poly(body.map(p => [p[0] * 1.2, p[1] * 1.2]), dir));
  g.fillStyle(color, 1);
  fillPoly(g, poly(body, dir));
  g.fillStyle(0xffffff, 0.28);
  fillPoly(g, poly([[head * 0.7, 0], [s * 0.2, -s * 0.25], [s * 0.2, s * 0.25]], dir));
}

function drawBlock(g, dir, color, s) {
  const head = s * 1.0;
  const hw = s * 0.7;
  const sw = s * 0.4;
  const sl = s * 0.55;
  const body = [
    [head, 0], [s * 0.05, -hw], [s * 0.05, -sw], [-sl, -sw],
    [-sl, sw], [s * 0.05, sw], [s * 0.05, hw]
  ];
  g.fillStyle(0x000000, 0.35);
  fillPoly(g, poly(body.map(p => [p[0] + 2, p[1] + 2]), dir));
  g.fillStyle(color, 1);
  fillPoly(g, poly(body, dir));
  g.fillStyle(0xffffff, 0.25);
  fillPoly(g, poly([[head * 0.55, 0], [s * 0.12, -s * 0.35], [s * 0.12, s * 0.35]], dir));
}

function drawTriangle(g, dir, color, s) {
  const body = [[s * 1.0, 0], [-s * 0.7, -s * 0.75], [-s * 0.7, s * 0.75]];
  g.fillStyle(0x000000, 0.3);
  fillPoly(g, poly(body.map(p => [p[0] + 2, p[1] + 2]), dir));
  g.fillStyle(color, 1);
  fillPoly(g, poly(body, dir));
  g.fillStyle(0xffffff, 0.3);
  fillPoly(g, poly([[s * 0.5, 0], [-s * 0.35, -s * 0.35], [-s * 0.35, s * 0.35]], dir));
}

function drawChevron(g, dir, color, s) {
  function oneChevron(ox) {
    const t = s * 0.75;
    const w = s * 0.55;
    const th = s * 0.28;
    return [
      [ox + t, 0], [ox - s * 0.15, -w], [ox - s * 0.15 - th, -w],
      [ox + t - th * 1.3, 0], [ox - s * 0.15 - th, w], [ox - s * 0.15, w]
    ];
  }
  g.fillStyle(color, 0.45);
  fillPoly(g, poly(oneChevron(-s * 0.35), dir));
  g.fillStyle(color, 1);
  fillPoly(g, poly(oneChevron(s * 0.25), dir));
  g.fillStyle(0xffffff, 0.3);
  fillPoly(g, poly([[s * 0.85, 0], [s * 0.35, -s * 0.3], [s * 0.35, s * 0.3]], dir));
}

function drawThin(g, dir, color, s) {
  const head = s * 0.85;
  const hw = s * 0.42;
  const sw = s * 0.12;
  const sl = s * 1.05;
  const body = [
    [head, 0], [-s * 0.05, -hw], [-s * 0.05, -sw], [-sl, -sw],
    [-sl, sw], [-s * 0.05, sw], [-s * 0.05, hw]
  ];
  g.fillStyle(color, 1);
  fillPoly(g, poly(body, dir));
  g.fillStyle(color, 0.85);
  fillPoly(g, poly([[s * 0.15, -sw], [-s * 0.25, -s * 0.38], [-s * 0.05, -sw]], dir));
  fillPoly(g, poly([[s * 0.15, sw], [-s * 0.25, s * 0.38], [-s * 0.05, sw]], dir));
  g.fillStyle(0xffffff, 0.35);
  fillPoly(g, poly([[head * 0.6, 0], [s * 0.05, -s * 0.18], [s * 0.05, s * 0.18]], dir));
}

function drawFeather(g, dir, color, s) {
  const tip = [[s * 1.05, 0], [s * 0.25, -s * 0.38], [s * 0.25, s * 0.38]];
  const sw = s * 0.1;
  const shaft = [[s * 0.25, -sw], [-s * 0.55, -sw], [-s * 0.55, sw], [s * 0.25, sw]];
  const f1 = [[-s * 0.35, -sw], [-s * 0.95, -s * 0.45], [-s * 0.7, -sw]];
  const f2 = [[-s * 0.35, sw], [-s * 0.95, s * 0.45], [-s * 0.7, sw]];
  const f3 = [[-s * 0.55, -sw], [-s * 1.1, -s * 0.28], [-s * 0.85, -sw]];
  const f4 = [[-s * 0.55, sw], [-s * 1.1, s * 0.28], [-s * 0.85, sw]];
  g.fillStyle(color, 1);
  fillPoly(g, poly(tip, dir));
  fillPoly(g, poly(shaft, dir));
  g.fillStyle(color, 0.85);
  fillPoly(g, poly(f1, dir));
  fillPoly(g, poly(f2, dir));
  g.fillStyle(color, 0.65);
  fillPoly(g, poly(f3, dir));
  fillPoly(g, poly(f4, dir));
  g.fillStyle(0xffffff, 0.35);
  fillPoly(g, poly([[s * 0.85, 0], [s * 0.35, -s * 0.15], [s * 0.35, s * 0.15]], dir));
}

// ============================================
// Arrow skins
// ============================================

window.ARROW_SKINS = [
  {
    id: 'neon',
    name: 'Неон',
    icon: '💠',
    desc: 'Яркое свечение'
  },
  {
    id: 'minimal',
    name: 'Минимализм',
    icon: '◻️',
    desc: 'Чистые линии'
  },
  {
    id: 'pixel',
    name: 'Pixel',
    icon: '👾',
    desc: 'Ретро-пиксели'
  },
  {
    id: 'ice',
    name: 'Лёд',
    icon: '❄️',
    desc: 'Ледяной кристалл'
  },
  {
    id: 'gold',
    name: 'Золото',
    icon: '✨',
    desc: 'Премиум-металл'
  },
  {
    id: 'comic',
    name: 'Comic',
    icon: '💥',
    desc: 'Жирный контур'
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

/**
 * Рисует стрелку выбранным скином в graphics g
 * dir: 0 up, 1 right, 2 down, 3 left
 * color: number 0xRRGGBB (базовый цвет уровня)
 * cellSize: размер клетки
 */
window.drawArrowSkin = function (g, dir, color, cellSize, skinId) {
  g.clear();
  const id = skinId || (window.getSelectedSkin() && window.getSelectedSkin().id) || 'neon';
  const s = cellSize * 0.33;

  if (id === 'minimal') {
    drawMinimal(g, dir, color, s);
  } else if (id === 'pixel') {
    drawPixel(g, dir, color, s);
  } else if (id === 'ice') {
    drawIce(g, dir, color, s);
  } else if (id === 'gold') {
    drawGold(g, dir, color, s);
  } else if (id === 'comic') {
    drawComic(g, dir, color, s);
  } else {
    drawNeon(g, dir, color, s);
  }
};

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
  g.fillStyle(color, 0.16);
  shapeClassic(g, dir, s * 1.35);
  g.fillStyle(color, 1);
  shapeClassic(g, dir, s);
  g.fillStyle(0xffffff, 0.22);
  shapeClassic(g, dir, s * 0.45);
}

function drawMinimal(g, dir, color, s) {
  g.fillStyle(color, 1);
  if (dir === 0) {
    g.fillTriangle(0, -s * 0.95, -s * 0.5, s * 0.15, s * 0.5, s * 0.15);
    g.fillRect(-s * 0.14, -s * 0.05, s * 0.28, s * 0.75);
  } else if (dir === 1) {
    g.fillTriangle(s * 0.95, 0, -s * 0.15, -s * 0.5, -s * 0.15, s * 0.5);
    g.fillRect(-s * 0.7, -s * 0.14, s * 0.75, s * 0.28);
  } else if (dir === 2) {
    g.fillTriangle(0, s * 0.95, -s * 0.5, -s * 0.15, s * 0.5, -s * 0.15);
    g.fillRect(-s * 0.14, -s * 0.7, s * 0.28, s * 0.75);
  } else {
    g.fillTriangle(-s * 0.95, 0, s * 0.15, -s * 0.5, s * 0.15, s * 0.5);
    g.fillRect(-s * 0.05, -s * 0.14, s * 0.75, s * 0.28);
  }
}

function drawPixel(g, dir, color, s) {
  const u = Math.max(3, Math.floor(s * 0.22));
  g.fillStyle(color, 1);

  function px(x, y, w, h) {
    g.fillRect(x * u, y * u, w * u, h * u);
  }

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

  // pixel outline
  g.fillStyle(0x000000, 0.35);
  if (dir === 0) {
    px(-1, 5, 2, 1);
  } else if (dir === 1) {
    px(-5, -1, 1, 2);
  } else if (dir === 2) {
    px(-1, -6, 2, 1);
  } else {
    px(4, -1, 1, 2);
  }
}

function drawIce(g, dir, color, s) {
  // холодный оттенок поверх цвета
  const ice = 0x7ec8ff;
  g.fillStyle(ice, 0.25);
  shapeClassic(g, dir, s * 1.3);
  g.fillStyle(color, 0.85);
  shapeClassic(g, dir, s);
  g.fillStyle(0xffffff, 0.45);
  shapeClassic(g, dir, s * 0.4);

  // блик
  g.fillStyle(0xffffff, 0.55);
  if (dir === 0) g.fillCircle(-s * 0.12, -s * 0.35, s * 0.12);
  else if (dir === 1) g.fillCircle(s * 0.35, -s * 0.12, s * 0.12);
  else if (dir === 2) g.fillCircle(s * 0.12, s * 0.35, s * 0.12);
  else g.fillCircle(-s * 0.35, s * 0.12, s * 0.12);
}

function drawGold(g, dir, color, s) {
  const gold = 0xffd166;
  g.fillStyle(0x8a5a00, 0.5);
  shapeClassic(g, dir, s * 1.15);
  g.fillStyle(gold, 1);
  shapeClassic(g, dir, s);
  g.fillStyle(0xfff3c4, 0.55);
  shapeClassic(g, dir, s * 0.42);
  g.fillStyle(0xffffff, 0.35);
  if (dir === 0) g.fillCircle(-s * 0.1, -s * 0.4, s * 0.1);
  else if (dir === 1) g.fillCircle(s * 0.4, -s * 0.1, s * 0.1);
  else if (dir === 2) g.fillCircle(s * 0.1, s * 0.4, s * 0.1);
  else g.fillCircle(-s * 0.4, s * 0.1, s * 0.1);
}

function drawComic(g, dir, color, s) {
  // толстая обводка
  g.fillStyle(0x111118, 1);
  shapeClassic(g, dir, s * 1.22);
  g.fillStyle(color, 1);
  shapeClassic(g, dir, s);
  g.fillStyle(0xffffff, 0.3);
  shapeClassic(g, dir, s * 0.38);
}

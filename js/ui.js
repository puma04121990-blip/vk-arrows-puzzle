// ============================================
// Shared UI polish: background, icons, buttons
// ============================================

/**
 * Soft layered background (not flat #0b0b14).
 */
window.drawAppBackground = function (scene, width, height, opts) {
  opts = opts || {};
  const accent = opts.accent != null ? opts.accent : 0x00e8c8;

  // Base fill
  scene.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0).setDepth(-20);

  const g = scene.add.graphics().setDepth(-19);

  // Top vignette glow
  g.fillStyle(accent, 0.04);
  g.fillCircle(width * 0.5, height * 0.12, Math.max(width, height) * 0.35);
  g.fillStyle(0x4cc9f0, 0.03);
  g.fillCircle(width * 0.15, height * 0.75, Math.max(width, height) * 0.28);
  g.fillStyle(0x9b5de5, 0.025);
  g.fillCircle(width * 0.88, height * 0.55, Math.max(width, height) * 0.22);

  // Subtle radial dark edges
  const edge = scene.add.graphics().setDepth(-18);
  edge.fillStyle(0x000000, 0.22);
  edge.fillRect(0, 0, width, Math.max(24, height * 0.04));
  edge.fillRect(0, height - Math.max(24, height * 0.05), width, Math.max(24, height * 0.05));

  // Dot grid texture
  const dots = scene.add.graphics().setDepth(-17);
  dots.fillStyle(0xffffff, 0.03);
  const step = opts.dotStep || 28;
  for (let y = step; y < height; y += step) {
    for (let x = step; x < width; x += step) {
      dots.fillCircle(x, y, 1.2);
    }
  }

  return g;
};

/**
 * Brick / block wall cell.
 */
window.drawWallIcon = function (g, x, y, s) {
  const r = Math.max(4, s * 0.14);
  // Shadow
  g.fillStyle(0x000000, 0.4);
  g.fillRoundedRect(x + 2, y + 3, s, s, r);

  // Body
  g.fillStyle(0x3d3d58, 1);
  g.fillRoundedRect(x, y, s, s, r);

  // Top highlight strip
  g.fillStyle(0x5a5a7a, 1);
  g.fillRoundedRect(x + 2, y + 2, s - 4, Math.max(4, s * 0.22), r * 0.6);

  // Brick lines
  g.lineStyle(1.5, 0x2a2a40, 1);
  const midY = y + s * 0.5;
  g.lineBetween(x + 3, midY, x + s - 3, midY);
  g.lineBetween(x + s * 0.5, y + 3, x + s * 0.5, midY);
  g.lineBetween(x + s * 0.33, midY, x + s * 0.33, y + s - 3);
  g.lineBetween(x + s * 0.66, midY, x + s * 0.66, y + s - 3);

  // Border
  g.lineStyle(2, 0x8a8ab0, 0.95);
  g.strokeRoundedRect(x, y, s, s, r);

  // Small rivets
  g.fillStyle(0x9a9ab8, 0.7);
  const d = Math.max(2, s * 0.07);
  g.fillCircle(x + s * 0.22, y + s * 0.28, d);
  g.fillCircle(x + s * 0.78, y + s * 0.28, d);
  g.fillCircle(x + s * 0.22, y + s * 0.72, d);
  g.fillCircle(x + s * 0.78, y + s * 0.72, d);
};

/**
 * Key badge (drawn at 0,0 local).
 */
window.drawKeyIcon = function (g, color, size) {
  const s = size || 14;
  const c = color != null ? color : 0xffd166;
  // Plate
  g.fillStyle(0x0b0b14, 0.7);
  g.fillCircle(0, 0, s * 0.9);
  g.lineStyle(1, c, 0.5);
  g.strokeCircle(0, 0, s * 0.9);
  // Ring
  g.lineStyle(Math.max(2, s * 0.22), c, 1);
  g.strokeCircle(-s * 0.25, 0, s * 0.38);
  // Shaft
  g.lineStyle(Math.max(2, s * 0.2), c, 1);
  g.lineBetween(s * 0.05, 0, s * 0.55, 0);
  // Teeth
  g.lineBetween(s * 0.35, 0, s * 0.35, s * 0.28);
  g.lineBetween(s * 0.52, 0, s * 0.52, s * 0.2);
  // Glow core
  g.fillStyle(c, 0.4);
  g.fillCircle(-s * 0.25, 0, s * 0.16);
};

/**
 * Lock badge (drawn at 0,0 local).
 */
window.drawLockIcon = function (g, color, size) {
  const s = size || 14;
  const c = color != null ? color : 0xff6b6b;
  g.fillStyle(0x0b0b14, 0.7);
  g.fillCircle(0, 0, s * 0.9);
  g.lineStyle(1, c, 0.5);
  g.strokeCircle(0, 0, s * 0.9);
  // Shackle
  g.lineStyle(Math.max(2, s * 0.2), c, 1);
  g.beginPath();
  g.arc(0, -s * 0.12, s * 0.32, Math.PI, 0, false);
  g.strokePath();
  // Body
  g.fillStyle(c, 1);
  g.fillRoundedRect(-s * 0.4, -s * 0.05, s * 0.8, s * 0.7, s * 0.12);
  // Keyhole
  g.fillStyle(0x0b0b14, 1);
  g.fillCircle(0, s * 0.18, s * 0.12);
  g.fillRect(-s * 0.06, s * 0.18, s * 0.12, s * 0.28);
};

/**
 * Rotate badge.
 */
window.drawRotateIcon = function (g, color, size) {
  const s = size || 14;
  const c = color != null ? color : 0xffe066;
  g.fillStyle(0x0b0b14, 0.7);
  g.fillCircle(0, 0, s * 0.9);
  g.lineStyle(1, c, 0.5);
  g.strokeCircle(0, 0, s * 0.9);
  g.lineStyle(Math.max(2, s * 0.22), c, 1);
  g.beginPath();
  g.arc(0, 0, s * 0.42, 0.2, Math.PI * 1.5, false);
  g.strokePath();
  // Arrow head
  g.fillStyle(c, 1);
  g.fillTriangle(s * 0.1, -s * 0.55, s * 0.42, -s * 0.28, s * 0.05, -s * 0.18);
};

/**
 * Polished pill button.
 * opts: { w, h, color, secondary, depth, fontSize }
 */
window.createNiceButton = function (scene, x, y, label, callback, opts) {
  opts = opts || {};
  const bw = opts.w || 280;
  const bh = opts.h || 48;
  const color = opts.color != null ? opts.color : 0x00e8c8;
  const secondary = !!opts.secondary;
  const depth = opts.depth != null ? opts.depth : 20;
  const fontSize = opts.fontSize || (secondary ? '16px' : '20px');

  const btn = scene.add.container(x, y);
  btn.setDepth(depth);

  // Soft outer glow (primary only)
  if (!secondary) {
    const glow = scene.add.graphics();
    glow.fillStyle(color, 0.18);
    glow.fillRoundedRect(-bw / 2 - 4, -bh / 2 - 3, bw + 8, bh + 6, (bh + 6) / 2);
    btn.add(glow);
  }

  const bg = scene.add.graphics();
  const drawBg = (fill, stroke) => {
    bg.clear();
    // bottom edge shadow
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-bw / 2, -bh / 2 + 3, bw, bh, bh / 2);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    bg.lineStyle(2, stroke, secondary ? 1 : 0.55);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    // top sheen
    bg.fillStyle(0xffffff, secondary ? 0.04 : 0.12);
    bg.fillRoundedRect(-bw / 2 + 4, -bh / 2 + 3, bw - 8, Math.max(6, bh * 0.35), bh / 3);
  };

  const fill = secondary ? (color === 0x1a1a28 ? 0x1a1a28 : 0x1e1e32) : color;
  const stroke = secondary ? 0x3a3a58 : 0xffffff;
  drawBg(fill, stroke);

  const textColor = secondary || color === 0x1a1a28 || color === 0x222238 || color === 0x2a2a45
    ? '#d0d0e8'
    : '#0b0b14';

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Arial Black, Arial',
    fontSize: fontSize,
    color: textColor
  }).setOrigin(0.5);

  const maxTextW = bw - 28;
  if (text.width > maxTextW) text.setScale(maxTextW / text.width);

  btn.add([bg, text]);
  btn.setSize(bw, bh);
  btn.setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => {
    if (secondary) drawBg(0x262640, 0x4a4a6a);
    else drawBg(color, 0xffffff);
  });
  btn.on('pointerout', () => drawBg(fill, stroke));
  btn.on('pointerdown', () => {
    scene.tweens.add({
      targets: btn,
      scale: 0.94,
      duration: 70,
      yoyo: true,
      onComplete: () => { if (callback) callback(); }
    });
  });

  return btn;
};

/**
 * Compact HUD chip (for errors / timer / menu actions).
 */
window.createHudChip = function (scene, x, y, label, opts) {
  opts = opts || {};
  const padX = opts.padX || 14;
  const padY = opts.padY || 8;
  const fill = opts.fill != null ? opts.fill : 0x181828;
  const stroke = opts.stroke != null ? opts.stroke : 0x2e2e48;
  const depth = opts.depth != null ? opts.depth : 20;

  const text = scene.add.text(0, 0, label, {
    fontFamily: opts.fontFamily || 'Arial',
    fontSize: opts.fontSize || '16px',
    color: opts.color || '#8a8aa8'
  }).setOrigin(0.5);

  const bw = text.width + padX * 2;
  const bh = text.height + padY * 2;

  const container = scene.add.container(x, y);
  container.setDepth(depth);

  const bg = scene.add.graphics();
  bg.fillStyle(fill, 1);
  bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  bg.lineStyle(1, stroke, 1);
  bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);

  container.add([bg, text]);
  container.setSize(bw, bh);

  container.bg = bg;
  container.label = text;
  container.setLabel = function (str, color) {
    text.setText(str);
    if (color) text.setColor(color);
    const nw = text.width + padX * 2;
    const nh = text.height + padY * 2;
    bg.clear();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-nw / 2, -nh / 2, nw, nh, nh / 2);
    bg.lineStyle(1, stroke, 1);
    bg.strokeRoundedRect(-nw / 2, -nh / 2, nw, nh, nh / 2);
    container.setSize(nw, nh);
  };
  container.setInteractiveChip = function (cb) {
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x222238, 1);
      bg.fillRoundedRect(-container.width / 2, -container.height / 2, container.width, container.height, container.height / 2);
      bg.lineStyle(1, 0x3e3e58, 1);
      bg.strokeRoundedRect(-container.width / 2, -container.height / 2, container.width, container.height, container.height / 2);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(-container.width / 2, -container.height / 2, container.width, container.height, container.height / 2);
      bg.lineStyle(1, stroke, 1);
      bg.strokeRoundedRect(-container.width / 2, -container.height / 2, container.width, container.height, container.height / 2);
    });
    container.on('pointerup', cb);
  };

  return container;
};

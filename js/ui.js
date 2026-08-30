// ============================================
// Shared UI polish: background, icons, buttons
// ============================================

/**
 * Soft layered background (not flat #0b0b14).
 */
window.drawAppBackground = function (scene, width, height, opts) {
  opts = opts || {};
  const accent = opts.accent != null ? opts.accent : 0x00e8c8;
  scene.add.rectangle(0, 0, width, height, 0x0c0c18).setOrigin(0).setDepth(-20);
  const g = scene.add.graphics().setDepth(-19);
  g.fillStyle(accent, 0.07);
  g.fillCircle(width * 0.5, -8, Math.max(width, height) * 0.26);
  g.fillStyle(0x4cc9f0, 0.03);
  g.fillCircle(width * 0.08, height * 0.92, Math.max(width, height) * 0.18);
  return g;
};

/**
 * Brick / block wall cell.
 */
window.drawWallIcon = function (g, x, y, s) {
  const r = Math.max(4, s * 0.16);
  g.fillStyle(0x2c2c42, 1);
  g.fillRoundedRect(x, y, s, s, r);
  g.fillStyle(0x4a4a68, 1);
  g.fillRoundedRect(x + 2, y + 2, s - 4, Math.max(3, s * 0.2), r * 0.5);
  g.lineStyle(2, 0x8a8ab0, 0.9);
  g.strokeRoundedRect(x, y, s, s, r);
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
    fontFamily: 'Manrope, Arial Black, Arial, sans-serif',
    fontSize: fontSize,
    color: textColor
  }).setOrigin(0.5);

  const maxTextW = bw - 28;
  if (text.width > maxTextW) text.setScale(maxTextW / text.width);

  btn.add([bg, text]);
  btn.setSize(bw, bh);
  btn.setInteractive({ useHandCursor: true });

  let pressX = 0;
  let pressY = 0;
  btn.on('pointerover', () => {
    if (window.playUiTone) window.playUiTone(300, 0.025, 'sine', 0.018);
    if (secondary) drawBg(0x262640, 0x4a4a6a);
    else drawBg(color, 0xffffff);
  });
  btn.on('pointerout', () => drawBg(fill, stroke));
  btn.on('pointerdown', (p) => {
    pressX = p.x;
    pressY = p.y;
    if (window.ensureGameAudio) window.ensureGameAudio();
    if (scene.sys && scene.sys.isActive()) {
      scene.tweens.add({
        targets: btn,
        scale: 0.97,
        duration: 60,
        ease: 'Sine.easeOut'
      });
    }
  });
  btn.on('pointerup', (p) => {
    if (scene.sys && scene.sys.isActive()) {
      scene.tweens.add({ targets: btn, scale: 1, duration: 70, ease: 'Sine.easeOut' });
    }
    if (Math.abs(p.x - pressX) > 12 || Math.abs(p.y - pressY) > 12) return;
    if (window.playUiTone) window.playUiTone(420, 0.03, 'sine', 0.04);
    if (callback) callback();
  });
  btn.on('pointerupoutside', () => {
    if (scene.sys && scene.sys.isActive()) {
      scene.tweens.add({ targets: btn, scale: 1, duration: 70 });
    }
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

  const paintChip = (g, bw, bh) => {
    g.clear();
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(-bw / 2, -bh / 2 + 2, bw, bh, bh / 2);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    g.lineStyle(1, stroke, 1);
    g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    g.fillStyle(0xffffff, 0.06);
    g.fillRoundedRect(-bw / 2 + 3, -bh / 2 + 2, bw - 6, Math.max(5, bh * 0.38), bh / 3);
  };

  const text = scene.add.text(0, 0, label, {
    fontFamily: opts.fontFamily || 'Manrope, Arial, sans-serif',
    fontSize: opts.fontSize || '16px',
    color: opts.color || '#8a8aa8'
  }).setOrigin(0.5);

  const bw = text.width + padX * 2;
  const bh = text.height + padY * 2;

  const container = scene.add.container(x, y);
  container.setDepth(depth);

  const bg = scene.add.graphics();
  paintChip(bg, bw, bh);

  container.add([bg, text]);
  container.setSize(bw, bh);

  container.bg = bg;
  container.label = text;
  container.setLabel = function (str, color) {
    text.setText(str);
    if (color) text.setColor(color);
    const nw = text.width + padX * 2;
    const nh = text.height + padY * 2;
    paintChip(bg, nw, nh);
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

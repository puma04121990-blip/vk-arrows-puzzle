/**
 * Bake fixed levels into js/levels-data.js
 * Run: node tools/bake-levels.js
 *
 * Uses the same seeded generator as levels.js so content stays stable.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const levelsPath = path.join(root, 'js', 'levels.js');
const outPath = path.join(root, 'js', 'levels-data.js');

// Load generator without levels-data (force seed path)
const code = fs.readFileSync(levelsPath, 'utf8')
  // Strip auto-init that depends on LEVELS_DATA so we can call bakeLevelsFromSeed
  + `
    this.getSizeForLevel = getSizeForLevel;
    this.getArrowCount = getArrowCount;
    this.getWallCount = getWallCount;
    this.getLockPairs = getLockPairs;
    this.getRotateCount = getRotateCount;
    this.generateLevel = generateLevel;
    this.mulberry32 = mulberry32;
  `;

const sandbox = { window: {}, console, Math };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

function bake() {
  const out = [];
  for (let i = 0; i < 50; i++) {
    const size = sandbox.getSizeForLevel(i);
    const count = sandbox.getArrowCount(i, size);
    const wallsN = sandbox.getWallCount(i);
    const locksN = sandbox.getLockPairs(i);
    const rotN = sandbox.getRotateCount(i);
    const seed = 0xA770 + i * 7919;
    const lv = sandbox.generateLevel(size, count, wallsN, locksN, rotN, seed);
    out.push({
      i: i,
      size: lv.size,
      walls: lv.walls || [],
      arrows: (lv.arrows || []).map(a => {
        const o = { x: a.x, y: a.y, dir: a.dir };
        if (a.lockId != null) o.lockId = a.lockId;
        if (a.keyId != null) o.keyId = a.keyId;
        if (a.lockColor != null) o.lockColor = a.lockColor;
        if (a.rotates) o.rotates = true;
        return o;
      })
    });
  }
  return out;
}

const compact = bake();
const header = [
  '// AUTO-GENERATED fixed levels — identical on Android / iOS / Web (VK 2.3.8)',
  '// Do not edit by hand. Regenerate: node tools/bake-levels.js',
  ''
].join('\n');

const body = 'window.LEVELS_DATA = ' + JSON.stringify(compact) + ';\n';
fs.writeFileSync(outPath, header + body);
console.log('Wrote', outPath);
console.log('Levels:', compact.length, 'bytes:', (header + body).length);
console.log('L0 arrows:', compact[0].arrows.length, 'L49 size:', compact[49].size);

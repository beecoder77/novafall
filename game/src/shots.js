// Screenshot scenes: deterministic poses for the game's storefront pictures.
// The game reads ?shot=<name>&seed=<n> and arranges a real, playable state —
// the screenshots in screenshots/ are plain browser captures of these poses.

import { VIEW_W, VIEW_H } from './config.js';
import { makeStarfield, spawnBurst, spawnRing } from './effects.js';
import { spawnEnemy } from './enemies.js';
import { makeRandom } from './random.js';

function baseScene(G, seed) {
  G.rng = makeRandom(seed * 7919 + 13);
  G.starfield = makeStarfield(G.rng);
  G.enemies = [];
  G.bullets = [];
  G.ebullets = [];
  G.parts = [];
  G.rings = [];
  G.texts = [];
  G.pickups = [];
  G.bannerTimer = 0;
  G.time = 2.4;
}

function bullet(G, x, y, vx, vy, friendly = true) {
  G[friendly ? 'bullets' : 'ebullets'].push({ x, y, vx, vy, radius: friendly ? 4 : 5, life: 2, friendly });
}

export function poseShot(G, name, seed) {
  baseScene(G, seed);
  const p = G.player;
  if (name === 'title') {
    G.state = 'title';
    p.x = VIEW_W / 2; p.y = VIEW_H / 2 + 150; p.angle = -Math.PI / 2;
    spawnBurst(G.parts, G.rng, 300, 200, '#67e8f9', 14, 120, 1.4, 2.5);
    spawnBurst(G.parts, G.rng, 990, 160, '#f472b6', 12, 110, 1.4, 2.5);
    return;
  }
  if (name === 'play') {
    G.state = 'playing';
    G.wave = 3; G.score = 12450; G.combo = 4; G.comboT = 1.8; G.kills = 47; G.elapsed = 96;
    p.x = 430; p.y = 430; p.hull = 76; p.angle = -0.6;
    const foes = [
      ['weaver', 760, 250], ['weaver', 880, 330], ['drifter', 980, 210],
      ['drifter', 700, 130], ['splitter', 1050, 430], ['mite', 620, 210],
      ['mite', 660, 300], ['gunner', 1120, 150], ['drifter', 240, 160],
    ];
    for (const [kind, x, y] of foes) spawnEnemy(G, kind, x, y);
    for (let i = 0; i < 5; i++) bullet(G, 470 + i * 46, 400 - i * 28, 640, -390);
    bullet(G, 1080, 190, -260, 120, false);
    bullet(G, 1040, 205, -260, 120, false);
    spawnBurst(G.parts, G.rng, 905, 300, '#f472b6', 34, 320, 1.7, 3.5);
    spawnBurst(G.parts, G.rng, 905, 300, '#f8fafc', 12, 200, 1.2, 2.2);
    spawnRing(G.rings, 905, 300, '#f472b6', 80);
    G.pickups.push({ x: 560, y: 560, kind: 'repair', color: '#34d399', label: '+', radius: 13, age: 1, life: 9 });
    G.texts.push({ x: 905, y: 268, text: '+320', color: '#fbbf24', size: 20, life: 0.8, maxLife: 0.9 });
    return;
  }
  if (name === 'boss') {
    G.state = 'playing';
    G.wave = 10; G.score = 48750; G.combo = 6; G.comboT = 2.0; G.kills = 168; G.elapsed = 322;
    G.bossActive = true;
    p.x = 640; p.y = 560; p.hull = 58; p.angle = -Math.PI / 2; p.shieldTimer = 6;
    const boss = spawnEnemy(G, 'boss', 640, 175);
    boss.hull = 74;
    spawnEnemy(G, 'gunner', 300, 220);
    spawnEnemy(G, 'gunner', 980, 220);
    spawnEnemy(G, 'mite', 520, 320);
    spawnEnemy(G, 'mite', 770, 330);
    spawnEnemy(G, 'weaver', 180, 430);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.4;
      bullet(G, 640 + Math.cos(a) * 120, 175 + Math.sin(a) * 120, Math.cos(a) * 210, Math.sin(a) * 210, false);
    }
    for (let i = 0; i < 4; i++) bullet(G, 628 + (i % 2) * 24, 520 - i * 42, 0, -720);
    spawnBurst(G.parts, G.rng, 590, 150, '#f43f5e', 20, 260, 0.7, 3.5);
    return;
  }
  // 'end' — the victory results screen over a calm field.
  G.state = 'victory';
  G.wave = 10; G.score = 62400; G.kills = 214; G.elapsed = 386;
  p.x = VIEW_W / 2; p.y = VIEW_H / 2 + 170; p.angle = -Math.PI / 2;
  spawnBurst(G.parts, G.rng, 380, 220, '#34d399', 18, 150, 1.2, 3);
  spawnBurst(G.parts, G.rng, 900, 200, '#fbbf24', 18, 150, 1.2, 3);
}

// Screenshot scenes: deterministic poses for the game's storefront pictures.
// The game reads ?shot=<name>&seed=<n> and arranges a real, playable state —
// the screenshots in screenshots/ are plain browser captures of these poses.
// Poses stage the busiest honest moments of a run: a mid-wave brawl, the
// final Dreadnought with its escorts, the title, and the victory results.

import { VIEW_W, VIEW_H } from './config.js';
import { makeStarfield, spawnBurst } from './effects.js';
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
  G.newBest = false;
  G.bossesDown = 0;
  G.maxCombo = 0;
  G.coresCollected = { repair: 0, rapid: 0, shield: 0 };
}

function bullet(G, x, y, vx, vy, friendly = true) {
  G[friendly ? 'bullets' : 'ebullets'].push({ x, y, vx, vy, radius: friendly ? 4 : 5, life: 2, friendly });
}

// A shockwave ring that is still expanding when the capture lands (~0.5 s
// after the pose): the stock ring lives 0.4 s, so staged rings last longer.
function longRing(G, x, y, color, maxR) {
  G.rings.push({ x, y, r: 10, maxR, life: 3.5, maxLife: 3.5, color });
}

// Floating score text that is still bright at capture time.
function longText(G, x, y, text, color, size) {
  G.texts.push({ x, y, text, color, size, life: 3.0, maxLife: 3.0 });
}

function pickup(G, x, y, kind, color, label) {
  G.pickups.push({ x, y, kind, color, label, radius: 13, age: 1, life: 9 });
}

export function poseShot(G, name, seed) {
  baseScene(G, seed);
  const p = G.player;
  if (name === 'title') {
    G.state = 'title';
    G.best = 51200;
    p.x = VIEW_W / 2; p.y = VIEW_H / 2 + 150; p.angle = -Math.PI / 2;
    spawnBurst(G.parts, G.rng, 300, 200, '#67e8f9', 14, 120, 3.0, 2.5);
    spawnBurst(G.parts, G.rng, 990, 160, '#f472b6', 12, 110, 3.0, 2.5);
    return;
  }
  if (name === 'play') {
    // Wave 6 mid-brawl, one Dreadnought already sunk: sixteen hostiles of
    // five kinds, two bullet streams, two kills mid-explosion, cores afield.
    G.state = 'playing';
    G.wave = 6; G.score = 21400; G.best = 51200; G.combo = 5; G.comboT = 2.0;
    G.maxCombo = 7; G.kills = 83; G.elapsed = 214; G.bossesDown = 1;
    G.coresCollected = { repair: 1, rapid: 2, shield: 0 };
    p.x = 430; p.y = 470; p.hull = 82; p.angle = -0.9; p.rapidTimer = 4;
    const foes = [
      ['weaver', 760, 250], ['weaver', 900, 300], ['weaver', 620, 180],
      ['weaver', 180, 480], ['drifter', 980, 210], ['drifter', 700, 130],
      ['drifter', 1080, 420], ['drifter', 240, 560], ['splitter', 1050, 430],
      ['splitter', 300, 300], ['mite', 620, 210], ['mite', 660, 300],
      ['mite', 880, 520], ['mite', 420, 180], ['gunner', 1120, 150],
      ['gunner', 240, 160], ['gunner', 1150, 560],
    ];
    for (const [kind, x, y] of foes) spawnEnemy(G, kind, x, y);
    // Twin nose-gun streams from the player toward the pack.
    for (let i = 0; i < 8; i++) bullet(G, 470 + i * 40, 440 - i * 26, 640, -390);
    for (let i = 0; i < 5; i++) bullet(G, 452 + i * 36, 486 - i * 18, 560, -300);
    // Return fire from the gunners, aimed at the player.
    bullet(G, 1080, 190, -260, 120, false);
    bullet(G, 1040, 205, -260, 120, false);
    bullet(G, 1090, 165, -300, 170, false);
    bullet(G, 280, 190, 150, 190, false);
    bullet(G, 1120, 530, -240, -90, false);
    // A weaver and a splitter dying at once.
    spawnBurst(G.parts, G.rng, 905, 300, '#f472b6', 34, 320, 4.5, 3.5);
    spawnBurst(G.parts, G.rng, 905, 300, '#f8fafc', 12, 200, 4.0, 2.2);
    spawnBurst(G.parts, G.rng, 300, 300, '#a78bfa', 30, 300, 4.5, 3.5);
    spawnBurst(G.parts, G.rng, 300, 300, '#f8fafc', 10, 190, 4.0, 2.2);
    longRing(G, 905, 300, '#f472b6', 110);
    longRing(G, 300, 300, '#a78bfa', 90);
    longText(G, 905, 268, '+400', '#fbbf24', 20);
    longText(G, 300, 268, '+360', '#fbbf24', 20);
    longText(G, 620, 150, '+160', '#e2e8f0', 16);
    pickup(G, 560, 560, 'repair', '#34d399', '+');
    pickup(G, 1020, 520, 'rapid', '#fbbf24', '»');
    pickup(G, 350, 620, 'shield', '#67e8f9', 'O');
    return;
  }
  if (name === 'boss') {
    // Final wave: the second Dreadnought at half hull (phase 2) with sixteen
    // escorts, a bullet ring, aimed spreads, two kills exploding, and the
    // player's twin streams pouring into the boss.
    G.state = 'playing';
    G.wave = 10; G.score = 48750; G.best = 51200; G.combo = 8; G.comboT = 2.2;
    G.maxCombo = 8; G.kills = 168; G.elapsed = 322; G.bossesDown = 1;
    G.coresCollected = { repair: 2, rapid: 1, shield: 1 };
    G.bossActive = true;
    p.x = 640; p.y = 585; p.hull = 58; p.angle = -Math.PI / 2;
    p.shieldTimer = 6; p.rapidTimer = 5;
    const boss = spawnEnemy(G, 'boss', 640, 180);
    boss.hull = 74;
    const foes = [
      ['gunner', 300, 220], ['gunner', 980, 220], ['gunner', 180, 380],
      ['gunner', 1120, 560], ['weaver', 180, 430], ['weaver', 1100, 430],
      ['weaver', 420, 300], ['drifter', 860, 330], ['drifter', 240, 300],
      ['drifter', 1120, 180], ['mite', 520, 320], ['mite', 770, 330],
      ['mite', 460, 240], ['mite', 820, 250], ['splitter', 1080, 300],
      ['splitter', 200, 520], ['mite', 980, 520], ['drifter', 1120, 620],
    ];
    for (const [kind, x, y] of foes) spawnEnemy(G, kind, x, y);
    // The Dreadnought's bullet ring, plus a wider second ring.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.4;
      bullet(G, 640 + Math.cos(a) * 120, 180 + Math.sin(a) * 120, Math.cos(a) * 210, Math.sin(a) * 210, false);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.9;
      bullet(G, 640 + Math.cos(a) * 210, 180 + Math.sin(a) * 210, Math.cos(a) * 170, Math.sin(a) * 170, false);
    }
    // Aimed spreads from the flank gunners toward the player.
    bullet(G, 300, 240, 190, 260, false);
    bullet(G, 320, 235, 220, 240, false);
    bullet(G, 980, 240, -190, 260, false);
    bullet(G, 960, 235, -220, 240, false);
    // Twin streams from the player into the boss.
    for (let i = 0; i < 7; i++) bullet(G, 628, 545 - i * 42, 0, -720);
    for (let i = 0; i < 7; i++) bullet(G, 652, 545 - i * 42, 0, -720);
    // Escorts dying on both flanks, and hits sparking off the boss.
    spawnBurst(G.parts, G.rng, 420, 300, '#f472b6', 30, 300, 4.5, 3.5);
    spawnBurst(G.parts, G.rng, 420, 300, '#f8fafc', 10, 190, 4.0, 2.2);
    spawnBurst(G.parts, G.rng, 860, 330, '#fb923c', 26, 280, 4.5, 3.5);
    spawnBurst(G.parts, G.rng, 590, 150, '#f43f5e', 20, 260, 4.5, 3.5);
    spawnBurst(G.parts, G.rng, 700, 160, '#fde68a', 12, 200, 4.0, 2.5);
    longRing(G, 420, 300, '#f472b6', 100);
    longRing(G, 860, 330, '#fb923c', 90);
    longText(G, 420, 268, '+640', '#fbbf24', 20);
    longText(G, 860, 298, '+400', '#fbbf24', 20);
    longText(G, 980, 190, '+160', '#e2e8f0', 16);
    pickup(G, 520, 470, 'repair', '#34d399', '+');
    pickup(G, 780, 470, 'rapid', '#fbbf24', '»');
    pickup(G, 900, 580, 'shield', '#67e8f9', 'O');
    return;
  }
  // 'end' — the victory results screen over a calm field.
  G.state = 'victory';
  G.wave = 10; G.score = 62400; G.best = 62400; G.newBest = true;
  G.kills = 214; G.elapsed = 386; G.bossesDown = 2; G.maxCombo = 8;
  G.coresCollected = { repair: 3, rapid: 2, shield: 2 };
  p.x = VIEW_W / 2; p.y = VIEW_H / 2 + 170; p.angle = -Math.PI / 2;
  spawnBurst(G.parts, G.rng, 380, 220, '#34d399', 18, 150, 3.0, 3);
  spawnBurst(G.parts, G.rng, 900, 200, '#fbbf24', 18, 150, 3.0, 3);
}

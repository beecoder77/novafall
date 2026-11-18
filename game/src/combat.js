// Combat resolution: bullet flight, circle collisions, kill scoring with the
// combo multiplier, splitter spawns, and the three pickup types.

import { VIEW_W, VIEW_H, COMBO_MAX } from './config.js';
import { spawnBurst, spawnRing, spawnText } from './effects.js';
import { spawnEnemy, spawnAtEdge } from './enemies.js';
import { damagePlayer } from './player.js';
import { randRange } from './random.js';
import { comboWindow } from './upgrades.js';

const PICKUP_KINDS = [
  { kind: 'repair', color: '#34d399', label: '+' },
  { kind: 'rapid', color: '#fbbf24', label: '»' },
  { kind: 'shield', color: '#67e8f9', label: 'O' },
];

export function maybeDropPickup(G, x, y) {
  if (G.rng() > 0.16) return;
  const def = PICKUP_KINDS[Math.floor(G.rng() * PICKUP_KINDS.length)];
  G.pickups.push({ x, y, kind: def.kind, color: def.color, label: def.label, radius: 13, age: 0, life: 11 });
}

export function killEnemy(G, e) {
  const idx = G.enemies.indexOf(e);
  if (idx === -1) return;
  G.enemies.splice(idx, 1);
  G.combo = Math.min(COMBO_MAX, G.combo + (G.comboT > 0 ? 1 : 0) || 1);
  if (G.comboT <= 0) G.combo = 1;
  G.comboT = comboWindow(G);
  G.maxCombo = Math.max(G.maxCombo, G.combo);
  const gained = e.score * G.combo;
  G.score += gained;
  G.kills += 1;
  const big = e.kind === 'boss' || e.kind === 'splitter';
  spawnBurst(G.parts, G.rng, e.x, e.y, e.color, big ? 42 : 18, big ? 380 : 280, 0.7, big ? 4 : 3);
  spawnBurst(G.parts, G.rng, e.x, e.y, '#f8fafc', big ? 16 : 6, 200, 0.4, 2);
  if (big) spawnRing(G.rings, e.x, e.y, e.color, e.radius * 3.2);
  spawnText(G.texts, e.x, e.y - 10, `+${gained}`, G.combo >= 4 ? '#fbbf24' : '#e2e8f0', G.combo >= 4 ? 20 : 15);
  G.shake = Math.min(16, G.shake + (e.kind === 'boss' ? 14 : big ? 5 : 2));
  G.audio.explosion(e.kind === 'boss');
  if (e.kind === 'splitter') {
    for (let i = 0; i < 3; i++) {
      const m = spawnEnemy(G, 'mite', e.x + randRange(G.rng, -16, 16), e.y + randRange(G.rng, -16, 16));
      m.age = G.rng() * 2;
    }
  }
  if (e.kind !== 'boss') maybeDropPickup(G, e.x, e.y);
  if (e.kind === 'boss') {
    for (let i = 0; i < 3; i++) maybeDropPickup(G, e.x + randRange(G.rng, -70, 70), e.y + randRange(G.rng, -50, 50));
    G.bossActive = false;
    G.bossesDown = (G.bossesDown || 0) + 1;
  }
}

export function updateCombat(G, dt) {
  const p = G.player;
  G.comboT = Math.max(0, G.comboT - dt);
  if (G.comboT <= 0) G.combo = 0;

  for (const b of G.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
  for (const b of G.ebullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
  const off = (b) => b.life <= 0 || b.x < -40 || b.x > VIEW_W + 40 || b.y < -40 || b.y > VIEW_H + 40;
  G.bullets = G.bullets.filter((b) => !off(b));
  G.ebullets = G.ebullets.filter((b) => !off(b));

  // Player bullets vs enemies (iterate backwards for safe removal).
  // A piercing round keeps flying after a hit but never hurts the same
  // enemy twice — the hit set tracks what it already passed through.
  for (let bi = G.bullets.length - 1; bi >= 0; bi--) {
    const b = G.bullets[bi];
    b.hit = b.hit || new Set();
    let consumed = false;
    for (const e of [...G.enemies]) {
      if (b.hit.has(e.id)) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
        b.hit.add(e.id);
        e.hull -= b.dmg || 1;
        e.hurtFlash = 1;
        spawnBurst(G.parts, G.rng, b.x, b.y, '#fde68a', 4, 150, 0.3, 2);
        if (e.hull <= 0) killEnemy(G, e);
        if ((b.pierce || 0) > 0) {
          b.pierce -= 1;
        } else {
          consumed = true;
          break;
        }
      }
    }
    if (consumed) G.bullets.splice(bi, 1);
  }

  // Enemy bullets vs player.
  for (let bi = G.ebullets.length - 1; bi >= 0; bi--) {
    const b = G.ebullets[bi];
    if (p.alive && Math.hypot(p.x - b.x, p.y - b.y) < p.radius + b.radius) {
      G.ebullets.splice(bi, 1);
      damagePlayer(G, 7);
    }
  }

  // Enemies touching the player.
  if (p.alive) {
    for (const e of [...G.enemies]) {
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius - 2) {
        damagePlayer(G, e.damage);
        e.hull = 0;
        killEnemy(G, e);
      }
    }
  }

  // Pickups. TRACTOR COIL / SALVAGE CORE pulls them toward the ship.
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const pk = G.pickups[i];
    pk.age += dt;
    pk.life -= dt;
    if (pk.life <= 0) { G.pickups.splice(i, 1); continue; }
    if (p.alive && p.magnetRadius > 0) {
      const dx = p.x - pk.x, dy = p.y - pk.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < p.magnetRadius && d > 4) {
        pk.x += (dx / d) * 300 * dt;
        pk.y += (dy / d) * 300 * dt;
      }
    }
    if (p.alive && Math.hypot(pk.x - p.x, pk.y - p.y) < pk.radius + p.radius + 4) {
      G.pickups.splice(i, 1);
      applyPickup(G, pk);
    }
  }
}

function applyPickup(G, pk) {
  const p = G.player;
  G.audio.pickup();
  G.coresCollected[pk.kind] = (G.coresCollected[pk.kind] || 0) + 1;
  // Cores gathered this wave (per-wave stat; the forge counts run total).
  G.waveCores = (G.waveCores || 0) + 1;
  spawnRing(G.rings, pk.x, pk.y, pk.color, 46);
  if (pk.kind === 'repair') {
    p.hull = Math.min(p.maxHull, p.hull + 30);
    spawnText(G.texts, p.x, p.y - 26, '+30 HULL', '#34d399', 17);
  } else if (pk.kind === 'rapid') {
    p.rapidTimer = 8;
    spawnText(G.texts, p.x, p.y - 26, 'RAPID FIRE', '#fbbf24', 17);
  } else if (pk.kind === 'shield') {
    p.shieldTimer = 10;
    spawnText(G.texts, p.x, p.y - 26, 'SHIELD UP', '#67e8f9', 17);
  }
}

export function drawCombat(ctx, G) {
  for (const b of G.bullets) {
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of G.ebullets) {
    ctx.fillStyle = '#fb7185';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  for (const pk of G.pickups) {
    const bob = Math.sin(pk.age * 4) * 3;
    const blink = pk.life < 3 ? (Math.sin(pk.age * 14) > 0 ? 1 : 0.25) : 1;
    ctx.globalAlpha = blink;
    ctx.strokeStyle = pk.color;
    ctx.fillStyle = 'rgba(2,6,23,0.75)';
    ctx.lineWidth = 2;
    ctx.shadowColor = pk.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, pk.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = pk.color;
    ctx.font = "700 15px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(pk.label, pk.x, pk.y + bob + 5);
    ctx.globalAlpha = 1;
  }
}

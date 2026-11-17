// The invading swarm: five enemy archetypes plus the Dreadnought boss.
// Each kind has its own steering behaviour and polygon silhouette.

import { VIEW_W, VIEW_H, ENEMY_KINDS } from './config.js';
import { randRange } from './random.js';

let nextId = 1;

export function spawnEnemy(G, kind, x, y) {
  const spec = ENEMY_KINDS[kind];
  const e = {
    id: nextId++, kind,
    x, y, vx: 0, vy: 0,
    hull: spec.hull, maxHull: spec.hull,
    radius: spec.radius, speed: spec.speed,
    score: spec.score, damage: spec.damage, color: spec.color,
    angle: 0, spin: randRange(G.rng, -1.4, 1.4),
    phase: G.rng() * Math.PI * 2,
    fireTimer: randRange(G.rng, 1.2, 2.6),
    hurtFlash: 0, age: 0,
  };
  G.enemies.push(e);
  return e;
}

export function spawnAtEdge(G, kind) {
  // Enemies warp in just outside a random edge, never on top of the player.
  let x = 0, y = 0;
  for (let tries = 0; tries < 12; tries++) {
    const edge = Math.floor(G.rng() * 4);
    if (edge === 0) { x = G.rng() * VIEW_W; y = -30; }
    if (edge === 1) { x = G.rng() * VIEW_W; y = VIEW_H + 30; }
    if (edge === 2) { x = -30; y = G.rng() * VIEW_H; }
    if (edge === 3) { x = VIEW_W + 30; y = G.rng() * VIEW_H; }
    if (Math.hypot(x - G.player.x, y - G.player.y) > 260) break;
  }
  return spawnEnemy(G, kind, x, y);
}

function steer(e, tx, ty, dt, wobble = 0) {
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy) || 1;
  let ax = dx / d, ay = dy / d;
  if (wobble) {
    const s = Math.sin(e.age * 3.1 + e.phase) * wobble;
    const px = -ay, py = ax;
    ax += px * s; ay += py * s;
    const l = Math.hypot(ax, ay) || 1;
    ax /= l; ay /= l;
  }
  e.vx = ax * e.speed;
  e.vy = ay * e.speed;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  e.angle = Math.atan2(e.vy, e.vx);
}

export function updateEnemies(G, dt) {
  const p = G.player;
  for (const e of G.enemies) {
    e.age += dt;
    e.hurtFlash = Math.max(0, e.hurtFlash - dt * 6);
    switch (e.kind) {
      case 'drifter':
        steer(e, p.x, p.y, dt);
        break;
      case 'weaver':
        steer(e, p.x, p.y, dt, 0.85);
        break;
      case 'mite':
        steer(e, p.x, p.y, dt, 0.35);
        break;
      case 'splitter':
        steer(e, p.x, p.y, dt, 0.15);
        break;
      case 'gunner': {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d > 330) steer(e, p.x, p.y, dt, 0.2);
        else if (d < 240) steer(e, e.x * 2 - p.x, e.y * 2 - p.y, dt, 0.2);
        else { e.vx *= 0.9; e.vy *= 0.9; e.angle = Math.atan2(p.y - e.y, p.x - e.x); }
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && d < 560 && p.alive) {
          e.fireTimer = randRange(G.rng, 1.5, 2.4);
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          G.ebullets.push({
            x: e.x + Math.cos(a) * e.radius, y: e.y + Math.sin(a) * e.radius,
            vx: Math.cos(a) * 300, vy: Math.sin(a) * 300,
            radius: 5, life: 3.2, friendly: false,
          });
          G.audio.enemyShoot();
        }
        break;
      }
      case 'boss': {
        // The Dreadnought parks mid-arena and rotates through attack patterns.
        const tx = VIEW_W / 2 + Math.cos(e.age * 0.24) * 240;
        const ty = 170 + Math.sin(e.age * 0.37) * 60;
        const dx = tx - e.x, dy = ty - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.vx = (dx / d) * Math.min(e.speed, d);
        e.vy = (dy / d) * Math.min(e.speed, d);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.angle += dt * 0.5;
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && p.alive) {
          e.fireTimer = 1.15;
          const pattern = Math.floor(e.age / 4) % 3;
          if (pattern === 0) {
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * Math.PI * 2 + e.age;
              G.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, radius: 5, life: 4.5, friendly: false });
            }
          } else if (pattern === 1) {
            const base = Math.atan2(p.y - e.y, p.x - e.x);
            for (const off of [-0.22, 0, 0.22]) {
              G.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(base + off) * 330, vy: Math.sin(base + off) * 330, radius: 5, life: 3.4, friendly: false });
            }
          } else {
            for (let i = 0; i < 3; i++) spawnEnemy(G, 'mite', e.x + randRange(G.rng, -40, 40), e.y + randRange(G.rng, -40, 40));
          }
          G.audio.enemyShoot();
        }
        break;
      }
    }
  }
}

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

export function drawEnemies(ctx, G) {
  for (const e of G.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.kind === 'weaver' || e.kind === 'mite' ? e.age * e.spin : e.angle);
    const fill = e.hurtFlash > 0.3 ? '#ffffff' : e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = fill;
    const r = e.radius;
    switch (e.kind) {
      case 'drifter': polygon(ctx, [[r, 0], [-r * 0.8, r * 0.75], [-r * 0.4, 0], [-r * 0.8, -r * 0.75]]); break;
      case 'weaver': polygon(ctx, [[0, -r], [r * 0.7, 0], [0, r], [-r * 0.7, 0]]); break;
      case 'mite': polygon(ctx, [[r, 0], [-r, r * 0.6], [-r, -r * 0.6]]); break;
      case 'splitter': polygon(ctx, [[r, 0], [r * 0.4, r * 0.85], [-r * 0.7, r * 0.6], [-r, -r * 0.3], [-r * 0.2, -r * 0.9]]); break;
      case 'gunner': {
        ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.fill();
        polygon(ctx, [[r * 1.25, 0], [r * 0.4, r * 0.28], [r * 0.4, -r * 0.28]]);
        break;
      }
      case 'boss': {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e1b2e';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fda4af';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.3 + Math.sin(G.time * 4) * 3, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
    ctx.fill();
    ctx.restore();
    if ((e.kind === 'boss' || e.maxHull >= 3) && e.hull < e.maxHull && e.kind !== 'boss') {
      ctx.fillStyle = 'rgba(2,6,23,0.7)';
      ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, e.radius * 2, 4);
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, e.radius * 2 * (e.hull / e.maxHull), 4);
    }
  }
}

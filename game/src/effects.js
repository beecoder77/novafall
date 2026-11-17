// Visual effects: the parallax starfield and nebula backdrop, particle
// bursts, shockwave rings, engine trails and floating score text.

import { VIEW_W, VIEW_H, COLORS } from './config.js';
import { randRange } from './random.js';

export function makeStarfield(rng) {
  const layers = [];
  const defs = [
    { count: 90, speed: 6, size: 1.1, alpha: 0.5 },
    { count: 60, speed: 14, size: 1.7, alpha: 0.75 },
    { count: 30, speed: 26, size: 2.4, alpha: 1.0 },
  ];
  for (const d of defs) {
    const stars = [];
    for (let i = 0; i < d.count; i++) {
      stars.push({ x: rng() * VIEW_W, y: rng() * VIEW_H, tw: rng() * Math.PI * 2 });
    }
    layers.push({ ...d, stars });
  }
  const nebulae = [];
  for (let i = 0; i < 7; i++) {
    nebulae.push({
      x: rng() * VIEW_W, y: rng() * VIEW_H * 0.9,
      r: randRange(rng, 180, 380),
      color: [COLORS.nebulaA, COLORS.nebulaB, COLORS.nebulaC][i % 3],
    });
  }
  return { layers, nebulae };
}

export function drawBackdrop(ctx, field, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, COLORS.spaceTop);
  grad.addColorStop(1, COLORS.spaceBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const n of field.nebulae) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, n.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
  }
  for (const layer of field.layers) {
    ctx.fillStyle = '#e0f2fe';
    for (const s of layer.stars) {
      const y = (s.y + time * layer.speed) % VIEW_H;
      const twinkle = 0.7 + 0.3 * Math.sin(time * 2 + s.tw);
      ctx.globalAlpha = layer.alpha * twinkle;
      ctx.fillRect(s.x, y, layer.size, layer.size);
    }
  }
  ctx.globalAlpha = 1;
}

export function spawnBurst(parts, rng, x, y, color, count, speed = 260, life = 0.6, size = 3) {
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const v = randRange(rng, speed * 0.25, speed);
    parts.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: randRange(rng, life * 0.4, life), maxLife: life,
      size: randRange(rng, size * 0.5, size * 1.4),
      color, drag: 2.6, glow: true,
    });
  }
}

export function spawnTrail(parts, x, y, vx, vy, color) {
  parts.push({
    x, y, vx: -vx * 0.25, vy: -vy * 0.25 + 30,
    life: 0.3, maxLife: 0.3, size: 4.5, color, drag: 1.5, glow: true,
  });
}

export function spawnRing(rings, x, y, color, maxR = 90) {
  rings.push({ x, y, r: 6, maxR, life: 0.4, maxLife: 0.4, color });
}

export function spawnText(texts, x, y, text, color = '#fde68a', size = 17) {
  texts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9 });
}

export function updateEffects(G, dt) {
  for (const p of G.parts) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const d = Math.max(0, 1 - p.drag * dt);
    p.vx *= d; p.vy *= d;
  }
  G.parts = G.parts.filter((p) => p.life > 0);
  for (const r of G.rings) {
    r.life -= dt;
    r.r += (r.maxR - r.r) * Math.min(1, dt * 7);
  }
  G.rings = G.rings.filter((r) => r.life > 0);
  for (const t of G.texts) {
    t.life -= dt;
    t.y -= 34 * dt;
  }
  G.texts = G.texts.filter((t) => t.life > 0);
}

export function drawEffects(ctx, G) {
  for (const r of G.rings) {
    ctx.globalAlpha = Math.max(0, (r.life / r.maxLife)) * 0.8;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of G.parts) {
    const f = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = f;
    ctx.fillStyle = p.color;
    if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * f + 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const t of G.texts) {
    ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
    ctx.font = `700 ${t.size}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

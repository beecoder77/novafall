// The player's interceptor: movement with a dash, mouse aim, twin nose guns,
// power-up timers, and the glowing arrowhead ship drawn from polygons.

import {
  VIEW_W, VIEW_H, PLAYER_RADIUS, PLAYER_SPEED, PLAYER_HULL,
  DASH_TIME, DASH_COOLDOWN, DASH_MULTIPLIER, BULLET_SPEED,
  FIRE_INTERVAL, RAPID_FIRE_INTERVAL, COLORS,
} from './config.js';
import { spawnTrail } from './effects.js';

export function createPlayer() {
  return {
    x: VIEW_W / 2, y: VIEW_H / 2 + 120,
    vx: 0, vy: 0, angle: -Math.PI / 2,
    radius: PLAYER_RADIUS, hull: PLAYER_HULL, maxHull: PLAYER_HULL,
    fireTimer: 0, dashTimer: 0, dashCooldown: 0,
    dashDirX: 0, dashDirY: 0,
    rapidTimer: 0, shieldTimer: 0, hurtFlash: 0, alive: true,
    // Run progression from the upgrade draft and relics (upgrades.js).
    damageMult: 1, fireIntervalMult: 1, speedMult: 1, comboMult: 1,
    multishot: 0, pierce: 0, magnetRadius: 0,
  };
}

export function updatePlayer(G, dt) {
  const p = G.player;
  const input = G.input;
  if (!p.alive) return;

  let mx = 0, my = 0;
  if (input.down('KeyA') || input.down('ArrowLeft')) mx -= 1;
  if (input.down('KeyD') || input.down('ArrowRight')) mx += 1;
  if (input.down('KeyW') || input.down('ArrowUp')) my -= 1;
  if (input.down('KeyS') || input.down('ArrowDown')) my += 1;
  const len = Math.hypot(mx, my) || 1;
  mx /= len; my /= len;

  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  const wantsDash = input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight') || input.wasPressed('KeyK');
  if (wantsDash && p.dashCooldown <= 0 && (mx !== 0 || my !== 0)) {
    p.dashTimer = DASH_TIME;
    p.dashCooldown = DASH_COOLDOWN;
    p.dashDirX = mx; p.dashDirY = my;
    G.audio.dash();
  }
  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.vx = p.dashDirX * PLAYER_SPEED * DASH_MULTIPLIER;
    p.vy = p.dashDirY * PLAYER_SPEED * DASH_MULTIPLIER;
  } else {
    p.vx = mx * PLAYER_SPEED * p.speedMult;
    p.vy = my * PLAYER_SPEED * p.speedMult;
  }
  p.x = Math.min(VIEW_W - p.radius, Math.max(p.radius, p.x + p.vx * dt));
  p.y = Math.min(VIEW_H - p.radius, Math.max(p.radius, p.y + p.vy * dt));
  p.angle = Math.atan2(input.mouseY - p.y, input.mouseX - p.x);

  if ((p.vx !== 0 || p.vy !== 0) && G.frame % 2 === 0) {
    spawnTrail(G.parts, p.x - Math.cos(p.angle) * 14, p.y - Math.sin(p.angle) * 14, p.vx, p.vy, '#22d3ee');
  }

  p.fireTimer -= dt;
  const firing = input.mouseDown || input.down('Space') || input.down('KeyJ');
  const interval = (p.rapidTimer > 0 ? RAPID_FIRE_INTERVAL : FIRE_INTERVAL) * p.fireIntervalMult;
  if (firing && p.fireTimer <= 0) {
    p.fireTimer = interval;
    const mkBullet = (ox, oy, angle) => ({
      x: p.x + Math.cos(angle) * 16 + ox,
      y: p.y + Math.sin(angle) * 16 + oy,
      vx: Math.cos(angle) * BULLET_SPEED,
      vy: Math.sin(angle) * BULLET_SPEED,
      radius: 4, life: 1.1, friendly: true,
      dmg: p.damageMult, pierce: p.pierce,
    });
    for (const side of [-1, 1]) {
      const ox = Math.cos(p.angle + Math.PI / 2) * 7 * side;
      const oy = Math.sin(p.angle + Math.PI / 2) * 7 * side;
      G.bullets.push(mkBullet(ox, oy, p.angle));
    }
    // SPLIT BARREL: extra streams fanning out from the nose.
    for (let k = 1; k <= p.multishot; k++) {
      const off = (k % 2 === 1 ? 1 : -1) * Math.ceil(k / 2) * 0.1;
      G.bullets.push(mkBullet(0, 0, p.angle + off));
    }
    G.audio.shoot();
  }

  p.rapidTimer = Math.max(0, p.rapidTimer - dt);
  p.shieldTimer = Math.max(0, p.shieldTimer - dt);
  p.hurtFlash = Math.max(0, p.hurtFlash - dt * 5);
}

export function damagePlayer(G, amount) {
  const p = G.player;
  if (!p.alive || p.dashTimer > 0) return;
  if (p.shieldTimer > 0) {
    G.audio.hit();
    return;
  }
  p.hull -= amount;
  p.hurtFlash = 1;
  G.shake = Math.min(14, G.shake + 6);
  G.audio.hit();
  if (p.hull <= 0) {
    p.hull = 0;
    p.alive = false;
  }
}

export function drawPlayer(ctx, G) {
  const p = G.player;
  if (!p.alive) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  if (p.shieldTimer > 0) {
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(G.time * 8);
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = 16;
  ctx.fillStyle = p.hurtFlash > 0.4 ? '#fecdd3' : COLORS.player;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-12, 11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, -11);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.playerCore;
  ctx.beginPath();
  ctx.arc(3, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Heads-up display: score, wave, combo meter, hull bar, dash and power-up
// indicators, the boss health bar, and the centre wave banner.

import { VIEW_W, VIEW_H, COLORS, FINAL_WAVE } from './config.js';

function bar(ctx, x, y, w, h, frac, color, back = 'rgba(15,23,42,0.8)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

export function drawHUD(ctx, G) {
  const p = G.player;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText('SCORE', 22, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = "800 30px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(String(G.score).padStart(7, '0'), 20, 62);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText('WAVE', VIEW_W / 2, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = "800 26px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(`${G.wave} / ${FINAL_WAVE}`, VIEW_W / 2, 60);

  if (G.combo >= 2) {
    const pulse = 1 + 0.08 * Math.sin(G.time * 10);
    ctx.save();
    ctx.translate(VIEW_W / 2, 96);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = G.combo >= 5 ? '#fbbf24' : '#fde68a';
    ctx.font = "800 21px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(`COMBO x${G.combo}`, 0, 0);
    ctx.restore();
    bar(ctx, VIEW_W / 2 - 60, 106, 120, 5, G.comboT / 2.6, '#fbbf24');
  }

  // Hull, bottom-left, with the numeric readout.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText('HULL', 22, VIEW_H - 44);
  const hullFrac = p.hull / p.maxHull;
  bar(ctx, 20, VIEW_H - 36, 230, 15, hullFrac, hullFrac > 0.3 ? COLORS.hull : COLORS.hullLow);
  ctx.fillStyle = COLORS.text;
  ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(`${Math.ceil(p.hull)}`, 258, VIEW_H - 23);

  // Power-up and dash status, bottom-right.
  ctx.textAlign = 'right';
  ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
  let ry = VIEW_H - 22;
  if (p.shieldTimer > 0) { ctx.fillStyle = '#67e8f9'; ctx.fillText(`SHIELD ${p.shieldTimer.toFixed(0)}s`, VIEW_W - 20, ry); ry -= 20; }
  if (p.rapidTimer > 0) { ctx.fillStyle = '#fbbf24'; ctx.fillText(`RAPID ${p.rapidTimer.toFixed(0)}s`, VIEW_W - 20, ry); ry -= 20; }
  ctx.fillStyle = p.dashCooldown <= 0 ? '#a5f3fc' : COLORS.textDim;
  ctx.fillText(p.dashCooldown <= 0 ? 'DASH READY (SHIFT)' : `DASH ${p.dashCooldown.toFixed(1)}s`, VIEW_W - 20, ry);

  const enemiesLeft = G.enemies.length + G.spawnQueue.length;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText('HOSTILES', VIEW_W - 22, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = "800 26px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(String(enemiesLeft), VIEW_W - 20, 60);

  // Boss bar, top centre under the wave counter.
  const boss = G.enemies.find((e) => e.kind === 'boss');
  if (boss) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fda4af';
    ctx.font = "700 13px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText('DREADNOUGHT', VIEW_W / 2, 128);
    bar(ctx, VIEW_W / 2 - 210, 136, 420, 10, boss.hull / boss.maxHull, '#f43f5e');
  }

  if (G.bannerTimer > 0) {
    const a = Math.min(1, G.bannerTimer / 0.5, (2.2 - G.bannerTimer) / 0.3 + 0.2);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = "900 54px 'Segoe UI', system-ui, sans-serif";
    ctx.shadowColor = '#b45309';
    ctx.shadowBlur = 24;
    ctx.fillText(G.bannerText, VIEW_W / 2, VIEW_H / 2 - 90);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  if (G.audio.isMuted()) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText('MUTED (M)', VIEW_W - 20, 84);
  }
}

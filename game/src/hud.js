// Heads-up display: score and best, wave progress, combo meter, hull bar,
// the objective panel, the collected-cores inventory, dash and power-up
// indicators, the boss health bar, and the centre wave banner.

import { VIEW_W, VIEW_H, COLORS, FINAL_WAVE } from './config.js';
import { comboWindow, upgradeDef, relicDef } from './upgrades.js';

function bar(ctx, x, y, w, h, frac, color, back = 'rgba(15,23,42,0.8)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(2,6,23,0.55)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(148,163,184,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

const FONT = "'Segoe UI', system-ui, sans-serif";

export function drawHUD(ctx, G) {
  const p = G.player;
  const cores = G.coresCollected || { repair: 0, rapid: 0, shield: 0 };

  // Score, top-left, with the best score under it.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('SCORE', 22, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(String(G.score).padStart(7, '0'), 20, 62);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText(`BEST  ${String(G.best || 0).padStart(7, '0')}`, 22, 82);

  // Objective panel: the win and lose conditions, and Dreadnoughts sunk.
  panel(ctx, 20, 96, 336, 76);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `800 11px ${FONT}`;
  ctx.fillText('OBJECTIVE', 32, 114);
  ctx.fillStyle = COLORS.text;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(`WIN — clear ${FINAL_WAVE} waves + sink 2 Dreadnoughts`, 32, 134);
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(`DREADNOUGHTS ${G.bossesDown || 0} / 2 sunk   ·   LOSE — hull hits 0`, 32, 154);

  // Active upgrades: the draft picks so far, one row per upgrade. Hidden
  // on the draft screen itself, where the three cards occupy the same
  // space and already show each owned level (OWNED xN + pips).
  const owned = G.upgrades || [];
  if (owned.length > 0 && G.state !== 'upgrade') {
    const rowH = 20;
    const ph = 30 + owned.length * rowH + 8;
    const py = 184;
    panel(ctx, 20, py, 336, ph);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `800 11px ${FONT}`;
    ctx.fillText('UPGRADES', 32, py + 18);
    ctx.font = `600 13px ${FONT}`;
    owned.forEach((u, i) => {
      const def = upgradeDef(u.id);
      if (!def) return;
      const y = py + 38 + i * rowH;
      ctx.fillStyle = def.color;
      ctx.font = `700 14px ${FONT}`;
      ctx.fillText(def.icon, 32, y);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(def.name, 52, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText(`x${u.n}`, 344, y);
      ctx.textAlign = 'left';
    });
  }

  // Wave counter, top centre, with a progress dot per wave. Hidden on the
  // draft screen, where the "WAVE n CLEARED" title carries the same info.
  if (G.state !== 'upgrade') {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText('WAVE', VIEW_W / 2, 30);
    ctx.fillStyle = COLORS.text;
    ctx.font = `800 26px ${FONT}`;
    ctx.fillText(`${G.wave} / ${FINAL_WAVE}`, VIEW_W / 2, 60);
    const dotGap = 15;
    const dotsW = (FINAL_WAVE - 1) * dotGap;
    for (let i = 0; i < FINAL_WAVE; i++) {
      const dx = VIEW_W / 2 - dotsW / 2 + i * dotGap;
      const dy = 76;
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      if (i < G.wave - 1) { ctx.fillStyle = COLORS.accent; ctx.fill(); }
      else if (i === G.wave - 1) { ctx.fillStyle = '#f8fafc'; ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(148,163,184,0.6)'; ctx.lineWidth = 1; ctx.stroke(); }
    }
  }

  // The combo meter is hidden on the draft screen, where the upgrade
  // title occupies the same centre-top space.
  if (G.combo >= 2 && G.state !== 'upgrade') {
    const pulse = 1 + 0.08 * Math.sin(G.time * 10);
    ctx.save();
    ctx.translate(VIEW_W / 2, 102);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = G.combo >= 5 ? '#fbbf24' : '#fde68a';
    ctx.font = `800 21px ${FONT}`;
    ctx.fillText(`COMBO x${G.combo}`, 0, 0);
    ctx.restore();
    bar(ctx, VIEW_W / 2 - 60, 112, 120, 5, G.comboT / comboWindow(G), '#fbbf24');
  }

  // Hull, bottom-left, with the numeric readout.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('HULL', 22, VIEW_H - 44);
  const hullFrac = p.hull / p.maxHull;
  bar(ctx, 20, VIEW_H - 36, 230, 15, hullFrac, hullFrac > 0.3 ? COLORS.hull : COLORS.hullLow);
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 14px ${FONT}`;
  ctx.fillText(`${Math.ceil(p.hull)}`, 258, VIEW_H - 23);

  // Relic strip, bottom-right above the dash readout: one chip per forged
  // relic, icon plus name so the run's permanent powers stay visible.
  // It sits high enough to clear the three-line dash readout (top line
  // can reach y 658 when shield and rapid are both active).
  const relics = G.relics || [];
  if (relics.length > 0) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText('RELICS', VIEW_W - 20, VIEW_H - 118);
    ctx.font = `700 12px ${FONT}`;
    let rx = VIEW_W - 20;
    for (let i = relics.length - 1; i >= 0; i--) {
      const def = relicDef(relics[i]);
      if (!def) continue;
      const w = 24 + ctx.measureText(def.name).width + 16;
      rx -= w;
      panel(ctx, rx, VIEW_H - 110, w, 26);
      ctx.fillStyle = def.color;
      ctx.textAlign = 'left';
      ctx.fillText(def.icon, rx + 10, VIEW_H - 92);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(def.name, rx + 26, VIEW_H - 92);
      rx -= 6;
    }
  }

  // Power-up and dash status, bottom-right.
  ctx.textAlign = 'right';
  ctx.font = `700 14px ${FONT}`;
  let ry = VIEW_H - 22;
  if (p.shieldTimer > 0) { ctx.fillStyle = '#67e8f9'; ctx.fillText(`SHIELD ${p.shieldTimer.toFixed(0)}s`, VIEW_W - 20, ry); ry -= 20; }
  if (p.rapidTimer > 0) { ctx.fillStyle = '#fbbf24'; ctx.fillText(`RAPID ${p.rapidTimer.toFixed(0)}s`, VIEW_W - 20, ry); ry -= 20; }
  ctx.fillStyle = p.dashCooldown <= 0 ? '#a5f3fc' : COLORS.textDim;
  ctx.fillText(p.dashCooldown <= 0 ? 'DASH READY (SHIFT)' : `DASH ${p.dashCooldown.toFixed(1)}s`, VIEW_W - 20, ry);

  // Hostiles left, top-right, with the collected-cores inventory under it.
  const enemiesLeft = G.enemies.length + G.spawnQueue.length;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('HOSTILES', VIEW_W - 22, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(String(enemiesLeft), VIEW_W - 20, 60);
  const chips = [
    { label: 'REPAIR', n: cores.repair, color: '#34d399' },
    { label: 'RAPID', n: cores.rapid, color: '#fbbf24' },
    { label: 'SHIELD', n: cores.shield, color: '#67e8f9' },
  ];
  ctx.font = `700 12px ${FONT}`;
  let cx = VIEW_W - 20;
  for (let i = chips.length - 1; i >= 0; i--) {
    const c = chips[i];
    const w = 84;
    cx -= w;
    panel(ctx, cx, 74, w, 24);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(cx + 13, 86, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(`${c.label} x${c.n}`, cx + 22, 90);
    cx -= 6;
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = `600 11px ${FONT}`;
  ctx.fillText('CORES COLLECTED', VIEW_W - 20, 68);

  // Boss bar, top centre under the wave counter: which Dreadnought, its
  // phase, and its remaining hull.
  const boss = G.enemies.find((e) => e.kind === 'boss');
  if (boss) {
    const frac = boss.hull / boss.maxHull;
    const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
    const num = (G.bossesDown || 0) + 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fda4af';
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText(`DREADNOUGHT ${num} OF 2  ·  PHASE ${phase}`, VIEW_W / 2, 132);
    bar(ctx, VIEW_W / 2 - 210, 140, 420, 10, frac, '#f43f5e');
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText(`${Math.ceil(boss.hull)} / ${boss.maxHull}`, VIEW_W / 2 + 220, 150);
  }

  if (G.bannerTimer > 0) {
    const a = Math.min(1, G.bannerTimer / 0.5, (2.2 - G.bannerTimer) / 0.3 + 0.2);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `900 54px ${FONT}`;
    ctx.shadowColor = '#b45309';
    ctx.shadowBlur = 24;
    ctx.fillText(G.bannerText, VIEW_W / 2, VIEW_H / 2 - 90);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  if (G.audio.isMuted()) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText('MUTED (M)', VIEW_W - 20, 118);
  }
}

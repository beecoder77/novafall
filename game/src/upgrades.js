// Between-wave progression: the upgrade draft and the relic forge.
// After every cleared wave (except the last) the run pauses on a draft:
// pick 1 of 3 upgrade cards; the pick lasts for the rest of the run.
// Cores collected across the run forge a relic every five cores —
// relics are permanent run-wide effects shown in the HUD.

import { VIEW_W, VIEW_H, COMBO_WINDOW } from './config.js';

// One relic per this many cores collected across the whole run.
export const RELIC_FORGE_EVERY = 5;

// --- Upgrades -------------------------------------------------------------
// apply(G) mutates the player; level is tracked in G.upgrades as { id, n }.
export const UPGRADE_DEFS = [
  { id: 'damage',   name: 'HEAVY ROUNDS',      icon: '▲', color: '#f87171', max: 4, desc: '+25% bullet damage',        apply: (G) => { G.player.damageMult *= 1.25; } },
  { id: 'firerate', name: 'RAPID CYCLER',      icon: '»', color: '#fbbf24', max: 4, desc: '+12% fire rate',            apply: (G) => { G.player.fireIntervalMult *= 0.88; } },
  { id: 'hull',     name: 'REINFORCED HULL',   icon: '✚', color: '#34d399', max: 4, desc: '+25 max hull, restore 25',  apply: (G) => { const p = G.player; p.maxHull += 25; p.hull = Math.min(p.maxHull, p.hull + 25); } },
  { id: 'multishot', name: 'SPLIT BARREL',     icon: '✳', color: '#67e8f9', max: 3, desc: '+1 projectile per volley',  apply: (G) => { G.player.multishot += 1; } },
  { id: 'magnet',   name: 'TRACTOR COIL',      icon: '◎', color: '#a78bfa', max: 2, desc: 'Cores drift to your ship',   apply: (G) => { G.player.magnetRadius = Math.max(G.player.magnetRadius, 0) + 130; } },
  { id: 'pierce',   name: 'LANCE ROUNDS',      icon: '◆', color: '#f472b6', max: 3, desc: 'Shots pierce +1 enemy',      apply: (G) => { G.player.pierce += 1; } },
  { id: 'speed',    name: 'ION THRUSTERS',     icon: '★', color: '#fde68a', max: 3, desc: '+12% move speed',            apply: (G) => { G.player.speedMult *= 1.12; } },
  { id: 'combo',    name: 'FOCUS LENS',        icon: '◷', color: '#e2e8f0', max: 3, desc: '+30% combo window',          apply: (G) => { G.player.comboMult *= 1.3; } },
];

// Fallback card when every upgrade is maxed: always available, no cap.
export const CACHE_UPGRADE = {
  id: 'cache', name: 'NOVA CACHE', icon: '✦', color: '#fbbf24', max: Infinity,
  desc: 'Salvage the wreckage: +750 score', apply: (G) => { G.score += 750; },
};

export function upgradeDef(id) {
  return UPGRADE_DEFS.find((d) => d.id === id) || (id === 'cache' ? CACHE_UPGRADE : null);
}

export function upgradeLevel(G, id) {
  const row = (G.upgrades || []).find((u) => u.id === id);
  return row ? row.n : 0;
}

// --- Relics ---------------------------------------------------------------
// Forged from cores; one of each kind per run, effects apply immediately.
export const RELIC_DEFS = [
  { id: 'nova',     name: 'NOVA HEART',     icon: '♥', color: '#f43f5e', desc: '+20% damage, forever',        apply: (G) => { G.player.damageMult *= 1.2; } },
  { id: 'chrono',   name: 'CHRONO LENS',    icon: '◷', color: '#a78bfa', desc: 'Combo lasts 50% longer',      apply: (G) => { G.player.comboMult *= 1.5; } },
  { id: 'aegis',    name: 'AEGIS PLATE',    icon: '◈', color: '#67e8f9', desc: 'A shield rises each wave',    apply: (G) => { G.player.shieldTimer = Math.max(G.player.shieldTimer, 8); } },
  { id: 'salvage',  name: 'SALVAGE CORE',   icon: '✦', color: '#fbbf24', desc: 'Cores are pulled to you',     apply: (G) => { G.player.magnetRadius = Math.max(G.player.magnetRadius, 240); } },
  { id: 'overdrive', name: 'OVERDRIVE CELL', icon: 'ϟ', color: '#34d399', desc: '+15% fire rate, forever',    apply: (G) => { G.player.fireIntervalMult *= 0.85; } },
];

export function relicDef(id) {
  return RELIC_DEFS.find((d) => d.id === id) || null;
}

export function relicOwned(G, id) {
  return (G.relics || []).includes(id);
}

// The combo window after upgrades and relics: the HUD bar and the combat
// timer both read this, never the raw constant.
export function comboWindow(G) {
  return COMBO_WINDOW * (G.player.comboMult || 1);
}

// --- Draft ----------------------------------------------------------------
function rollChoices(G) {
  const available = UPGRADE_DEFS.filter((d) => upgradeLevel(G, d.id) < d.max);
  const picks = [];
  while (picks.length < 3 && available.length > 0) {
    const i = Math.floor(G.rng() * available.length);
    picks.push(available.splice(i, 1)[0]);
  }
  while (picks.length < 3) picks.push(CACHE_UPGRADE);
  return picks;
}

function forgeRelic(G) {
  const unowned = RELIC_DEFS.filter((d) => !relicOwned(G, d.id));
  if (unowned.length === 0) return null;
  const def = unowned[Math.floor(G.rng() * unowned.length)];
  G.relics.push(def.id);
  def.apply(G);
  return def;
}

// Card geometry, shared by the draw code, the click handler and the poses.
export const CARD_W = 280;
export const CARD_H = 310;
export const CARD_GAP = 24;
export const CARD_Y = 218;

export function upgradeCardRects() {
  const total = 3 * CARD_W + 2 * CARD_GAP;
  const x0 = (VIEW_W - total) / 2;
  return [0, 1, 2].map((i) => ({ x: x0 + i * (CARD_W + CARD_GAP), y: CARD_Y, w: CARD_W, h: CARD_H }));
}

export function openUpgradeScreen(G) {
  G.forgedRelic = null;
  // Relic forge: every RELIC_FORGE_EVERY cores gathered across the run
  // (all three kinds count) forges the next relic at the draft.
  const totalCores = Object.values(G.coresCollected || {}).reduce((a, b) => a + b, 0);
  if (totalCores >= (G.relics.length + 1) * RELIC_FORGE_EVERY) {
    G.forgedRelic = forgeRelic(G);
    if (G.forgedRelic) G.audio.relic();
  }
  G.upgradeChoices = rollChoices(G);
  G.upgradeCardBoxes = upgradeCardRects();
  G.state = 'upgrade';
  G.audio.waveClear();
}

export function chooseUpgrade(G, idx) {
  const def = (G.upgradeChoices || [])[idx];
  if (!def) return 0;
  def.apply(G);
  const row = G.upgrades.find((u) => u.id === def.id);
  if (row) row.n += 1;
  else G.upgrades.push({ id: def.id, n: 1 });
  G.audio.upgrade();
  G.upgradeChoices = null;
  G.forgedRelic = null;
  G.upgradeCardBoxes = null;
  // The caller (main.js) starts the next wave; returning its number keeps
  // this module free of an import cycle with waves.js.
  return G.wave + 1;
}

export function pickUpgradeAt(G, x, y) {
  const boxes = G.upgradeCardBoxes || [];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
  }
  return -1;
}

// --- Drawing ---------------------------------------------------------------
const FONT = "'Segoe UI', system-ui, sans-serif";

function pips(ctx, x, y, level, max) {
  for (let i = 0; i < max; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 16, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = i < level ? '#fbbf24' : 'rgba(148,163,184,0.35)';
    ctx.fill();
  }
}

export function drawUpgradeScreen(ctx, G) {
  ctx.fillStyle = 'rgba(3,6,18,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 44px ${FONT}`;
  ctx.shadowColor = '#b45309';
  ctx.shadowBlur = 18;
  ctx.fillText(`WAVE ${G.wave} CLEARED`, VIEW_W / 2, 108);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText('CHOOSE ONE UPGRADE — it lasts for the rest of the run', VIEW_W / 2, 140);

  if (G.forgedRelic) {
    const r = G.forgedRelic;
    const pulse = 0.75 + 0.25 * Math.sin(G.time * 5);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(251,191,36,0.14)';
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(VIEW_W / 2 - 330, 158, 660, 40, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = r.color;
    ctx.font = `800 19px ${FONT}`;
    ctx.fillText(`${r.icon}  RELIC FORGED: ${r.name} — ${r.desc}`, VIEW_W / 2, 185);
  }

  const boxes = G.upgradeCardBoxes || upgradeCardRects();
  const choices = G.upgradeChoices || [];
  choices.forEach((def, i) => {
    const b = boxes[i];
    const hover = G.input.mouseX >= b.x && G.input.mouseX <= b.x + b.w && G.input.mouseY >= b.y && G.input.mouseY <= b.y + b.h;
    ctx.fillStyle = hover ? 'rgba(251,191,36,0.16)' : 'rgba(2,6,23,0.78)';
    ctx.strokeStyle = hover ? '#fbbf24' : def.color;
    ctx.lineWidth = hover ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 14);
    ctx.fill();
    ctx.stroke();
    // Key hint.
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`[${i + 1}]`, b.x + 16, b.y + 30);
    // Icon medallion.
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + 92);
    ctx.fillStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.font = `800 40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(def.icon, 0, 14);
    ctx.restore();
    // Name and effect.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = `800 21px ${FONT}`;
    ctx.fillText(def.name, b.x + b.w / 2, b.y + 178);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `400 15px ${FONT}`;
    ctx.fillText(def.desc, b.x + b.w / 2, b.y + 206);
    // Owned level, before this pick.
    const lvl = upgradeLevel(G, def.id);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 13px ${FONT}`;
    if (def.max === Infinity) {
      ctx.fillText('No limit', b.x + b.w / 2, b.y + 244);
    } else {
      ctx.fillText(lvl === 0 ? 'NEW' : `OWNED x${lvl}`, b.x + b.w / 2, b.y + 240);
      pips(ctx, b.x + b.w / 2 - ((def.max - 1) * 16) / 2, b.y + 262, lvl, def.max);
    }
    ctx.fillStyle = hover ? '#fbbf24' : '#64748b';
    ctx.font = `700 14px ${FONT}`;
    ctx.fillText(hover ? 'CLICK TO TAKE' : '—', b.x + b.w / 2, b.y + 292);
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = `400 15px ${FONT}`;
  ctx.textAlign = 'center';
  const relicNames = (G.relics || []).map((id) => relicDef(id).name).join('  ·  ');
  ctx.fillText(`Click a card or press 1 / 2 / 3${relicNames ? `      RELICS: ${relicNames}` : ''}`, VIEW_W / 2, 586);
}

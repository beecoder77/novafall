// The wave director: expands each wave's composition into a spawn queue,
// feeds enemies in on a timer, and decides when a wave is cleared.

import { WAVE_TABLE, FINAL_WAVE } from './config.js';
import { spawnAtEdge } from './enemies.js';
import { openUpgradeScreen, relicOwned } from './upgrades.js';

export function buildWaveQueue(wave) {
  const spec = WAVE_TABLE[Math.min(wave, FINAL_WAVE) - 1];
  const queue = [];
  for (const [kind, count] of spec.spawns) {
    for (let i = 0; i < count; i++) queue.push(kind);
  }
  // Interleave kinds so a wave arrives mixed rather than in blocks
  // (deterministic stride shuffle, no RNG needed).
  const mixed = [];
  let step = 3;
  const used = new Array(queue.length).fill(false);
  let idx = 0;
  for (let n = 0; n < queue.length; n++) {
    while (used[idx]) idx = (idx + 1) % queue.length;
    mixed.push(queue[idx]);
    used[idx] = true;
    idx = (idx + step) % queue.length;
  }
  return { queue: mixed, gap: spec.gap };
}

export function startWave(G, wave) {
  G.wave = wave;
  const { queue, gap } = buildWaveQueue(wave);
  G.spawnQueue = queue;
  G.spawnGap = gap;
  G.spawnTimer = 0.8;
  G.bannerText = wave === FINAL_WAVE ? `FINAL WAVE ${wave}` : `WAVE ${wave}`;
  G.bannerTimer = 2.2;
  G.bossActive = queue.includes('boss');
  // A fresh wave resets the relic-forge counter; AEGIS PLATE raises a
  // shield as the wave begins.
  G.waveCores = 0;
  if (relicOwned(G, 'aegis')) G.player.shieldTimer = Math.max(G.player.shieldTimer, 12);
}

export function updateWaves(G, dt) {
  if (G.bannerTimer > 0) G.bannerTimer -= dt;
  if (G.spawnQueue.length > 0) {
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      G.spawnTimer = G.spawnGap;
      const kind = G.spawnQueue.shift();
      spawnAtEdge(G, kind);
    }
    return;
  }
  if (G.enemies.length === 0 && G.state === 'playing') {
    if (G.wave >= FINAL_WAVE) {
      G.state = 'victory';
      G.audio.victory();
    } else {
      // Between waves the run pauses on the upgrade draft; the draft
      // starts the next wave once a card is picked.
      openUpgradeScreen(G);
    }
  }
}

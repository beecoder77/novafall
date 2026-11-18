// NOVAFALL — Siege of the Last Orbital.
// Boot, the game state machine and the frame loop. All rules live in the
// sibling modules; this file wires them together and owns the run state.

import { VIEW_W, VIEW_H } from './config.js';
import { makeRandom } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { makeStarfield, drawBackdrop, updateEffects, drawEffects, spawnBurst, spawnRing } from './effects.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { updateEnemies, drawEnemies } from './enemies.js';
import { updateCombat, drawCombat } from './combat.js';
import { startWave, updateWaves } from './waves.js';
import { drawHUD } from './hud.js';
import { drawTitle, drawPause, drawGameOver, drawVictory, START_BUTTON } from './screens.js';
import { poseShot } from './shots.js';
import { chooseUpgrade, pickUpgradeAt, drawUpgradeScreen } from './upgrades.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const BEST_KEY = 'novafall-best';
function loadBest() {
  try { return Math.max(0, parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0); }
  catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* storage unavailable */ }
}

const G = {
  state: 'title',
  time: 0, frame: 0, elapsed: 0,
  score: 0, best: loadBest(), newBest: false, bestRecorded: false,
  combo: 0, comboT: 0, maxCombo: 0, kills: 0,
  wave: 0, spawnQueue: [], spawnTimer: 0, spawnGap: 1,
  bannerText: '', bannerTimer: 0, bossActive: false, bossesDown: 0,
  coresCollected: { repair: 0, rapid: 0, shield: 0 },
  waveCores: 0, upgrades: [], relics: [],
  upgradeChoices: null, forgedRelic: null, upgradeCardBoxes: null,
  shake: 0, deathTimer: -1, deathBurstDone: false,
  player: createPlayer(),
  enemies: [], bullets: [], ebullets: [], parts: [], rings: [], texts: [], pickups: [],
  rng: makeRandom((Math.random() * 1e9) | 0),
  input: createInput(canvas),
  audio: createAudio(),
  starfield: null,
  shotMode: false,
};
G.starfield = makeStarfield(G.rng);

function resetRun() {
  G.player = createPlayer();
  G.enemies = []; G.bullets = []; G.ebullets = [];
  G.parts = []; G.rings = []; G.texts = []; G.pickups = [];
  G.score = 0; G.combo = 0; G.comboT = 0; G.maxCombo = 0; G.kills = 0; G.elapsed = 0;
  G.bossesDown = 0; G.newBest = false; G.bestRecorded = false;
  G.coresCollected = { repair: 0, rapid: 0, shield: 0 };
  G.waveCores = 0; G.upgrades = []; G.relics = [];
  G.upgradeChoices = null; G.forgedRelic = null; G.upgradeCardBoxes = null;
  G.shake = 0; G.deathTimer = -1; G.deathBurstDone = false;
  G.state = 'playing';
  startWave(G, 1);
}

function update(dt) {
  G.time += dt;
  if (G.input.wasPressed('KeyM')) G.audio.toggleMute();

  // A finished run banks its best score once, before the results screen draws.
  if ((G.state === 'gameover' || G.state === 'victory') && !G.bestRecorded) {
    G.bestRecorded = true;
    if (G.score > G.best) {
      G.best = G.score;
      G.newBest = true;
      saveBest(G.best);
    }
  }

  if (G.state === 'title') {
    updateEffects(G, dt);
    if (G.input.wasPressed('Enter') || G.input.clicked && drawTitleHit()) startRun();
    return;
  }
  if (G.state === 'gameover' || G.state === 'victory') {
    updateEffects(G, dt);
    if (G.input.wasPressed('KeyR') || G.input.wasPressed('Enter')) resetRun();
    return;
  }
  if (G.state === 'paused') {
    if (G.input.wasPressed('KeyP') || G.input.wasPressed('Escape')) G.state = 'playing';
    return;
  }
  if (G.state === 'upgrade') {
    // The draft pauses the fight: particles drift on, nothing else moves.
    updateEffects(G, dt);
    let pick = -1;
    if (G.input.wasPressed('Digit1')) pick = 0;
    else if (G.input.wasPressed('Digit2')) pick = 1;
    else if (G.input.wasPressed('Digit3')) pick = 2;
    else if (G.input.clicked) pick = pickUpgradeAt(G, G.input.mouseX, G.input.mouseY);
    if (pick >= 0) {
      const next = chooseUpgrade(G, pick);
      if (next > 0) {
        G.state = 'playing';
        startWave(G, next);
      }
    }
    return;
  }
  // playing
  if (G.input.wasPressed('KeyP') || G.input.wasPressed('Escape')) { G.state = 'paused'; return; }
  G.elapsed += dt;
  updatePlayer(G, dt);
  updateEnemies(G, dt);
  updateCombat(G, dt);
  updateWaves(G, dt);
  updateEffects(G, dt);
  G.shake = Math.max(0, G.shake - dt * 26);
  if (!G.player.alive && G.deathTimer < 0) {
    G.deathTimer = 1.25;
    if (!G.deathBurstDone) {
      G.deathBurstDone = true;
      spawnBurst(G.parts, G.rng, G.player.x, G.player.y, '#67e8f9', 60, 420, 1.1, 4);
      spawnBurst(G.parts, G.rng, G.player.x, G.player.y, '#f8fafc', 24, 260, 0.8, 3);
      spawnRing(G.rings, G.player.x, G.player.y, '#67e8f9', 150);
    }
  }
  if (G.deathTimer > 0) {
    G.deathTimer -= dt;
    if (G.deathTimer <= 0) {
      G.state = 'gameover';
      G.audio.gameOver();
    }
  }
}

// The title screen's button is drawn by screens.js; main only needs its box.
function overButton(b) {
  return G.input.mouseX >= b.x && G.input.mouseX <= b.x + b.w && G.input.mouseY >= b.y && G.input.mouseY <= b.y + b.h;
}
function drawTitleHit() { return overButton(START_BUTTON); }
function startRun() { G.audio.unlock(); resetRun(); }

function render() {
  ctx.save();
  if (G.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  }
  drawBackdrop(ctx, G.starfield, G.time);
  drawCombat(ctx, G);
  drawEnemies(ctx, G);
  drawPlayer(ctx, G);
  drawEffects(ctx, G);
  ctx.restore();

  if (G.state === 'playing' || G.state === 'paused' || G.state === 'upgrade') drawHUD(ctx, G);
  if (G.state === 'upgrade') drawUpgradeScreen(ctx, G);
  if (G.state === 'title') {
    if (drawTitle(ctx, G) && !G.shotMode) startRun();
  } else if (G.state === 'paused') {
    drawPause(ctx, G);
  } else if (G.state === 'gameover') {
    if (drawGameOver(ctx, G) && !G.shotMode) resetRun();
  } else if (G.state === 'victory') {
    if (drawVictory(ctx, G) && !G.shotMode) resetRun();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  G.frame += 1;
  if (G.shotMode) {
    // Posed scene: keep the backdrop and particles alive, freeze the play.
    G.time += dt;
    updateEffects(G, dt);
  } else {
    update(dt);
  }
  render();
  G.input.endFrame();
  requestAnimationFrame(frame);
}

// Debug handle for automated play-testing (read-only state inspection;
// the game itself never reads it).
window.__NOVAFALL = G;

// Screenshot posing: ?shot=title|play|boss|end&seed=n
const params = new URLSearchParams(location.search);
if (params.has('shot')) {
  G.shotMode = true;
  poseShot(G, params.get('shot'), parseInt(params.get('seed') || '1', 10) || 1);
}

requestAnimationFrame(frame);

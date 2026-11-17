// The full-screen states: animated title screen, pause veil, game-over and
// victory results. Each draws its own call to action and restart control.

import { VIEW_W, VIEW_H, COLORS, FINAL_WAVE } from './config.js';

function centre(ctx, text, y, font, color, glow = 0) {
  ctx.textAlign = 'center';
  ctx.font = font;
  ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.shadowBlur = 0;
}

function button(ctx, G, x, y, w, h, label) {
  const hover = G.input.mouseX >= x && G.input.mouseX <= x + w && G.input.mouseY >= y && G.input.mouseY <= y + h;
  ctx.fillStyle = hover ? 'rgba(251,191,36,0.9)' : 'rgba(251,191,36,0.16)';
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hover ? '#1c1005' : COLORS.accent;
  ctx.font = "800 22px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 8);
  return hover && G.input.clicked;
}

export const START_BUTTON = { x: VIEW_W / 2 - 130, y: 470, w: 260, h: 56 };
export const RESTART_BUTTON = { x: VIEW_W / 2 - 130, y: 500, w: 260, h: 56 };

export function drawTitle(ctx, G) {
  ctx.fillStyle = 'rgba(3,6,18,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const bob = Math.sin(G.time * 1.4) * 6;
  centre(ctx, 'NOVAFALL', 218 + bob, "900 96px 'Segoe UI', system-ui, sans-serif", '#f8fafc', 34);
  centre(ctx, '— SIEGE OF THE LAST ORBITAL —', 262 + bob, "600 21px 'Segoe UI', system-ui, sans-serif", '#67e8f9');
  centre(ctx, `Hold the line through ${FINAL_WAVE} waves of the swarm. Chain kills to raise your combo,`, 330, "400 18px 'Segoe UI', system-ui, sans-serif", COLORS.text);
  centre(ctx, 'grab repair, rapid-fire and shield cores, and bring down two Dreadnoughts.', 356, "400 18px 'Segoe UI', system-ui, sans-serif", COLORS.text);
  centre(ctx, 'WASD / ARROWS move · MOUSE aim · CLICK or SPACE fire · SHIFT dash · P pause · M mute', 404, "600 16px 'Segoe UI', system-ui, sans-serif", COLORS.textDim);
  const clicked = button(ctx, G, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h, 'LAUNCH DEFENSE');
  centre(ctx, 'or press ENTER', 556, "400 14px 'Segoe UI', system-ui, sans-serif", COLORS.textDim);
  return clicked;
}

export function drawPause(ctx, G) {
  ctx.fillStyle = 'rgba(3,6,18,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centre(ctx, 'PAUSED', 330, "900 58px 'Segoe UI', system-ui, sans-serif", '#f8fafc', 20);
  centre(ctx, 'Press P to resume', 380, "400 18px 'Segoe UI', system-ui, sans-serif", COLORS.textDim);
}

function resultsPanel(ctx, G, title, titleColor, subtitle) {
  ctx.fillStyle = 'rgba(3,6,18,0.68)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centre(ctx, title, 216, "900 72px 'Segoe UI', system-ui, sans-serif", titleColor, 30);
  centre(ctx, subtitle, 262, "600 19px 'Segoe UI', system-ui, sans-serif", COLORS.text);
  ctx.font = "700 24px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE  ${G.score}`, VIEW_W / 2, 340);
  ctx.font = "400 19px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(`Waves cleared: ${G.state === 'victory' ? FINAL_WAVE : G.wave - 1} of ${FINAL_WAVE}   ·   Kills: ${G.kills}   ·   Time: ${G.elapsed.toFixed(0)}s`, VIEW_W / 2, 380);
  const clicked = button(ctx, G, RESTART_BUTTON.x, RESTART_BUTTON.y, RESTART_BUTTON.w, RESTART_BUTTON.h, 'PLAY AGAIN');
  centre(ctx, 'or press R', 586, "400 14px 'Segoe UI', system-ui, sans-serif", COLORS.textDim);
  return clicked;
}

export function drawGameOver(ctx, G) {
  return resultsPanel(ctx, G, 'ORBITAL LOST', '#f87171', 'The swarm broke through. The station burns — but the fleet remembers your stand.');
}

export function drawVictory(ctx, G) {
  return resultsPanel(ctx, G, 'ORBITAL HELD!', '#34d399', 'Every wave repelled and both Dreadnoughts destroyed. The last orbital is safe.');
}

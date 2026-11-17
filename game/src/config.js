// NOVAFALL — tuning constants: arena, palette, waves and scoring.
// Every number the game balances on lives here so the other modules stay logic-only.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PLAYER_RADIUS = 14;
export const PLAYER_SPEED = 305;
export const PLAYER_HULL = 100;
export const DASH_TIME = 0.16;
export const DASH_COOLDOWN = 1.6;
export const DASH_MULTIPLIER = 3.1;

export const BULLET_SPEED = 780;
export const BULLET_RADIUS = 4;
export const FIRE_INTERVAL = 0.16;
export const RAPID_FIRE_INTERVAL = 0.075;
export const RAPID_FIRE_SECONDS = 8;
export const SHIELD_SECONDS = 10;

export const COMBO_WINDOW = 2.6;
export const COMBO_MAX = 8;

export const FINAL_WAVE = 10;
export const BOSS_WAVES = [5, 10];

// The house palette: deep space blues, nova orange, ion cyan, warning magenta.
export const COLORS = {
  spaceTop: '#070b1d',
  spaceBottom: '#131a3a',
  nebulaA: 'rgba(64, 42, 148, 0.20)',
  nebulaB: 'rgba(14, 116, 144, 0.16)',
  nebulaC: 'rgba(190, 52, 96, 0.10)',
  player: '#67e8f9',
  playerCore: '#ecfeff',
  bullet: '#fde68a',
  enemyBullet: '#fb7185',
  hull: '#34d399',
  hullLow: '#f87171',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  accent: '#fbbf24',
  danger: '#f43f5e',
};

// Enemy archetypes: hull, speed, radius, score and contact damage per kind.
export const ENEMY_KINDS = {
  drifter:  { hull: 1,  speed: 92,  radius: 13, score: 50,  damage: 9,  color: '#fb923c' },
  weaver:   { hull: 2,  speed: 128, radius: 12, score: 80,  damage: 9,  color: '#f472b6' },
  splitter: { hull: 3,  speed: 74,  radius: 19, score: 120, damage: 12, color: '#a78bfa' },
  mite:     { hull: 1,  speed: 196, radius: 8,  score: 30,  damage: 6,  color: '#facc15' },
  gunner:   { hull: 4,  speed: 58,  radius: 16, score: 160, damage: 10, color: '#38bdf8' },
  boss:     { hull: 130, speed: 34, radius: 58, score: 2500, damage: 22, color: '#f43f5e' },
};

// Wave compositions: [kind, count] pairs plus the seconds between spawns.
export const WAVE_TABLE = [
  { spawns: [['drifter', 6]],                                        gap: 1.15 },
  { spawns: [['drifter', 8], ['weaver', 3]],                         gap: 1.00 },
  { spawns: [['weaver', 6], ['drifter', 8]],                         gap: 0.90 },
  { spawns: [['splitter', 4], ['drifter', 8], ['mite', 6]],          gap: 0.82 },
  { spawns: [['boss', 1], ['drifter', 6]],                           gap: 0.90 },
  { spawns: [['gunner', 4], ['weaver', 6], ['mite', 8]],             gap: 0.78 },
  { spawns: [['splitter', 6], ['weaver', 8], ['drifter', 8]],        gap: 0.70 },
  { spawns: [['gunner', 6], ['mite', 12], ['weaver', 6]],            gap: 0.64 },
  { spawns: [['splitter', 8], ['gunner', 6], ['weaver', 8]],         gap: 0.58 },
  { spawns: [['boss', 1], ['gunner', 4], ['mite', 10]],             gap: 0.66 },
];

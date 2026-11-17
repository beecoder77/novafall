// A tiny seeded random generator (mulberry32) so screenshot scenes and any
// replays are perfectly reproducible: same seed, same starfield, same spawns.

export function makeRandom(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function randPick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

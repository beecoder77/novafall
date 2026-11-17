// Synthesised sound effects with the Web Audio API: no audio files, every
// sound is an oscillator/noise burst shaped by an envelope. M toggles mute.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  const ensure = () => {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  };

  const tone = (freqA, freqB, seconds, type, volume, delay = 0) => {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqB, 1), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  };

  const noise = (seconds, volume, delay = 0) => {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  };

  return {
    unlock: ensure,
    toggleMute: () => { muted = !muted; return muted; },
    isMuted: () => muted,
    shoot: () => tone(880, 220, 0.09, 'square', 0.10),
    enemyShoot: () => tone(340, 160, 0.12, 'sawtooth', 0.07),
    explosion: (big = false) => { noise(big ? 0.5 : 0.25, big ? 0.5 : 0.28); tone(160, 40, big ? 0.5 : 0.25, 'triangle', 0.3); },
    hit: () => tone(200, 60, 0.18, 'sawtooth', 0.25),
    dash: () => tone(300, 900, 0.14, 'sine', 0.16),
    pickup: () => { tone(660, 660, 0.07, 'sine', 0.18); tone(990, 990, 0.1, 'sine', 0.18, 0.07); },
    waveClear: () => { tone(523, 523, 0.1, 'triangle', 0.2); tone(659, 659, 0.1, 'triangle', 0.2, 0.1); tone(784, 784, 0.16, 'triangle', 0.22, 0.2); },
    gameOver: () => { tone(392, 392, 0.2, 'triangle', 0.22); tone(311, 311, 0.2, 'triangle', 0.22, 0.2); tone(233, 120, 0.5, 'triangle', 0.24, 0.4); },
    victory: () => { tone(523, 523, 0.12, 'triangle', 0.2); tone(659, 659, 0.12, 'triangle', 0.2, 0.12); tone(784, 784, 0.12, 'triangle', 0.2, 0.24); tone(1046, 1046, 0.3, 'triangle', 0.24, 0.36); },
  };
}

# novafall

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/beecoder77/novafall/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/beecoder77/novafall/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**NOVAFALL — Siege of the Last Orbital**: a complete twin-stick arena
survival shooter in plain HTML5 canvas and ES modules — no libraries, no
build, no network. Hold the last orbital station through 10 waves of an
alien swarm: five enemy archetypes with distinct behaviours (chasers,
weavers, splitters that burst into mites, sniping gunners), two Dreadnought
bosses with rotating attack patterns, a combo multiplier up to x8, dash with
i-frames, repair / rapid-fire / shield pickups, synthesised Web Audio sound
effects, particle explosions, screen shake, and title, pause, game-over and
victory screens with restart.

Controls: WASD / arrows move · mouse aim · click or Space fire · Shift dash
· P pause · M mute.

The source is split into single-purpose modules under `game/src/`
(config, input, audio, effects, player, enemies, combat, waves, hud,
screens, shots, main). Screenshot scenes are real poses of the running game
via `?shot=title|play|boss|end&seed=n`.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
# hand-in package:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>

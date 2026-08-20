# Smallest unit

A 16/32-step drum machine in the browser: five synthesized drum lanes (kick, snare, rim, hat, open hat), two pitched lanes (bass arp + synth riff), an XY drone pad, swing, live WAV recording, and per-lane stem export — all synthesized with the Web Audio API, no samples.

Built with Vite + React + TypeScript. Fully static, no backend.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

Static output lands in `dist/`.

## Deploy (Cloudflare Pages)

Connect this repo in the Cloudflare dashboard (Workers & Pages → Create → Pages → connect to Git) with:

- Build command: `npm run build`
- Build output directory: `dist`

## Structure

- `src/audio/` — audio engine: voices, lookahead scheduler (`transport.ts`), AudioWorklet WAV recorder, offline stem renderer, zip/WAV encoders, XY-pad drone
- `src/components/` — transport, BPM control, step grid, pitched lanes, XY pad
- `src/patterns.ts` — default pattern and melodic fills
- `src/storage.ts` — localStorage persistence of pattern/BPM/swing
- `public/fonts/` — North East + Wowmeta (licensed; keep the repo private)

## Notes

- Spacebar toggles play (ignored while typing in an input). Pause remembers the step.
- Swing state exists (50/54/58/62) but has no UI yet, matching the design handoff.

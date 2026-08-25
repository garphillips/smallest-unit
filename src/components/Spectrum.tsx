import { useEffect, useRef } from 'react';
import type { Engine } from '../audio/engine';

interface Props {
  engine: Engine;
}

/** Height of the glow band pinned to the bottom of the viewport. */
const HEIGHT = 260;
/** Band edges. Linear FFT bins crowd everything into the bottom octave, so the
    lobes are spaced logarithmically to read the way the ear hears. */
const F_LO = 30;
const F_HI = 16000;
/**
 * Glow colour — the base lilac #F2E2FF scaled down to roughly #867A96. Because
 * the lobes composite over a near-black page, darkening the source caps how
 * bright the glow can ever get, which alpha alone does not.
 */
const RGB = '134,122,150';
/**
 * Wide lobes rather than thin bars — once blurred, narrow bars wash into a flat
 * smear, while broad ones keep a sense of where the energy sits.
 */
const PER_BAR = 40;
const BARS_MIN = 14;
const BARS_MAX = 34;
/**
 * The canvas is blurred and scaled up, so its backing store can be a fraction
 * of the display size — nobody can see detail through a 28px blur, and this
 * keeps a full-width, full-rate repaint cheap.
 */
const RENDER_SCALE = 0.34;
const BLUR_PX = 28;
/**
 * Easing time constants, in milliseconds — expressed as time rather than
 * per-frame steps so the motion looks the same on a 60Hz and a 120Hz display.
 * Falling much slower than rising is what stops the glow twitching.
 */
const TAU_RISE = 110;
const TAU_FALL = 340;
/** Leaves headroom so the glow rarely reaches the top of the band. */
const HEADROOM = 0.88;
/**
 * Music carries far more energy low down, so an honest spectrum always leans
 * left. Bands are log-spaced, so a boost rising linearly with band index is a
 * constant dB-per-octave tilt — it spreads the glow without lying about shape.
 */
const TILT = 1.7;
/** Compresses the range, lifting quiet bands so they still register. */
const CURVE = 0.7;
/**
 * Lobe alpha before the blur spreads it. The floor is what governs how
 * prominent the glow feels — a floor near zero keeps it invisible at rest so it
 * only blooms on hits, rather than sitting there as a permanently lit band.
 */
const ALPHA_FLOOR = 0.05;
const ALPHA_RANGE = 0.3;

const barCount = (cssWidth: number) =>
  Math.max(BARS_MIN, Math.min(BARS_MAX, Math.floor(cssWidth / PER_BAR)));

/** Fractional FFT bin edges backing each lobe. */
function bandEdges(analyser: AnalyserNode, sampleRate: number, bars: number): [number, number][] {
  const perBin = sampleRate / analyser.fftSize;
  return Array.from({ length: bars }, (_, i) => [
    (F_LO * Math.pow(F_HI / F_LO, i / bars)) / perBin,
    (F_LO * Math.pow(F_HI / F_LO, (i + 1) / bars)) / perBin,
  ]);
}

/**
 * Level for one band, 0..1. Down at 30Hz a band is narrower than a single
 * 21.5Hz bin, so several lobes would read the same bin and move in lockstep —
 * those interpolate between neighbouring bins instead. Wider bands average,
 * which sits calmer than taking the max.
 */
function readBand(bins: Uint8Array, lo: number, hi: number): number {
  const first = Math.ceil(lo);
  const last = Math.min(bins.length - 1, Math.floor(hi));
  if (last < first) {
    const mid = Math.min(bins.length - 2, (lo + hi) / 2);
    const i = Math.floor(mid);
    const t = mid - i;
    return (bins[i] * (1 - t) + bins[i + 1] * t) / 255;
  }
  let sum = 0;
  for (let k = first; k <= last; k++) sum += bins[k];
  return sum / (last - first + 1) / 255;
}

/** Ambient glow of the master bus, pinned behind the page. */
export function Spectrum({ engine }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext('2d')!;
    let bars = 0;
    let raw = new Float32Array(0);
    let targets = new Float32Array(0);
    let levels = new Float32Array(0);
    let bins: Uint8Array | null = null;
    let edges: [number, number][] = [];
    let idle = 0;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const cssWidth = canvas.clientWidth || window.innerWidth;
      canvas.width = Math.max(1, Math.round(cssWidth * RENDER_SCALE));
      canvas.height = Math.max(1, Math.round(HEIGHT * RENDER_SCALE));
      const next = barCount(cssWidth);
      if (next !== bars) {
        bars = next;
        raw = new Float32Array(bars);
        targets = new Float32Array(bars);
        levels = new Float32Array(bars);
        edges = []; // rebuilt on the next frame that has an analyser
      }
      idle = 0; // force one repaint at the new size
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const paint = () => {
      const w = canvas.width;
      const h = canvas.height;
      const span = h * HEADROOM;
      g.clearRect(0, 0, w, h);
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const bh = levels[i] * span;
        if (bh <= 0.5) continue;
        g.fillStyle = `rgba(${RGB},${ALPHA_FLOOR + ALPHA_RANGE * levels[i]})`;
        g.fillRect(i * bw, h - bh, bw, bh);
      }
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const now = performance.now();
      // clamped so returning to a backgrounded tab doesn't snap the glow
      const dt = Math.min(64, now - last);
      last = now;

      const analyser = engine.analyser();
      if (analyser) {
        if (!bins || bins.length !== analyser.frequencyBinCount) {
          bins = new Uint8Array(analyser.frequencyBinCount);
          edges = [];
        }
        if (edges.length !== bars) edges = bandEdges(analyser, engine.sampleRate, bars);
        analyser.getByteFrequencyData(bins);
        for (let i = 0; i < bars; i++) {
          const tilted = readBand(bins, edges[i][0], edges[i][1]) * (1 + TILT * (i / (bars - 1)));
          raw[i] = Math.pow(Math.min(1, tilted), CURVE);
        }
      } else {
        raw.fill(0);
      }

      // A light 3-tap blur across neighbours, so the glow reads as one contour
      // rather than separate columns.
      for (let i = 0; i < bars; i++) {
        const a = raw[i === 0 ? 0 : i - 1];
        const b = raw[i];
        const c = raw[i === bars - 1 ? bars - 1 : i + 1];
        targets[i] = a * 0.25 + b * 0.5 + c * 0.25;
      }

      let live = false;
      const kRise = 1 - Math.exp(-dt / TAU_RISE);
      const kFall = 1 - Math.exp(-dt / TAU_FALL);
      for (let i = 0; i < bars; i++) {
        const t = targets[i];
        levels[i] += (t - levels[i]) * (t > levels[i] ? kRise : kFall);
        if (levels[i] < 0.0004) levels[i] = 0;
        if (levels[i] > 0 || t > 0) live = true;
      }

      // Once everything has settled to silence the canvas stops being redrawn.
      if (!live) {
        if (idle > 2) return;
        idle++;
      } else {
        idle = 0;
      }
      paint();
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine]);

  // fades out toward the top so the band has no hard upper edge
  const fade = 'linear-gradient(to top, black 25%, transparent 100%)';

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: HEIGHT,
        // behind the page content, but still above the html background
        zIndex: -1,
        pointerEvents: 'none',
        filter: `blur(${BLUR_PX}px)`,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
    />
  );
}

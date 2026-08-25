import type { Engine } from './engine';
import type { ParamsOf } from './params';

type KeysParams = ParamsOf<'keys'>;

interface KeyNodes {
  g: GainNode;
  lp: BiquadFilterNode;
  oscs: OscillatorNode[];
  /** Captured at press time, so re-tuning the release never cuts a held note. */
  release: number;
}

const DECAY = 0.35; // bright -> warm settle time
const PEAK = 0.14; // both scaled by the `level` param
const SUSTAIN = 0.08;
const WARM_RATIO = 0.25; // the filter settles to this fraction of `bright`
const PAN = -1; // piano sits hard-left

/**
 * Synthwave-style sustained voice: a detuned sawtooth "supersaw" plus a sub
 * oscillator through a resonant lowpass that snaps bright then settles warm.
 * Each semitone is tracked independently so multiple keys can sustain at
 * once; press() re-triggers cleanly even if the same key is still ringing.
 */
export class KeySynth {
  private voices = new Map<number, KeyNodes>();
  private panner: StereoPannerNode | null = null;

  constructor(private engine: Engine) {}

  private getPanner(): StereoPannerNode {
    if (!this.panner) {
      const panner = this.engine.ctx().createStereoPanner();
      panner.pan.value = PAN;
      panner.connect(this.engine.master);
      this.panner = panner;
    }
    return this.panner;
  }

  press(semi: number, p: KeysParams) {
    this.release(semi, true);
    const ac = this.engine.ctx();
    this.engine.resume();
    const t = ac.currentTime;
    const f0 = 261.63 * Math.pow(2, semi / 12);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = p.res;
    lp.frequency.setValueAtTime(p.bright, t);
    lp.frequency.exponentialRampToValueAtTime(p.bright * WARM_RATIO, t + DECAY);

    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, PEAK * p.level), t + p.attack);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, SUSTAIN * p.level), t + p.attack + DECAY);
    lp.connect(g);
    g.connect(this.getPanner());

    const oscs = [-p.spread, 0, p.spread].map((det) => {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f0;
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      return o;
    });
    const sub = ac.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = f0 / 2;
    sub.connect(lp);
    sub.start(t);
    oscs.push(sub);

    this.voices.set(semi, { g, lp, oscs, release: p.release });
  }

  /** Release the held note; `immediate` is used internally to cut a re-triggered voice fast. */
  release(semi: number, immediate = false) {
    const v = this.voices.get(semi);
    if (!v) return;
    const ac = this.engine.ctx();
    const t = ac.currentTime;
    const dur = immediate ? 0.03 : v.release;
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setValueAtTime(v.g.gain.value, t);
    v.g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    v.oscs.forEach((o) => o.stop(t + dur + 0.05));
    this.voices.delete(semi);
  }

  releaseAll() {
    Array.from(this.voices.keys()).forEach((semi) => this.release(semi, true));
  }
}

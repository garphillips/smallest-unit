import type { Engine } from './engine';

interface KeyNodes {
  g: GainNode;
  lp: BiquadFilterNode;
  oscs: OscillatorNode[];
}

const DETUNES = [-14, 0, 14]; // supersaw unison spread, cents
const ATTACK = 0.02;
const DECAY = 0.35;
const PEAK = 0.28;
const SUSTAIN = 0.16;
const RELEASE = 0.4;
const BRIGHT_HZ = 5200;
const WARM_HZ = 1300;

/**
 * Synthwave-style sustained voice: a detuned sawtooth "supersaw" plus a sub
 * oscillator through a resonant lowpass that snaps bright then settles warm.
 * Each semitone is tracked independently so multiple keys can sustain at
 * once; press() re-triggers cleanly even if the same key is still ringing.
 */
export class KeySynth {
  private voices = new Map<number, KeyNodes>();

  constructor(private engine: Engine) {}

  press(semi: number) {
    this.release(semi, true);
    const ac = this.engine.ctx();
    this.engine.resume();
    const t = ac.currentTime;
    const f0 = 261.63 * Math.pow(2, semi / 12);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 5;
    lp.frequency.setValueAtTime(BRIGHT_HZ, t);
    lp.frequency.exponentialRampToValueAtTime(WARM_HZ, t + DECAY);

    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(PEAK, t + ATTACK);
    g.gain.exponentialRampToValueAtTime(SUSTAIN, t + ATTACK + DECAY);
    lp.connect(g);
    g.connect(this.engine.master);

    const oscs = DETUNES.map((det) => {
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

    this.voices.set(semi, { g, lp, oscs });
  }

  /** Release the held note; `immediate` is used internally to cut a re-triggered voice fast. */
  release(semi: number, immediate = false) {
    const v = this.voices.get(semi);
    if (!v) return;
    const ac = this.engine.ctx();
    const t = ac.currentTime;
    const dur = immediate ? 0.03 : RELEASE;
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

import type { AudioEnv } from './engine';
import type { BassWave, DrumId, LaneId } from '../types';

export function envGain(E: AudioEnv, t: number, peak: number, dur: number): GainNode {
  const g = E.ac.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  g.connect(E.master);
  return g;
}

export function noise(E: AudioEnv, t: number, dur: number): AudioBufferSourceNode {
  const s = E.ac.createBufferSource();
  s.buffer = E.noiseBuf;
  s.start(t);
  s.stop(t + dur + 0.05);
  return s;
}

export function playVoice(E: AudioEnv, id: DrumId, t: number) {
  const ac = E.ac;
  if (id === 'kick') {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    o.connect(envGain(E, t, 1.0, 0.3));
    o.start(t);
    o.stop(t + 0.32);
  } else if (id === 'snare') {
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1800;
    noise(E, t, 0.18).connect(f);
    f.connect(envGain(E, t, 0.42, 0.16));
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(196, t);
    o.connect(envGain(E, t, 0.34, 0.09));
    o.start(t);
    o.stop(t + 0.12);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 1.4;
    [0, 0.014, 0.028].forEach((off) => {
      noise(E, t + off, 0.14).connect(bp);
    });
    bp.connect(envGain(E, t, 0.4, 0.16));
  } else if (id === 'rim') {
    const o = ac.createOscillator();
    o.type = 'square';
    o.frequency.value = 1720;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1720;
    f.Q.value = 6;
    o.connect(f);
    f.connect(envGain(E, t, 0.5, 0.045));
    o.start(t);
    o.stop(t + 0.06);
  } else if (id === 'hat') {
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 8200;
    noise(E, t, 0.05).connect(f);
    f.connect(envGain(E, t, 0.32, 0.045));
  } else if (id === 'ohat') {
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7600;
    noise(E, t, 0.4).connect(f);
    f.connect(envGain(E, t, 0.3, 0.34));
  }
}

/** A-minor degrees: root, b3, 5th, octave up. deg is 1..4. */
export function melFreq(base: number, deg: number): number {
  return base * Math.pow(2, [0, 3, 7, 12][deg - 1] / 12);
}

export function playBass(E: AudioEnv, deg: number, t: number, wave: BassWave) {
  const ac = E.ac;
  const f0 = melFreq(55, deg);
  const o = ac.createOscillator();
  o.type = wave === 'square' ? 'square' : 'sawtooth';
  o.frequency.value = f0;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 6;
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(140, t + 0.22);
  o.connect(lp);
  lp.connect(envGain(E, t, 0.34, 0.26));
  o.start(t);
  o.stop(t + 0.3);
  const sub = ac.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = f0 / 2;
  sub.connect(envGain(E, t, 0.28, 0.24));
  sub.start(t);
  sub.stop(t + 0.28);
}

export function playSynth(E: AudioEnv, deg: number, t: number) {
  // bright detuned saw pluck with a closing filter
  const ac = E.ac;
  const f0 = melFreq(220, deg);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(3400, t);
  lp.frequency.exponentialRampToValueAtTime(620, t + 0.14);
  lp.connect(envGain(E, t, 0.24, 0.18));
  [0, 11].forEach((det) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f0;
    o.detune.value = det;
    o.connect(lp);
    o.start(t);
    o.stop(t + 0.2);
  });
}

export function playMel(E: AudioEnv, id: LaneId, deg: number, t: number, wave: BassWave) {
  if (id === 'bass') playBass(E, deg, t, wave);
  else playSynth(E, deg, t);
}

/** Piano key voice: semi is a chromatic semitone offset from C4 (261.63 Hz). */
export function playKey(E: AudioEnv, semi: number, t: number) {
  const ac = E.ac;
  const f0 = 261.63 * Math.pow(2, semi / 12);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 2;
  lp.frequency.setValueAtTime(3800, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + 0.5);
  lp.connect(envGain(E, t, 0.26, 0.9));
  [0, 7].forEach((det) => {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f0;
    o.detune.value = det;
    o.connect(lp);
    o.start(t);
    o.stop(t + 0.95);
  });
}

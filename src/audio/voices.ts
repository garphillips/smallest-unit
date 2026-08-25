import type { AudioEnv } from './engine';
import type { VoiceSettings } from './params';
import type { DrumId, LaneId } from '../types';

export function envGain(E: AudioEnv, t: number, peak: number, dur: number): GainNode {
  const g = E.ac.createGain();
  g.gain.setValueAtTime(Math.max(0.0001, peak), t);
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

export function playVoice(E: AudioEnv, id: DrumId, t: number, V: VoiceSettings) {
  const ac = E.ac;
  if (id === 'kick') {
    const p = V.kick;
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(p.tune * p.punch, t);
    o.frequency.exponentialRampToValueAtTime(p.tune, t + Math.min(0.12, p.decay * 0.4));
    o.connect(envGain(E, t, 1.0 * p.level, p.decay));
    o.start(t);
    o.stop(t + p.decay + 0.02);
  } else if (id === 'snare') {
    const p = V.snare;
    const body = p.decay * 0.5625;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1800 * p.tone;
    noise(E, t, p.decay * 1.125).connect(f);
    f.connect(envGain(E, t, 0.42 * p.snap * p.level, p.decay));
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(p.tune, t);
    o.connect(envGain(E, t, 0.34 * p.level, body));
    o.start(t);
    o.stop(t + body + 0.03);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400 * p.tone;
    bp.Q.value = 1.4;
    [0, 0.014, 0.028].forEach((off) => {
      noise(E, t + off, p.decay * 0.875).connect(bp);
    });
    bp.connect(envGain(E, t, 0.4 * p.snap * p.level, p.decay));
  } else if (id === 'rim') {
    const p = V.rim;
    const o = ac.createOscillator();
    o.type = 'square';
    o.frequency.value = p.tune;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = p.tune;
    f.Q.value = p.tone;
    o.connect(f);
    f.connect(envGain(E, t, 0.5 * p.level, p.decay));
    o.start(t);
    o.stop(t + p.decay + 0.015);
  } else if (id === 'hat') {
    const p = V.hat;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = p.tune;
    noise(E, t, p.decay * 1.11).connect(f);
    f.connect(envGain(E, t, 0.32 * p.level, p.decay));
  } else if (id === 'ohat') {
    const p = V.ohat;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = p.tune;
    noise(E, t, p.decay * 1.18).connect(f);
    f.connect(envGain(E, t, 0.3 * p.level, p.decay));
  }
}

/** A-minor degrees: root, b3, 5th, octave up. deg is 1..4. */
export function melFreq(base: number, deg: number): number {
  return base * Math.pow(2, [0, 3, 7, 12][deg - 1] / 12);
}

export function playBass(E: AudioEnv, deg: number, t: number, V: VoiceSettings) {
  const ac = E.ac;
  const p = V.bass;
  const f0 = melFreq(55, deg);
  const o = ac.createOscillator();
  o.type = p.wave >= 1 ? 'square' : 'sawtooth';
  o.frequency.value = f0;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 6;
  lp.frequency.setValueAtTime(p.cutoff, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(60, p.cutoff * 0.1), t + p.decay * 0.85);
  o.connect(lp);
  lp.connect(envGain(E, t, 0.34 * p.level, p.decay));
  o.start(t);
  o.stop(t + p.decay + 0.04);
  const sub = ac.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = f0 / 2;
  sub.connect(envGain(E, t, 0.28 * p.sub * p.level, p.decay * 0.92));
  sub.start(t);
  sub.stop(t + p.decay * 0.92 + 0.04);
}

export function playSynth(E: AudioEnv, deg: number, t: number, V: VoiceSettings) {
  // bright detuned saw pluck with a closing filter
  const ac = E.ac;
  const p = V.synth;
  const f0 = melFreq(220, deg);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(p.cutoff, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(80, p.cutoff * 0.18), t + p.decay * 0.78);
  lp.connect(envGain(E, t, 0.24 * p.level, p.decay));
  [0, p.detune].forEach((det) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f0;
    o.detune.value = det;
    o.connect(lp);
    o.start(t);
    o.stop(t + p.decay + 0.02);
  });
}

export function playMel(E: AudioEnv, id: LaneId, deg: number, t: number, V: VoiceSettings) {
  if (id === 'bass') playBass(E, deg, t, V);
  else playSynth(E, deg, t, V);
}

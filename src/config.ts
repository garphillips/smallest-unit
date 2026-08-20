import type { BassWave, LaneDef, TrackDef } from './types';

export const STEPS: 16 | 32 = 16;
export const SHOW_STEP_NUMBERS = true;
export const DEFAULT_BPM = 122;
export const BPM_MIN = 60;
export const BPM_MAX = 180;
export const BASS_WAVE: BassWave = 'saw';

export const ACCENTS = {
  bass: '#D9F2DC',
  synth: '#C9EDE6',
  pad: '#C9D8F2',
};

export const TRACK_DEFS: TrackDef[] = [
  { id: 'kick', name: 'kick' },
  { id: 'snare', name: 'snare' },
  { id: 'rim', name: 'rim' },
  { id: 'hat', name: 'chik' },
  { id: 'ohat', name: 'hats' },
];

export const LANE_DEFS: LaneDef[] = [
  { id: 'bass', chipTitle: 'arp', shapes: ['rise', 'fall', 'bounce', 'drift'] },
  { id: 'synth', chipTitle: 'riff', shapes: ['stabs', 'answer', 'rise', 'drift'] },
];

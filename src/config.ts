import type { LaneDef, TrackDef } from './types';

export const STEPS: 16 | 32 = 16;
export const SHOW_STEP_NUMBERS = true;
export const DEFAULT_BPM = 122;
export const BPM_MIN = 60;
export const BPM_MAX = 180;

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

/** Display names that differ from the voice id; drums come from TRACK_DEFS. */
const EXTRA_LABELS: Record<string, string> = { pad: 'xy pad' };

export const voiceLabel = (id: string): string =>
  TRACK_DEFS.find((td) => td.id === id)?.name ?? EXTRA_LABELS[id] ?? id;

export const LANE_DEFS: LaneDef[] = [
  { id: 'bass', shapes: ['rise', 'fall', 'bounce', 'drift'] },
  { id: 'synth', shapes: ['stabs', 'answer', 'rise', 'drift'] },
];

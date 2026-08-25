import type { VoiceSettings } from './audio/params';

export type DrumId = 'kick' | 'snare' | 'rim' | 'hat' | 'ohat';
export type LaneId = 'bass' | 'synth';

export type Pattern = Record<DrumId, boolean[]>;
export type Lanes = Record<LaneId, number[]>; // 0 = off, 1..4 = scale degree

/** Everything the audio scheduler needs to read on each tick. */
export interface Snapshot {
  steps: number;
  bpm: number;
  swing: number;
  pattern: Pattern;
  lanes: Lanes;
  voices: VoiceSettings;
}

export interface TrackDef {
  id: DrumId;
  name: string;
}

export interface LaneDef {
  id: LaneId;
  shapes: string[];
}

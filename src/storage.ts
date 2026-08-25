import { BPM_MAX, BPM_MIN, DEFAULT_BPM } from './config';
import { clampVoices, defaultVoices, type VoiceSettings } from './audio/params';
import { MAX_STEPS, defaultPattern, melFill } from './patterns';
import type { Lanes, Pattern } from './types';

const KEY = 'smallest-unit:v1';

export interface SavedState {
  pattern: Pattern;
  lanes: Lanes;
  bpm: number;
  swing: number;
  voices: VoiceSettings;
}

export function defaultState(): SavedState {
  return {
    pattern: defaultPattern(),
    lanes: { bass: melFill('bass', 'rise'), synth: melFill('synth', 'stabs') },
    bpm: DEFAULT_BPM,
    swing: 50,
    voices: defaultVoices(),
  };
}

const isBoolLane = (v: unknown): v is boolean[] =>
  Array.isArray(v) && v.length === MAX_STEPS && v.every((x) => typeof x === 'boolean');
const isDegLane = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length === MAX_STEPS && v.every((x) => typeof x === 'number' && x >= 0 && x <= 4);

export function loadState(): SavedState {
  const fallback = defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const s = JSON.parse(raw) as Partial<SavedState>;
    const drumIds = Object.keys(fallback.pattern) as (keyof Pattern)[];
    const laneIds = Object.keys(fallback.lanes) as (keyof Lanes)[];
    if (!s.pattern || !drumIds.every((id) => isBoolLane(s.pattern![id]))) return fallback;
    if (!s.lanes || !laneIds.every((id) => isDegLane(s.lanes![id]))) return fallback;
    return {
      pattern: Object.fromEntries(drumIds.map((id) => [id, s.pattern![id]])) as Pattern,
      lanes: Object.fromEntries(laneIds.map((id) => [id, s.lanes![id]])) as Lanes,
      bpm: typeof s.bpm === 'number' ? Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(s.bpm))) : fallback.bpm,
      swing: typeof s.swing === 'number' ? Math.min(62, Math.max(50, s.swing)) : fallback.swing,
      voices: clampVoices(s.voices),
    };
  } catch {
    return fallback;
  }
}

export function saveState(s: SavedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage full or unavailable — persistence is best-effort
  }
}

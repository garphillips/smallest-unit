import type { DrumId, LaneId } from '../types';

/** The two performance instruments — the XY pad drone and the piano keys. */
export type PerfId = 'pad' | 'keys';
export type VoiceId = DrumId | LaneId | PerfId;

/** How a param's raw number is rendered in the editor. */
export type ParamUnit = 'hz' | 'ms' | 'pct' | 'ratio' | 'plain' | 'cents';

export interface ParamSpec {
  readonly key: string;
  readonly label: string;
  readonly def: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: ParamUnit;
  /** Present => a discrete choice; the stored value is an index into this list. */
  readonly choices?: readonly string[];
}

/**
 * The editable surface of every voice. Each spec's `def` is the value the
 * original hardcoded recipe in voices.ts used, so a default settings object
 * reproduces the original sounds exactly. Gain-ish params are multipliers
 * (default 1) rather than absolutes, which keeps the mix constants visible in
 * the recipes themselves.
 */
export const VOICE_SPECS = {
  kick: [
    { key: 'tune', label: 'tune', def: 44, min: 28, max: 72, step: 1, unit: 'hz' },
    { key: 'punch', label: 'punch', def: 3.4, min: 1.4, max: 6, step: 0.05, unit: 'ratio' },
    { key: 'decay', label: 'decay', def: 0.3, min: 0.08, max: 0.9, step: 0.01, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  snare: [
    { key: 'tune', label: 'tune', def: 196, min: 110, max: 330, step: 1, unit: 'hz' },
    { key: 'snap', label: 'snap', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
    { key: 'tone', label: 'tone', def: 1, min: 0.5, max: 2, step: 0.02, unit: 'pct' },
    { key: 'decay', label: 'decay', def: 0.16, min: 0.05, max: 0.5, step: 0.005, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  rim: [
    { key: 'tune', label: 'tune', def: 1720, min: 700, max: 3200, step: 10, unit: 'hz' },
    { key: 'tone', label: 'tone', def: 6, min: 1, max: 14, step: 0.2, unit: 'plain' },
    { key: 'decay', label: 'decay', def: 0.045, min: 0.015, max: 0.2, step: 0.005, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  hat: [
    { key: 'tune', label: 'tune', def: 8200, min: 3500, max: 12000, step: 100, unit: 'hz' },
    { key: 'decay', label: 'decay', def: 0.045, min: 0.012, max: 0.2, step: 0.003, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  ohat: [
    { key: 'tune', label: 'tune', def: 7600, min: 3000, max: 11000, step: 100, unit: 'hz' },
    { key: 'decay', label: 'decay', def: 0.34, min: 0.08, max: 0.9, step: 0.01, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  bass: [
    { key: 'wave', label: 'wave', def: 0, min: 0, max: 1, step: 1, unit: 'plain', choices: ['saw', 'square'] },
    { key: 'cutoff', label: 'cutoff', def: 1400, min: 300, max: 4000, step: 20, unit: 'hz' },
    { key: 'decay', label: 'decay', def: 0.26, min: 0.08, max: 0.9, step: 0.01, unit: 'ms' },
    { key: 'sub', label: 'sub', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  synth: [
    { key: 'detune', label: 'detune', def: 11, min: 0, max: 40, step: 1, unit: 'cents' },
    { key: 'cutoff', label: 'cutoff', def: 3400, min: 800, max: 6500, step: 50, unit: 'hz' },
    { key: 'decay', label: 'decay', def: 0.18, min: 0.06, max: 0.9, step: 0.01, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  pad: [
    { key: 'drive', label: 'drive', def: 3.2, min: 1, max: 8, step: 0.1, unit: 'ratio' },
    { key: 'grit', label: 'grit', def: 55, min: 0, max: 100, step: 1, unit: 'plain' },
    { key: 'grain', label: 'grain', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
    { key: 'res', label: 'res', def: 2, min: 0.5, max: 12, step: 0.1, unit: 'plain' },
    { key: 'glide', label: 'glide', def: 0.04, min: 0.004, max: 0.3, step: 0.004, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
  keys: [
    { key: 'spread', label: 'spread', def: 14, min: 0, max: 40, step: 1, unit: 'cents' },
    { key: 'bright', label: 'bright', def: 5200, min: 1200, max: 8000, step: 50, unit: 'hz' },
    { key: 'res', label: 'res', def: 5, min: 0.5, max: 12, step: 0.1, unit: 'plain' },
    { key: 'attack', label: 'attack', def: 0.02, min: 0.002, max: 0.6, step: 0.002, unit: 'ms' },
    { key: 'release', label: 'release', def: 0.4, min: 0.05, max: 2, step: 0.05, unit: 'ms' },
    { key: 'level', label: 'level', def: 1, min: 0, max: 2, step: 0.02, unit: 'pct' },
  ],
} as const satisfies Record<VoiceId, readonly ParamSpec[]>;

export const VOICE_IDS = Object.keys(VOICE_SPECS) as VoiceId[];

type SpecOf<V extends VoiceId> = (typeof VOICE_SPECS)[V][number];
/** The param object for one voice, keyed by that voice's own param names. */
export type ParamsOf<V extends VoiceId> = Record<SpecOf<V>['key'], number>;
export type VoiceSettings = { [V in VoiceId]: ParamsOf<V> };

/** Loosely-typed view used by the generic plumbing (storage, editor, presets). */
export type AnyParams = Record<string, number>;

const specs = (id: VoiceId): readonly ParamSpec[] => VOICE_SPECS[id];

const clampSpec = (spec: ParamSpec, v: number) => {
  const c = Math.min(spec.max, Math.max(spec.min, v));
  return spec.choices ? Math.round(c) : c;
};

export function defaultVoices(): VoiceSettings {
  return Object.fromEntries(
    VOICE_IDS.map((id) => [id, Object.fromEntries(specs(id).map((s) => [s.key, s.def]))]),
  ) as VoiceSettings;
}

/**
 * Coerce anything (a stale localStorage blob, a partial preset) into a complete,
 * in-range settings object. Unknown keys are dropped; missing or non-finite
 * values fall back to the spec default.
 */
export function clampVoices(raw: unknown): VoiceSettings {
  const src = (raw ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    VOICE_IDS.map((id) => {
      const from = (src[id] ?? {}) as Record<string, unknown>;
      return [
        id,
        Object.fromEntries(
          specs(id).map((s) => {
            const v = from[s.key];
            return [s.key, typeof v === 'number' && Number.isFinite(v) ? clampSpec(s, v) : s.def];
          }),
        ),
      ];
    }),
  ) as VoiceSettings;
}

/** Named starting points — partials, resolved against the defaults on apply. */
export const VOICE_PRESETS: Record<VoiceId, readonly { name: string; values: AnyParams }[]> = {
  kick: [
    { name: 'classic', values: {} },
    { name: '808', values: { tune: 38, punch: 2.6, decay: 0.62 } },
    { name: 'thump', values: { tune: 52, punch: 4.2, decay: 0.18, level: 1.06 } },
    { name: 'click', values: { tune: 62, punch: 5.6, decay: 0.1, level: 0.9 } },
  ],
  snare: [
    { name: 'classic', values: {} },
    { name: 'clap', values: { tune: 240, snap: 1.3, tone: 1.24, decay: 0.24 } },
    { name: 'crack', values: { snap: 1.14, tone: 1.5, decay: 0.09 } },
    { name: 'body', values: { tune: 165, snap: 0.5, tone: 0.76, decay: 0.2 } },
  ],
  rim: [
    { name: 'classic', values: {} },
    { name: 'wood', values: { tune: 1180, tone: 9, decay: 0.06 } },
    { name: 'tick', values: { tune: 2400, tone: 10.4, decay: 0.025 } },
    { name: 'clave', values: { tune: 2100, tone: 4, decay: 0.08 } },
  ],
  hat: [
    { name: 'classic', values: {} },
    { name: 'tight', values: { tune: 10500, decay: 0.024 } },
    { name: 'dark', values: { tune: 5600, decay: 0.06 } },
    { name: 'sizzle', values: { tune: 7000, decay: 0.09, level: 0.86 } },
  ],
  ohat: [
    { name: 'classic', values: {} },
    { name: 'short', values: { tune: 8600, decay: 0.16 } },
    { name: 'long', values: { tune: 7000, decay: 0.62, level: 0.88 } },
    { name: 'dark', values: { tune: 4600, decay: 0.4 } },
  ],
  bass: [
    { name: 'classic', values: {} },
    { name: 'sub', values: { cutoff: 700, decay: 0.4, sub: 1.7 } },
    { name: 'acid', values: { wave: 1, cutoff: 3200, decay: 0.16, sub: 0.54 } },
    { name: 'pluck', values: { cutoff: 2000, decay: 0.12, sub: 0.7 } },
  ],
  synth: [
    { name: 'classic', values: {} },
    { name: 'wide', values: { detune: 26, cutoff: 2800, decay: 0.3 } },
    { name: 'glass', values: { detune: 4, cutoff: 5200, decay: 0.12 } },
    { name: 'pad', values: { detune: 18, cutoff: 2200, decay: 0.6, level: 0.9 } },
  ],
  pad: [
    { name: 'classic', values: {} },
    { name: 'clean', values: { drive: 1.4, grit: 8, grain: 0.3, res: 1.2, level: 1.2 } },
    { name: 'burn', values: { drive: 5.6, grit: 88, grain: 1.4, res: 3.5, level: 0.8 } },
    { name: 'glass', values: { drive: 2, grit: 20, grain: 0.2, res: 8, glide: 0.012 } },
  ],
  keys: [
    { name: 'classic', values: {} },
    { name: 'wide', values: { spread: 30, bright: 4200, res: 3.5, release: 0.7 } },
    { name: 'pluck', values: { spread: 8, bright: 6200, res: 6.5, attack: 0.004, release: 0.15 } },
    { name: 'soft', values: { spread: 18, bright: 2600, res: 2.2, attack: 0.14, release: 1.1 } },
  ],
};

export function resolvePreset(id: VoiceId, index: number): AnyParams {
  const preset = VOICE_PRESETS[id][index];
  const base = Object.fromEntries(specs(id).map((s) => [s.key, s.def]));
  return clampVoices({ [id]: { ...base, ...preset?.values } })[id];
}

/** Index of the preset the current params match exactly, or -1 once dialled away. */
export function activePreset(id: VoiceId, params: AnyParams): number {
  return VOICE_PRESETS[id].findIndex((_, i) => {
    const p = resolvePreset(id, i);
    return specs(id).every((s) => Math.abs(p[s.key] - params[s.key]) < 1e-6);
  });
}

export function formatParam(spec: ParamSpec, v: number): string {
  if (spec.choices) return spec.choices[Math.round(v)] ?? '';
  switch (spec.unit) {
    case 'hz':
      return v >= 1000 ? `${(v / 1000).toFixed(2)} khz` : `${Math.round(v)} hz`;
    case 'ms':
      return `${Math.round(v * 1000)} ms`;
    case 'pct':
      return `${Math.round(v * 100)}%`;
    case 'ratio':
      return `${v.toFixed(2)}x`;
    case 'cents':
      return `${Math.round(v)} ct`;
    default:
      return v.toFixed(1);
  }
}

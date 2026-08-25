import { describe, expect, it } from 'vitest';
import {
  VOICE_IDS,
  VOICE_PRESETS,
  VOICE_SPECS,
  activePreset,
  clampVoices,
  defaultVoices,
  formatParam,
  resolvePreset,
} from './params';

describe('voice specs', () => {
  it('has every default inside its own range', () => {
    for (const id of VOICE_IDS) {
      for (const spec of VOICE_SPECS[id]) {
        expect(spec.def, `${id}.${spec.key}`).toBeGreaterThanOrEqual(spec.min);
        expect(spec.def, `${id}.${spec.key}`).toBeLessThanOrEqual(spec.max);
      }
    }
  });

  it('keeps every decay above zero, since the envelopes ramp exponentially', () => {
    for (const id of VOICE_IDS) {
      const decay = VOICE_SPECS[id].find((s) => s.key === 'decay');
      if (decay) expect(decay.min, id).toBeGreaterThan(0);
    }
  });
});

describe('clampVoices', () => {
  it('fills a complete settings object from nothing', () => {
    expect(clampVoices(undefined)).toEqual(defaultVoices());
    expect(clampVoices({})).toEqual(defaultVoices());
    expect(clampVoices('nonsense')).toEqual(defaultVoices());
  });

  it('keeps in-range values and repairs the rest', () => {
    const v = clampVoices({ kick: { tune: 60, decay: 'loud', level: 99 }, junk: { x: 1 } });
    expect(v.kick.tune).toBe(60);
    expect(v.kick.decay).toBe(0.3);
    expect(v.kick.level).toBe(2);
    expect(Object.keys(v).sort()).toEqual([...VOICE_IDS].sort());
    expect('x' in v.kick).toBe(false);
  });

  it('rounds choice params to a valid index', () => {
    expect(clampVoices({ bass: { wave: 0.7 } }).bass.wave).toBe(1);
    expect(clampVoices({ bass: { wave: -5 } }).bass.wave).toBe(0);
  });
});

describe('presets', () => {
  it('resolves every preset to a complete, in-range param set', () => {
    for (const id of VOICE_IDS) {
      VOICE_PRESETS[id].forEach((preset, i) => {
        const p = resolvePreset(id, i);
        for (const spec of VOICE_SPECS[id]) {
          expect(p[spec.key], `${id}/${preset.name}.${spec.key}`).toBeGreaterThanOrEqual(spec.min);
          expect(p[spec.key], `${id}/${preset.name}.${spec.key}`).toBeLessThanOrEqual(spec.max);
        }
      });
    }
  });

  it('starts every voice on its first preset', () => {
    const v = defaultVoices();
    for (const id of VOICE_IDS) expect(activePreset(id, v[id]), id).toBe(0);
  });

  it('reports no active preset once a param is dialled away', () => {
    const v = defaultVoices();
    expect(activePreset('kick', { ...v.kick, tune: 51 })).toBe(-1);
  });
});

describe('formatParam', () => {
  const spec = (key: string, id: 'kick' | 'bass' = 'kick') =>
    VOICE_SPECS[id].find((s) => s.key === key)!;

  it('renders each unit in its own terms', () => {
    expect(formatParam(spec('tune'), 44)).toBe('44 hz');
    expect(formatParam(spec('decay'), 0.3)).toBe('300 ms');
    expect(formatParam(spec('level'), 1)).toBe('100%');
    expect(formatParam(spec('punch'), 3.4)).toBe('3.40x');
    expect(formatParam(spec('cutoff', 'bass'), 1400)).toBe('1.40 khz');
    expect(formatParam(spec('wave', 'bass'), 1)).toBe('square');
  });
});

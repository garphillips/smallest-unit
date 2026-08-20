import { describe, expect, it } from 'vitest';
import { MAX_STEPS, defaultPattern, melFill } from './patterns';

describe('melFill', () => {
  it('fills rise every 2 steps cycling 1..4', () => {
    const a = melFill('bass', 'rise');
    expect(a.slice(0, 8)).toEqual([1, 0, 2, 0, 3, 0, 4, 0]);
    expect(a).toHaveLength(MAX_STEPS);
  });

  it('offsets stabs by 2 with stride 4', () => {
    const a = melFill('synth', 'stabs');
    expect(a[0]).toBe(0);
    expect(a[2]).toBe(1);
    expect(a[6]).toBe(3);
    expect(a[10]).toBe(1);
    expect(a[14]).toBe(4);
  });

  it('keeps drift degrees in 0..4 and hits every group start', () => {
    const a = melFill('bass', 'drift');
    expect(a.every((v) => v >= 0 && v <= 4)).toBe(true);
    for (let i = 0; i < MAX_STEPS; i += 4) expect(a[i]).toBeGreaterThan(0);
  });

  it('returns silence for unknown shapes', () => {
    expect(melFill('bass', 'nope').every((v) => v === 0)).toBe(true);
  });
});

describe('defaultPattern', () => {
  it('places the snare on 4/12/20/28', () => {
    const p = defaultPattern();
    [4, 12, 20, 28].forEach((i) => expect(p.snare[i]).toBe(true));
    expect(p.snare.filter(Boolean)).toHaveLength(4);
  });
});

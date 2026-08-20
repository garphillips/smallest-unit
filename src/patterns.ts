import type { LaneId, Pattern } from './types';

export const MAX_STEPS = 32;

const mk = (ons: number[]) => {
  const a = new Array<boolean>(MAX_STEPS).fill(false);
  ons.forEach((i) => (a[i] = true));
  return a;
};

export const defaultPattern = (): Pattern => ({
  kick: mk([0, 4, 8, 12, 16, 20, 24, 28]),
  snare: mk([4, 12, 20, 28]),
  rim: mk([14, 30]),
  hat: mk([0, 4, 8, 12, 16, 20, 24, 28]),
  ohat: mk([2, 6, 10, 14, 18, 22, 26, 30]),
});

const SEQS: Record<string, number[]> = {
  rise: [1, 2, 3, 4],
  fall: [4, 3, 2, 1],
  bounce: [1, 4, 2, 3],
  stabs: [1, 3, 1, 4],
  answer: [4, 2, 3, 2],
  whole: [1, 3],
  half: [1, 4, 3, 2],
  swell: [4, 2],
};
const STEP: Record<string, number> = { rise: 2, fall: 2, bounce: 2, stabs: 4, answer: 8, whole: 16, half: 8, swell: 16 };
const OFF: Record<string, number> = { stabs: 2, answer: 6, swell: 8 };

/** Fill a pitched lane with a named shape. Degrees: 0 = off, 1..4 = root, b3, 5th, octave. */
export function melFill(id: LaneId | 'pad', shape: string): number[] {
  const a = new Array<number>(MAX_STEPS).fill(0);
  const R = () => 1 + Math.floor(Math.random() * 4);
  if (shape === 'drift') {
    if (id === 'pad') {
      for (let i = 0; i < MAX_STEPS; i += 8) a[i] = R();
    } else {
      const p = id === 'bass' ? 0.28 : 0.22;
      for (let i = 0; i < MAX_STEPS; i++) if (i % 4 === 0 || Math.random() < p) a[i] = R();
    }
    return a;
  }
  const seq = SEQS[shape];
  if (!seq) return a;
  const step = STEP[shape];
  const off = OFF[shape] || 0;
  for (let i = off, k = 0; i < MAX_STEPS; i += step, k++) a[i] = seq[k % seq.length];
  return a;
}

export const emptyLane = () => new Array<number>(MAX_STEPS).fill(0);

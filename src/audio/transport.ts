import type { Engine } from './engine';
import { playMel, playVoice } from './voices';
import type { DrumId, LaneId, Snapshot } from '../types';

const TICK_MS = 25;
const LOOKAHEAD_S = 0.12;

/**
 * Lookahead scheduler: a 25ms interval schedules audio up to 120ms ahead on the
 * audio clock; the current-step UI highlight is driven by setTimeout aligned to
 * the scheduled audio time (intentionally not the audio clock).
 */
export class Transport {
  private timer: number | null = null;
  private nextTime = 0;
  private nextStep = 0;
  private pausedStep: number | null = null;
  private uiTimeouts: number[] = [];

  constructor(
    private engine: Engine,
    private snapshot: () => Snapshot,
    private onStep: (step: number) => void,
  ) {}

  get playing(): boolean {
    return this.timer !== null;
  }

  start() {
    if (this.timer !== null) return;
    const ac = this.engine.ctx();
    this.engine.resume();
    this.nextStep = this.pausedStep ?? 0;
    this.nextTime = ac.currentTime + 0.06;
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  /** Pause remembers the step; the next start() resumes from it. */
  pause() {
    this.pausedStep = this.nextStep;
    this.stop();
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.uiTimeouts.forEach(clearTimeout);
    this.uiTimeouts = [];
  }

  /** Stop and rewind — the next start() begins from step 0 rather than resuming. */
  stopAndReset() {
    this.stop();
    this.pausedStep = null;
    this.nextStep = 0;
  }

  private schedule() {
    const ac = this.engine.ctx();
    const E = this.engine.env();
    while (this.nextTime < ac.currentTime + LOOKAHEAD_S) {
      const s = this.snapshot();
      const step = this.nextStep;
      const dur = 60 / s.bpm / 4;
      const swingOff = step % 2 === 1 ? ((s.swing - 50) / 100) * 2 * dur : 0;
      const t = this.nextTime + swingOff;
      (Object.keys(s.pattern) as DrumId[]).forEach((id) => {
        if (s.pattern[id][step]) playVoice(E, id, t);
      });
      (['bass', 'synth'] as LaneId[]).forEach((id) => {
        const deg = s.lanes[id][step];
        if (deg) playMel(E, id, deg, t, s.bassWave);
      });
      const delay = Math.max(0, (t - ac.currentTime) * 1000);
      this.uiTimeouts.push(
        window.setTimeout(() => {
          if (this.playing) this.onStep(step);
        }, delay),
      );
      if (this.uiTimeouts.length > 64) this.uiTimeouts.splice(0, 32);
      this.nextTime += dur;
      this.nextStep = (step + 1) % s.steps;
    }
  }
}

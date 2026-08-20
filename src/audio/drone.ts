import type { Engine } from './engine';

interface DroneNodes {
  g: GainNode;
  lp: BiquadFilterNode;
  oscs: { o: OscillatorNode; semi: number }[];
}

/**
 * XY pad drone: three detuned triangle oscillators through a lowpass.
 * Y picks a pitch quantized to the same A-minor degrees as the lanes
 * (root, b3, 5th across two octaves); X sweeps timbre 200..4000 Hz.
 */
export class PadDrone {
  private nodes: DroneNodes | null = null;

  constructor(private engine: Engine) {}

  start(x: number, y: number) {
    const ac = this.engine.ctx();
    this.engine.resume();
    const t = ac.currentTime;
    this.stop(true);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.17, t + 0.15);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.connect(g);
    g.connect(this.engine.master);
    this.nodes = {
      g,
      lp,
      oscs: (
        [
          [0, -6],
          [7, 6],
          [12, 0],
        ] as const
      ).map(([semi, det]) => {
        const o = ac.createOscillator();
        o.type = 'triangle';
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        return { o, semi };
      }),
    };
    this.update(x, y, true);
  }

  update(x: number, y: number, snap: boolean) {
    if (!this.nodes) return;
    const ac = this.engine.ctx();
    const t = ac.currentTime;
    const degs = [0, 3, 7, 12, 15, 19];
    const f0 = 110 * Math.pow(2, degs[Math.min(degs.length - 1, Math.floor((1 - y) * degs.length))] / 12);
    const cut = 200 * Math.pow(20, x); // X: timbre, 200..4000
    this.nodes.oscs.forEach(({ o, semi }) => {
      const f = f0 * Math.pow(2, semi / 12);
      if (snap) o.frequency.setValueAtTime(f, t);
      else o.frequency.setTargetAtTime(f, t, 0.04);
    });
    if (snap) this.nodes.lp.frequency.setValueAtTime(cut, t);
    else this.nodes.lp.frequency.setTargetAtTime(cut, t, 0.04);
  }

  stop(hard: boolean) {
    if (!this.nodes) return;
    const { g, oscs } = this.nodes;
    const t = this.engine.ctx().currentTime;
    if (hard) {
      oscs.forEach(({ o }) => o.stop(t));
    } else {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      oscs.forEach(({ o }) => o.stop(t + 0.5));
    }
    this.nodes = null;
  }
}

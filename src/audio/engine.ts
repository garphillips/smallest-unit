/** Shared handle passed to every voice — works for both live and offline contexts. */
export interface AudioEnv {
  ac: BaseAudioContext;
  master: GainNode;
  noiseBuf: AudioBuffer;
}

export function makeNoiseBuffer(ac: BaseAudioContext): AudioBuffer {
  const len = ac.sampleRate * 1;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Lazily-created live AudioContext with a master gain and shared noise buffer.
 * Nothing is constructed until the first user gesture calls ctx().
 */
export class Engine {
  private ac: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  ctx(): AudioContext {
    if (!this.ac) {
      this.ac = new AudioContext();
      this.masterGain = this.ac.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ac.destination);
      this.noiseBuf = makeNoiseBuffer(this.ac);
    }
    return this.ac;
  }

  get master(): GainNode {
    this.ctx();
    return this.masterGain!;
  }

  env(): AudioEnv {
    const ac = this.ctx();
    return { ac, master: this.masterGain!, noiseBuf: this.noiseBuf! };
  }

  resume() {
    const ac = this.ctx();
    if (ac.state === 'suspended') void ac.resume();
  }

  get sampleRate(): number {
    return this.ctx().sampleRate;
  }
}

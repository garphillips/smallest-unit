import type { Engine } from './engine';
import { encodeWav } from './wav';

// AudioWorklet processor that forwards its stereo input to the main thread.
// Replaces the deprecated ScriptProcessorNode from the prototype.
const WORKLET_SRC = `
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input.length && input[0] && input[0].length) {
      const ch0 = new Float32Array(input[0]);
      const ch1 = input[1] ? new Float32Array(input[1]) : new Float32Array(input[0]);
      this.port.postMessage({ ch0, ch1 }, [ch0.buffer, ch1.buffer]);
    }
    return true;
  }
}
registerProcessor('smallest-unit-capture', CaptureProcessor);
`;

const loadedContexts = new WeakSet<BaseAudioContext>();

async function ensureWorklet(ac: AudioContext) {
  if (loadedContexts.has(ac)) return;
  const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'text/javascript' }));
  try {
    await ac.audioWorklet.addModule(url);
    loadedContexts.add(ac);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Captures the master bus to 16-bit stereo WAV via an AudioWorklet tap. */
export class Recorder {
  private node: AudioWorkletNode | null = null;
  private chunks: [Float32Array[], Float32Array[]] = [[], []];
  private length = 0;

  get active(): boolean {
    return this.node !== null;
  }

  async start(engine: Engine) {
    if (this.node) return;
    const ac = engine.ctx();
    engine.resume();
    await ensureWorklet(ac);
    this.chunks = [[], []];
    this.length = 0;
    const node = new AudioWorkletNode(ac, 'smallest-unit-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 2,
      channelCountMode: 'explicit',
    });
    node.port.onmessage = (e: MessageEvent<{ ch0: Float32Array; ch1: Float32Array }>) => {
      this.chunks[0].push(e.data.ch0);
      this.chunks[1].push(e.data.ch1);
      this.length += e.data.ch0.length;
    };
    engine.master.connect(node);
    this.node = node;
  }

  /** Stop capturing and return the recording, or null if nothing was captured. */
  stop(engine: Engine): Blob | null {
    if (!this.node) return null;
    this.node.port.onmessage = null;
    try {
      engine.master.disconnect(this.node);
    } catch {
      // already disconnected
    }
    this.node.disconnect();
    this.node = null;
    if (!this.length) return null;
    const chans = this.chunks.map((list) => {
      const a = new Float32Array(this.length);
      let o = 0;
      list.forEach((b) => {
        a.set(b, o);
        o += b.length;
      });
      return a;
    });
    this.chunks = [[], []];
    this.length = 0;
    return encodeWav(chans, engine.sampleRate);
  }
}

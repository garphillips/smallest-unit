import { makeNoiseBuffer, type AudioEnv } from './engine';
import { playMel, playVoice } from './voices';
import { encodeWavBuffer } from './wav';
import { makeZip, type ZipEntry } from './zip';
import { TRACK_DEFS } from '../config';
import type { LaneId, Snapshot } from '../types';

const RATE = 44100;

/**
 * Render each non-empty lane to its own WAV via OfflineAudioContext and bundle
 * them into a zip. Returns null when every lane is empty.
 */
export async function renderStems(s: Snapshot): Promise<Blob | null> {
  const dur = 60 / s.bpm / 4;
  const stems: { id: string; drum: boolean }[] = [
    ...TRACK_DEFS.map((td) => ({ id: td.id as string, drum: true })),
    { id: 'bass', drum: false },
    { id: 'synth', drum: false },
  ];
  const files: ZipEntry[] = [];
  for (const stem of stems) {
    const lane = stem.drum
      ? s.pattern[stem.id as keyof typeof s.pattern]
      : s.lanes[stem.id as LaneId];
    if (!lane.slice(0, s.steps).some((v) => v)) continue;
    const off = new OfflineAudioContext(2, Math.ceil((s.steps * dur + 0.8) * RATE), RATE);
    const master = off.createGain();
    master.gain.value = 0.8;
    master.connect(off.destination);
    const E: AudioEnv = { ac: off, master, noiseBuf: makeNoiseBuffer(off) };
    for (let i = 0; i < s.steps; i++) {
      if (!lane[i]) continue;
      const sw = i % 2 === 1 ? ((s.swing - 50) / 100) * 2 * dur : 0;
      const t = 0.05 + i * dur + sw;
      if (stem.drum) playVoice(E, stem.id as keyof typeof s.pattern, t, s.voices);
      else playMel(E, stem.id as LaneId, lane[i] as number, t, s.voices);
    }
    const buf = await off.startRendering();
    const wav = encodeWavBuffer([buf.getChannelData(0), buf.getChannelData(1)], RATE);
    files.push({ name: `stem-${stem.id}-${s.bpm}bpm.wav`, data: new Uint8Array(wav) });
  }
  return files.length ? makeZip(files) : null;
}

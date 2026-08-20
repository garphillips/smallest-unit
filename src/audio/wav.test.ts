import { describe, expect, it } from 'vitest';
import { encodeWavBuffer } from './wav';

describe('encodeWavBuffer', () => {
  it('writes a valid 16-bit stereo PCM header', () => {
    const n = 100;
    const rate = 44100;
    const buf = encodeWavBuffer([new Float32Array(n), new Float32Array(n)], rate);
    const v = new DataView(buf);
    const tag = (o: number, len: number) =>
      Array.from({ length: len }, (_, i) => String.fromCharCode(v.getUint8(o + i))).join('');
    expect(buf.byteLength).toBe(44 + n * 2 * 2);
    expect(tag(0, 4)).toBe('RIFF');
    expect(tag(8, 4)).toBe('WAVE');
    expect(v.getUint32(4, true)).toBe(36 + n * 2 * 2);
    expect(v.getUint16(20, true)).toBe(1); // PCM
    expect(v.getUint16(22, true)).toBe(2); // stereo
    expect(v.getUint32(24, true)).toBe(rate);
    expect(v.getUint16(34, true)).toBe(16); // bit depth
    expect(v.getUint32(40, true)).toBe(n * 2 * 2);
  });

  it('clamps and scales samples', () => {
    const buf = encodeWavBuffer([new Float32Array([1, -1, 2, -2, 0])], 44100);
    const v = new DataView(buf);
    expect(v.getInt16(44, true)).toBe(32767);
    expect(v.getInt16(46, true)).toBe(-32768);
    expect(v.getInt16(48, true)).toBe(32767);
    expect(v.getInt16(50, true)).toBe(-32768);
    expect(v.getInt16(52, true)).toBe(0);
  });
});

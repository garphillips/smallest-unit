import { describe, expect, it } from 'vitest';
import { crc32, makeZip } from './zip';

describe('crc32', () => {
  it('matches the reference value for "123456789"', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('makeZip', () => {
  it('produces local header, central directory, and end record', async () => {
    const data = new TextEncoder().encode('hello');
    const blob = makeZip([{ name: 'a.txt', data }]);
    const v = new DataView(await blob.arrayBuffer());
    expect(v.getUint32(0, true)).toBe(0x04034b50); // local file header
    const localSize = 30 + 5 + data.length;
    expect(v.getUint32(localSize, true)).toBe(0x02014b50); // central directory
    expect(v.getUint32(v.byteLength - 22, true)).toBe(0x06054b50); // end of central dir
    expect(v.getUint16(v.byteLength - 22 + 8, true)).toBe(1); // entry count
  });
});

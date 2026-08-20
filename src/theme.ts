export const BG = '#1C1217';
export const TEXT = '#F2E2FF';
export const RED = '#E5484D';

/** Alpha tint of the base text color #F2E2FF. */
export const tint = (a: number) => `rgba(242,226,255,${a})`;

export function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)) as [number, number, number];
}

/** Alpha tint of an arbitrary accent hex. */
export const alpha = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

export const EASE = 'cubic-bezier(0.4,0,0.2,1)';
export const TRANSITION = `background 120ms ${EASE}, border-color 120ms ${EASE}`;

export const wowmeta = (size: number, lh: number | string = 1) =>
  `400 ${size}px/${lh} 'Wowmeta', monospace`;

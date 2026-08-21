import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { tint, wowmeta } from '../theme';
import { KeySynth } from '../audio/keySynth';
import type { Engine } from '../audio/engine';

interface Props {
  engine: Engine;
}

const WHITE_KEYS = [
  { name: 'c', semi: 0 },
  { name: 'd', semi: 2 },
  { name: 'e', semi: 4 },
  { name: 'f', semi: 5 },
  { name: 'g', semi: 7 },
  { name: 'a', semi: 9 },
  { name: 'b', semi: 11 },
];

const BLACK_KEYS = [
  { name: 'c#', semi: 1, whiteIndex: 0 },
  { name: 'd#', semi: 3, whiteIndex: 1 },
  { name: 'f#', semi: 6, whiteIndex: 3 },
  { name: 'g#', semi: 8, whiteIndex: 4 },
  { name: 'a#', semi: 10, whiteIndex: 5 },
];

export function PianoKeys({ engine }: Props) {
  const synthRef = useRef<KeySynth | null>(null);
  if (!synthRef.current) synthRef.current = new KeySynth(engine);
  const synth = synthRef.current;

  const [heldKey, setHeldKey] = useState(-1);

  useEffect(() => () => synth.releaseAll(), [synth]);

  const onDown = (semi: number) => (e: ReactPointerEvent) => {
    e.preventDefault();
    synth.press(semi);
    setHeldKey(semi);
  };

  const onUp = (semi: number) => () => {
    synth.release(semi);
    setHeldKey((h) => (h === semi ? -1 : h));
  };

  return (
    <div style={{ position: 'relative', height: 220, touchAction: 'none' }}>
      <div style={{ display: 'flex', gap: 4, height: '100%' }}>
        {WHITE_KEYS.map((k) => (
          <button
            key={k.name}
            className={heldKey === k.semi ? 'white-key held' : 'white-key'}
            onPointerDown={onDown(k.semi)}
            onPointerUp={onUp(k.semi)}
            onPointerLeave={onUp(k.semi)}
            aria-label={`key ${k.name}`}
          >
            <span style={{ font: wowmeta(11), letterSpacing: '0.08em', textTransform: 'uppercase', color: tint(0.42) }}>
              {k.name}
            </span>
          </button>
        ))}
      </div>
      {BLACK_KEYS.map((k) => (
        <button
          key={k.name}
          className={heldKey === k.semi ? 'black-key held' : 'black-key'}
          onPointerDown={onDown(k.semi)}
          onPointerUp={onUp(k.semi)}
          onPointerLeave={onUp(k.semi)}
          aria-label={`key ${k.name}`}
          style={{ left: `${((k.whiteIndex + 1) * 100) / 7}%`, transform: 'translateX(-50%)' }}
        />
      ))}
    </div>
  );
}

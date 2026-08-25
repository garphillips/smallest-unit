import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { voiceLabel } from '../config';
import { tint, wowmeta } from '../theme';
import { KeySynth } from '../audio/keySynth';
import type { Engine } from '../audio/engine';
import type { ParamsOf, VoiceId } from '../audio/params';

interface Props {
  engine: Engine;
  params: ParamsOf<'keys'>;
  onEditVoice: (id: VoiceId) => void;
}

// Bottom row types the naturals (c d e f g a b); the row above sits each
// sharp/flat above the gap between the two naturals it falls between —
// e.g. s (above the z/x gap) plays c#, matching how the keys sit on a
// physical keyboard.
const WHITE_KEYS = [
  { name: 'c', semi: 0, key: 'z' },
  { name: 'd', semi: 2, key: 'x' },
  { name: 'e', semi: 4, key: 'c' },
  { name: 'f', semi: 5, key: 'v' },
  { name: 'g', semi: 7, key: 'b' },
  { name: 'a', semi: 9, key: 'n' },
  { name: 'b', semi: 11, key: 'm' },
];

const BLACK_KEYS = [
  { name: 'c#', semi: 1, whiteIndex: 0, key: 's' },
  { name: 'd#', semi: 3, whiteIndex: 1, key: 'd' },
  { name: 'f#', semi: 6, whiteIndex: 3, key: 'g' },
  { name: 'g#', semi: 8, whiteIndex: 4, key: 'h' },
  { name: 'a#', semi: 10, whiteIndex: 5, key: 'j' },
];

const KEY_MAP: Record<string, number> = Object.fromEntries(
  [...WHITE_KEYS, ...BLACK_KEYS].map((k) => [k.key, k.semi]),
);

export function PianoKeys({ engine, params, onEditVoice }: Props) {
  const synthRef = useRef<KeySynth | null>(null);
  if (!synthRef.current) synthRef.current = new KeySynth(engine);
  const synth = synthRef.current;

  const [heldKeys, setHeldKeys] = useState<Set<number>>(() => new Set());

  // The window key listeners below are bound once, so they read the live params
  // through a ref rather than capturing the first render's props.
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const markHeld = (semi: number) =>
    setHeldKeys((prev) => {
      const next = new Set(prev);
      next.add(semi);
      return next;
    });
  const markReleased = (semi: number) =>
    setHeldKeys((prev) => {
      if (!prev.has(semi)) return prev;
      const next = new Set(prev);
      next.delete(semi);
      return next;
    });

  useEffect(() => () => synth.releaseAll(), [synth]);

  useEffect(() => {
    const isTyping = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    const down = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const semi = KEY_MAP[key];
      if (semi === undefined || e.repeat || down.has(key) || isTyping()) return;
      down.add(key);
      synth.press(semi, paramsRef.current);
      markHeld(semi);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const semi = KEY_MAP[key];
      if (semi === undefined) return;
      down.delete(key);
      synth.release(semi);
      markReleased(semi);
    };
    const onBlur = () => {
      down.forEach((key) => synth.release(KEY_MAP[key]));
      down.clear();
      setHeldKeys(new Set());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [synth]);

  const onDown = (semi: number) => (e: ReactPointerEvent) => {
    e.preventDefault();
    synth.press(semi, paramsRef.current);
    markHeld(semi);
  };

  const onUp = (semi: number) => () => {
    synth.release(semi);
    markReleased(semi);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        className="lane-label-btn"
        onClick={() => onEditVoice('keys')}
        title="edit keys sound"
        style={{
          alignSelf: 'flex-start',
          font: wowmeta(12, 1.4),
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tint(0.64),
        }}
      >
        {voiceLabel('keys')}
      </button>
      <div style={{ position: 'relative', height: 220, touchAction: 'none' }}>
      <div style={{ display: 'flex', gap: 4, height: '100%' }}>
        {WHITE_KEYS.map((k) => (
          <button
            key={k.name}
            className={heldKeys.has(k.semi) ? 'white-key held' : 'white-key'}
            onPointerDown={onDown(k.semi)}
            onPointerUp={onUp(k.semi)}
            onPointerLeave={onUp(k.semi)}
            aria-label={`key ${k.name}`}
          >
            <span style={{ font: wowmeta(11), letterSpacing: '0.08em', textTransform: 'uppercase', color: tint(0.42) }}>
              {k.name} ({k.key})
            </span>
          </button>
        ))}
      </div>
      {BLACK_KEYS.map((k) => (
        <button
          key={k.name}
          className={heldKeys.has(k.semi) ? 'black-key held' : 'black-key'}
          onPointerDown={onDown(k.semi)}
          onPointerUp={onUp(k.semi)}
          onPointerLeave={onUp(k.semi)}
          aria-label={`key ${k.name}`}
          style={{ left: `${((k.whiteIndex + 1) * 100) / 7}%`, transform: 'translateX(-50%)' }}
        />
      ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { BPM_MAX, BPM_MIN } from '../config';
import { OFFWHITE, offTint } from '../theme';

interface Props {
  bpm: number;
  onChange: (bpm: number) => void;
}

const clamp = (n: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, n));

export function BpmControl({ bpm, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) onChange(clamp(n));
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <button className="stepper-btn" onClick={() => onChange(clamp(bpm + 2))} aria-label="bpm up">
            <CaretUp size={27} weight="fill" />
          </button>
          <button className="stepper-btn" onClick={() => onChange(clamp(bpm - 2))} aria-label="bpm down">
            <CaretDown size={27} weight="fill" />
          </button>
        </div>
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              else if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
            inputMode="numeric"
            aria-label="bpm"
            style={{
              font: "900 64px/0.9 'North East', Georgia, serif",
              minWidth: 118,
              width: 118,
              height: 64,
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
              background: 'transparent',
              color: OFFWHITE,
              border: 'none',
              borderBottom: `1px solid ${offTint(0.32)}`,
              outline: 'none',
              padding: 0,
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            onClick={() => {
              setDraft(String(bpm));
              setEditing(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              minWidth: 118,
              height: 64,
              justifyContent: 'center',
              cursor: 'text',
              borderBottom: '1px solid transparent',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ font: "900 64px/0.9 'North East', Georgia, serif", fontVariantNumeric: 'tabular-nums', color: OFFWHITE }}>
              {String(bpm).padStart(3, '0')}
            </span>
            <span
              style={{
                font: "400 14px/1 'Wowmeta', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: offTint(0.42),
              }}
            >
              bpm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

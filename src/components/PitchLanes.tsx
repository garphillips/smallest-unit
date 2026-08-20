import { useState, type CSSProperties } from 'react';
import { Eraser, Shuffle } from '@phosphor-icons/react';
import { ACCENTS, LANE_DEFS, STEPS } from '../config';
import { alpha, hexToRgb, wowmeta } from '../theme';
import { emptyLane, melFill } from '../patterns';
import type { LaneDef, LaneId, Lanes } from '../types';

interface Props {
  lanes: Lanes;
  currentStep: number;
  onCycle: (id: LaneId, i: number) => void;
  onSetLane: (id: LaneId, values: number[]) => void;
}

const DEG_NAMES = ['root', 'b3', '5th', 'oct'];
const groupStart = (i: number) => i % 4 === 0 && i > 0;

export function PitchLanes({ lanes, currentStep, onCycle, onSetLane }: Props) {
  const [shuffleIdx, setShuffleIdx] = useState<Record<LaneId, number>>({ bass: 0, synth: 0 });

  const shuffle = (def: LaneDef) => {
    const idx = shuffleIdx[def.id] % def.shapes.length;
    onSetLane(def.id, melFill(def.id, def.shapes[idx]));
    setShuffleIdx((s) => ({ ...s, [def.id]: idx + 1 }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {LANE_DEFS.map((def) => {
        const hex = ACCENTS[def.id];
        const acc = hexToRgb(hex).join(',');
        const rowStyle = { '--acc': acc } as CSSProperties;
        return (
          <div key={def.id} style={{ display: 'flex', flexDirection: 'column', gap: 0, ...rowStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="lane-col">
                <div style={{ font: wowmeta(12, 1.4), letterSpacing: '0.08em', textTransform: 'uppercase', color: alpha(hex, 0.64) }}>
                  {def.id}
                </div>
              </div>
              {Array.from({ length: STEPS }, (_, i) => {
                const deg = lanes[def.id][i];
                const ph = currentStep === i;
                const cls = ['mel-cell', ph ? 'current' : '', groupStart(i) ? 'group-start' : ''].filter(Boolean).join(' ');
                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => onCycle(def.id, i)}
                    title={deg ? `${DEG_NAMES[deg - 1]} · click to cycle` : 'click to cycle'}
                    aria-label={`${def.id} step ${i + 1}`}
                  >
                    {deg > 0 && (
                      <div
                        style={{
                          width: '100%',
                          height: `${deg * 25}%`,
                          background: ph ? alpha(hex, 0.78) : hex,
                          borderRadius: '2px 2px 0 0',
                          transition:
                            'height 120ms cubic-bezier(0.4,0,0.2,1), background 120ms cubic-bezier(0.4,0,0.2,1)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="lane-col" style={{ display: 'flex', gap: 8 }}>
                <button className="lane-icon-btn" onClick={() => shuffle(def)} title="shuffle" aria-label={`shuffle ${def.id}`}>
                  <Shuffle size={15} weight="bold" />
                </button>
                <button className="lane-icon-btn" onClick={() => onSetLane(def.id, emptyLane())} title="clear" aria-label={`clear ${def.id}`}>
                  <Eraser size={15} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { SHOW_STEP_NUMBERS, STEPS, TRACK_DEFS } from '../config';
import { TEXT, tint, wowmeta } from '../theme';
import type { DrumId, Pattern } from '../types';

interface Props {
  pattern: Pattern;
  currentStep: number;
  onToggle: (id: DrumId, i: number) => void;
}

const groupStart = (i: number) => i % 4 === 0 && i > 0;

export function StepGrid({ pattern, currentStep, onToggle }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {SHOW_STEP_NUMBERS && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div className="lane-col" />
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className={groupStart(i) ? 'group-start' : undefined}
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'center',
                font: wowmeta(11, 1.4),
                letterSpacing: '0.08em',
                color: currentStep === i ? TEXT : i % 4 === 0 ? tint(0.42) : tint(0.28),
              }}
            >
              {i % 4 === 0 ? String(i + 1).padStart(2, '0') : ''}
            </div>
          ))}
        </div>
      )}
      {TRACK_DEFS.map((td) => (
        <div key={td.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="lane-col" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ font: wowmeta(12, 1.4), letterSpacing: '0.08em', textTransform: 'uppercase', color: tint(0.64) }}>
              {td.name}
            </div>
          </div>
          {Array.from({ length: STEPS }, (_, i) => {
            const cls = [
              'step-cell',
              pattern[td.id][i] ? 'on' : '',
              currentStep === i ? 'current' : '',
              groupStart(i) ? 'group-start' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={i}
                className={cls}
                onClick={() => onToggle(td.id, i)}
                aria-label={`${td.name} step ${i + 1}`}
                aria-pressed={pattern[td.id][i]}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

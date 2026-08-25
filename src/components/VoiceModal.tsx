import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import {
  VOICE_PRESETS,
  VOICE_SPECS,
  activePreset,
  formatParam,
  resolvePreset,
  type AnyParams,
  type ParamSpec,
  type VoiceId,
} from '../audio/params';
import { alpha, hexToRgb, wowmeta } from '../theme';

interface Props {
  id: VoiceId;
  name: string;
  /** Accent hex — the pitched lanes' own color, lilac for the drums. */
  accent: string;
  params: AnyParams;
  onChange: (next: AnyParams) => void;
  /** Play the voice with the params passed, so the edit is audible immediately. */
  onAudition: (next: AnyParams) => void;
  onClose: () => void;
}

/** Minimum gap between auditions while a slider is being dragged. */
const AUDITION_MS = 180;

export function VoiceModal({ id, name, accent, params, onChange, onAudition, onClose }: Props) {
  const specs: readonly ParamSpec[] = VOICE_SPECS[id];
  const presets = VOICE_PRESETS[id];
  const active = activePreset(id, params);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastAudition = useRef(0);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    panelRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  /** Commit a change, and audition it — throttled during a drag, always on release. */
  const commit = (next: AnyParams, force: boolean) => {
    onChange(next);
    const now = performance.now();
    if (force || now - lastAudition.current > AUDITION_MS) {
      lastAudition.current = now;
      onAudition(next);
    }
  };

  const setParam = (spec: ParamSpec, raw: number, force: boolean) =>
    commit({ ...params, [spec.key]: Math.min(spec.max, Math.max(spec.min, raw)) }, force);

  const acc = hexToRgb(accent).join(',');

  return (
    <div
      className="vp-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="vp-panel"
        style={{ '--acc': acc } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={`${name} sound`}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className="vp-head">
          <div>
            <div style={{ font: "900 26px/1 'North East', Georgia, serif", textTransform: 'uppercase', color: accent }}>
              {name}
            </div>
            <div
              style={{
                font: wowmeta(10, 1.4),
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: alpha(accent, 0.42),
                marginTop: 6,
              }}
            >
              sound
            </div>
          </div>
          <button className="vp-close" onClick={onClose} aria-label="close">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="vp-presets">
          {presets.map((preset, i) => (
            <button
              key={preset.name}
              className={i === active ? 'vp-chip on' : 'vp-chip'}
              aria-pressed={i === active}
              onClick={() => commit(resolvePreset(id, i), true)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="vp-rows">
          {specs.map((spec) => (
            <div key={spec.key} className="vp-row">
              <div className="vp-row-head">
                <span className="vp-key">{spec.label}</span>
                {!spec.choices && <span className="vp-val">{formatParam(spec, params[spec.key])}</span>}
              </div>
              {spec.choices ? (
                <div className="vp-choices">
                  {spec.choices.map((choice, i) => (
                    <button
                      key={choice}
                      className={params[spec.key] === i ? 'vp-chip on' : 'vp-chip'}
                      aria-pressed={params[spec.key] === i}
                      onClick={() => setParam(spec, i, true)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="range"
                  className="vp-slider"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={params[spec.key]}
                  aria-label={`${name} ${spec.label}`}
                  aria-valuetext={formatParam(spec, params[spec.key])}
                  onChange={(e) => setParam(spec, Number(e.target.value), false)}
                  onPointerUp={() => onAudition(params)}
                  onKeyUp={() => onAudition(params)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="vp-foot">
          <button className="vp-chip" onClick={() => commit(resolvePreset(id, 0), true)}>
            reset
          </button>
        </div>
      </div>
    </div>
  );
}

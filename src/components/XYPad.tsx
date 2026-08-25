import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ACCENTS, voiceLabel } from '../config';
import { alpha, wowmeta } from '../theme';
import { PadDrone } from '../audio/drone';
import type { Engine } from '../audio/engine';
import type { ParamsOf, VoiceId } from '../audio/params';

interface Props {
  engine: Engine;
  params: ParamsOf<'pad'>;
  onEditVoice: (id: VoiceId) => void;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

const HEX = ACCENTS.pad;
const pFn = (a: number) => alpha(HEX, a);

const TRAIL_SPACING = 0.008;
const TRAIL_MAX = 40;
const TRAIL_LIFE_MS = 500;

function xyPos(e: ReactPointerEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
  };
}

export function XYPad({ engine, params, onEditVoice }: Props) {
  const droneRef = useRef<PadDrone | null>(null);
  if (!droneRef.current) droneRef.current = new PadDrone(engine);
  const drone = droneRef.current;

  const [xy, setXy] = useState({ x: 0.5, y: 0.5 });
  const [held, setHeld] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const pruneTimer = useRef<number | null>(null);

  const startPrune = () => {
    if (pruneTimer.current === null) {
      pruneTimer.current = window.setInterval(() => {
        const now = Date.now();
        setTrail((tr) => tr.filter((p) => now - p.t < TRAIL_LIFE_MS));
      }, 30);
    }
  };

  useEffect(() => {
    if (!held && !trail.length && pruneTimer.current !== null) {
      clearInterval(pruneTimer.current);
      pruneTimer.current = null;
    }
  }, [held, trail.length]);

  useEffect(
    () => () => {
      drone.stop(true);
      if (pruneTimer.current !== null) clearInterval(pruneTimer.current);
      pruneTimer.current = null;
    },
    [drone],
  );

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = xyPos(e);
    drone.start(p.x, p.y, params);
    startPrune();
    setXy(p);
    setHeld(true);
    setTrail([]);
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!held) return;
    const p = xyPos(e);
    drone.update(p.x, p.y, false);
    setXy(p);
    setTrail((tr) => {
      const last = tr[tr.length - 1];
      const now = Date.now();
      if (!last) return [...tr, { x: p.x, y: p.y, t: now }].slice(-TRAIL_MAX);
      const dist = Math.hypot(p.x - last.x, p.y - last.y);
      if (dist < TRAIL_SPACING) return tr;
      // Interpolate between the last point and this one so fast drags stay
      // dense — the goo filter needs overlapping dots to fuse smoothly.
      const steps = Math.min(8, Math.ceil(dist / TRAIL_SPACING));
      const added: TrailPoint[] = [];
      for (let s = 1; s <= steps; s++) {
        const f = s / steps;
        added.push({ x: last.x + (p.x - last.x) * f, y: last.y + (p.y - last.y) * f, t: now });
      }
      return [...tr, ...added].slice(-TRAIL_MAX);
    });
  };

  const onUp = () => {
    drone.stop(false);
    setHeld(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        className="lane-label-btn"
        onClick={() => onEditVoice('pad')}
        title="edit xy pad sound"
        style={{
          alignSelf: 'flex-start',
          font: wowmeta(12, 1.4),
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: pFn(0.64),
        }}
      >
        {voiceLabel('pad')}
      </button>
      <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        height: 220,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        border: `1px solid ${pFn(held ? 0.36 : 0.18)}`,
        background: held ? pFn(0.04) : 'transparent',
        touchAction: 'none',
        cursor: 'crosshair',
        transition: 'background 120ms cubic-bezier(0.4,0,0.2,1), border-color 120ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="xy-pad-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
          </filter>
        </defs>
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: pFn(0.08), pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: pFn(0.08), pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, filter: 'url(#xy-pad-goo)', pointerEvents: 'none' }}>
        {trail.map((p, idx) => {
          const age = (Date.now() - p.t) / TRAIL_LIFE_MS;
          const k = Math.max(0, 1 - age);
          const sz = (10 + 32 * k * k).toFixed(1);
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                width: `${sz}px`,
                height: `${sz}px`,
                borderRadius: 999,
                left: `${(p.x * 100).toFixed(2)}%`,
                top: `${(p.y * 100).toFixed(2)}%`,
                transform: 'translate(-50%,-50%)',
                background: pFn(Math.min(1, 0.9 * k)),
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          width: 42,
          height: 42,
          borderRadius: 999,
          left: `${(xy.x * 100).toFixed(2)}%`,
          top: `${(xy.y * 100).toFixed(2)}%`,
          transform: 'translate(-50%,-50%)',
          background: held ? HEX : pFn(0.42),
          pointerEvents: 'none',
          transition: 'background 120ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      </div>
    </div>
  );
}

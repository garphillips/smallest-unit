import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ACCENTS } from '../config';
import { alpha, wowmeta } from '../theme';
import { PadDrone } from '../audio/drone';
import type { Engine } from '../audio/engine';

interface Props {
  engine: Engine;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

const HEX = ACCENTS.pad;
const pFn = (a: number) => alpha(HEX, a);

function xyPos(e: ReactPointerEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
  };
}

export function XYPad({ engine }: Props) {
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
        setTrail((tr) => tr.filter((p) => now - p.t < 500));
      }, 60);
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
    drone.start(p.x, p.y);
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
      const far = !last || Math.hypot(p.x - last.x, p.y - last.y) > 0.012;
      return far ? [...tr, { x: p.x, y: p.y, t: Date.now() }].slice(-24) : tr;
    });
  };

  const onUp = () => {
    drone.stop(false);
    setHeld(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
      <div className="lane-col">
        <div style={{ font: wowmeta(12, 1.4), letterSpacing: '0.08em', textTransform: 'uppercase', color: pFn(0.64) }}>pad</div>
      </div>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          flex: 1,
          minWidth: 0,
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
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: pFn(0.08), pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: pFn(0.08), pointerEvents: 'none' }} />
        {trail.map((p, idx) => {
          const age = (Date.now() - p.t) / 500;
          const k = Math.max(0, 1 - age);
          const sz = (4 + 34 * k * k).toFixed(1);
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
                background: pFn(0.5 * k * k),
                pointerEvents: 'none',
              }}
            />
          );
        })}
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
        <div style={{ position: 'absolute', left: 12, top: 10, font: wowmeta(9), letterSpacing: '0.08em', textTransform: 'uppercase', color: pFn(0.28), pointerEvents: 'none' }}>
          pitch ↑
        </div>
        <div style={{ position: 'absolute', left: 12, bottom: 10, font: wowmeta(9), letterSpacing: '0.08em', textTransform: 'uppercase', color: pFn(0.28), pointerEvents: 'none' }}>
          timbre →
        </div>
        <div style={{ position: 'absolute', right: 12, bottom: 10, font: wowmeta(9), letterSpacing: '0.08em', textTransform: 'uppercase', color: pFn(0.42), pointerEvents: 'none' }}>
          {held ? 'live' : 'hold and move.'}
        </div>
      </div>
    </div>
  );
}

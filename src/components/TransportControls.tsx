import { Circle, DownloadSimple, Pause, Play, Stop } from '@phosphor-icons/react';
import { RED, wowmeta } from '../theme';

interface Props {
  playing: boolean;
  recording: boolean;
  recSec: number;
  rendering: boolean;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onExportStems: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function TransportControls({ playing, recording, recSec, rendering, onTogglePlay, onToggleRecord, onExportStems }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button className="play-btn" onClick={onTogglePlay} aria-label={playing ? 'pause' : 'play'}>
        {playing ? <Pause size={26} weight="fill" /> : <Play size={26} weight="fill" />}
      </button>
      <button
        className={recording ? 'rec-btn recording' : 'rec-btn'}
        onClick={onToggleRecord}
        title={recording ? 'stop recording · saves wav' : 'record'}
        aria-label={recording ? 'stop recording' : 'record'}
      >
        {recording ? <Stop size={22} weight="fill" /> : <Circle size={22} weight="fill" />}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <button className={rendering ? 'stems-btn rendering' : 'stems-btn'} onClick={onExportStems}>
          <DownloadSimple size={14} weight="fill" />
          {rendering ? 'rendering…' : 'stems'}
        </button>
        {recording && (
          <div style={{ font: wowmeta(11), letterSpacing: '0.08em', textTransform: 'uppercase', color: RED }}>
            rec {pad2(Math.floor(recSec / 60))}:{pad2(recSec % 60)}
          </div>
        )}
      </div>
    </div>
  );
}

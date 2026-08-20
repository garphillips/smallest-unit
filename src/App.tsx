import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASS_WAVE, STEPS } from './config';
import { BG, TEXT } from './theme';
import type { DrumId, LaneId, Snapshot } from './types';
import { Engine } from './audio/engine';
import { Transport } from './audio/transport';
import { Recorder } from './audio/recorder';
import { renderStems } from './audio/stems';
import { playMel, playVoice } from './audio/voices';
import { loadState, saveState } from './storage';
import { download } from './download';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TransportControls } from './components/TransportControls';
import { BpmControl } from './components/BpmControl';
import { StepGrid } from './components/StepGrid';
import { PitchLanes } from './components/PitchLanes';
import { XYPad } from './components/XYPad';

export default function App() {
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) engineRef.current = new Engine();
  const engine = engineRef.current;

  const initial = useMemo(loadState, []);
  const [pattern, setPattern] = useState(initial.pattern);
  const [lanes, setLanes] = useState(initial.lanes);
  const [bpm, setBpm] = useState(initial.bpm);
  const [swing] = useState(initial.swing);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [rendering, setRendering] = useState(false);

  // The transport's setInterval reads live state through this ref.
  const snapshotRef = useRef<Snapshot>(null as unknown as Snapshot);
  snapshotRef.current = { steps: STEPS, bpm, swing, pattern, lanes, bassWave: BASS_WAVE };

  const transportRef = useRef<Transport | null>(null);
  if (!transportRef.current) {
    transportRef.current = new Transport(engine, () => snapshotRef.current, setCurrentStep);
  }
  const recorderRef = useRef<Recorder | null>(null);
  if (!recorderRef.current) recorderRef.current = new Recorder();
  const recTimerRef = useRef<number | null>(null);

  useEffect(() => {
    saveState({ pattern, lanes, bpm, swing });
  }, [pattern, lanes, bpm, swing]);

  const togglePlay = useCallback(() => {
    const transport = transportRef.current!;
    if (transport.playing) {
      transport.pause();
      setPlaying(false);
    } else {
      transport.start();
      setPlaying(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  useEffect(
    () => () => {
      transportRef.current?.stop();
      if (recTimerRef.current !== null) clearInterval(recTimerRef.current);
      recTimerRef.current = null;
      recorderRef.current?.stop(engine);
    },
    [engine],
  );

  const toggleCell = (id: DrumId, i: number) => {
    if (!pattern[id][i] && !transportRef.current!.playing) {
      engine.resume();
      playVoice(engine.env(), id, engine.ctx().currentTime + 0.01);
    }
    setPattern((p) => ({ ...p, [id]: p[id].map((v, j) => (j === i ? !v : v)) }));
  };

  const cycleMel = (id: LaneId, i: number) => {
    const next = (lanes[id][i] + 1) % 5;
    if (next && !transportRef.current!.playing) {
      engine.resume();
      playMel(engine.env(), id, next, engine.ctx().currentTime + 0.01, BASS_WAVE);
    }
    setLanes((l) => ({ ...l, [id]: l[id].map((v, j) => (j === i ? (v + 1) % 5 : v)) }));
  };

  const setLane = (id: LaneId, values: number[]) => setLanes((l) => ({ ...l, [id]: values }));

  const toggleRecord = async () => {
    const recorder = recorderRef.current!;
    if (recorder.active) {
      if (recTimerRef.current !== null) clearInterval(recTimerRef.current);
      recTimerRef.current = null;
      const blob = recorder.stop(engine);
      if (blob) download(blob, `track-${snapshotRef.current.bpm}bpm.wav`);
      setRecording(false);
    } else {
      await recorder.start(engine);
      setRecSec(0);
      setRecording(true);
      recTimerRef.current = window.setInterval(() => setRecSec((s) => s + 1), 1000);
      if (!transportRef.current!.playing) togglePlay();
    }
  };

  const exportStems = async () => {
    if (rendering) return;
    setRendering(true);
    try {
      const blob = await renderStems(snapshotRef.current);
      if (blob) download(blob, `stems-${snapshotRef.current.bpm}bpm.zip`);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        color: TEXT,
        font: "400 16px/1.55 'North East', Georgia, serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '128px 48px 72px',
      }}
    >
      <Header />
      <div style={{ width: '100%', maxWidth: 1180, display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 48, flexWrap: 'wrap' }}>
          <TransportControls
            playing={playing}
            recording={recording}
            recSec={recSec}
            rendering={rendering}
            onTogglePlay={togglePlay}
            onToggleRecord={() => void toggleRecord()}
            onExportStems={() => void exportStems()}
          />
          <BpmControl bpm={bpm} onChange={setBpm} />
        </div>
        <StepGrid pattern={pattern} currentStep={currentStep} onToggle={toggleCell} />
        <PitchLanes lanes={lanes} currentStep={currentStep} onCycle={cycleMel} onSetLane={setLane} />
        <XYPad engine={engine} />
        <Footer />
      </div>
    </div>
  );
}

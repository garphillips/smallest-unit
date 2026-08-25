import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCENTS, STEPS, voiceLabel } from './config';
import { TEXT } from './theme';
import type { DrumId, LaneId, Snapshot } from './types';
import type { AnyParams, ParamsOf, VoiceId, VoiceSettings } from './audio/params';
import { Engine } from './audio/engine';
import { Transport } from './audio/transport';
import { Recorder } from './audio/recorder';
import { renderStems } from './audio/stems';
import { PadDrone } from './audio/drone';
import { KeySynth } from './audio/keySynth';
import { playMel, playVoice } from './audio/voices';
import { loadState, saveState } from './storage';
import { download } from './download';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TransportControls } from './components/TransportControls';
import { BpmControl } from './components/BpmControl';
import { Spectrum } from './components/Spectrum';
import { StepGrid } from './components/StepGrid';
import { PitchLanes } from './components/PitchLanes';
import { XYPad } from './components/XYPad';
import { PianoKeys } from './components/PianoKeys';
import { VoiceModal } from './components/VoiceModal';

/** Voices with an accent of their own; everything else uses the base lilac. */
const VOICE_ACCENTS: Partial<Record<VoiceId, string>> = {
  bass: ACCENTS.bass,
  synth: ACCENTS.synth,
  pad: ACCENTS.pad,
};

/** How long a previewed pad/keys note is held before it releases. */
const PREVIEW_HOLD_MS = 900;

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
  const [voices, setVoices] = useState(initial.voices);
  const [editing, setEditing] = useState<VoiceId | null>(null);

  // The transport's setInterval reads live state through this ref.
  const snapshotRef = useRef<Snapshot>(null as unknown as Snapshot);
  snapshotRef.current = { steps: STEPS, bpm, swing, pattern, lanes, voices };

  const transportRef = useRef<Transport | null>(null);
  if (!transportRef.current) {
    transportRef.current = new Transport(engine, () => snapshotRef.current, setCurrentStep);
  }
  const recorderRef = useRef<Recorder | null>(null);
  if (!recorderRef.current) recorderRef.current = new Recorder();
  const recTimerRef = useRef<number | null>(null);

  // Audition-only pad/keys instruments, kept separate from the ones the
  // performance components own so a preview can never cut a held note.
  const previewRef = useRef<{ pad: PadDrone; keys: KeySynth } | null>(null);
  if (!previewRef.current) {
    previewRef.current = { pad: new PadDrone(engine), keys: new KeySynth(engine) };
  }
  const previewTimers = useRef<{ fire: number | null; stop: number | null }>({ fire: null, stop: null });

  useEffect(() => {
    saveState({ pattern, lanes, bpm, swing, voices });
  }, [pattern, lanes, bpm, swing, voices]);

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
      if (editing) return;
      if (e.code === 'Space' && !e.repeat && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, editing]);

  useEffect(
    () => () => {
      transportRef.current?.stop();
      if (recTimerRef.current !== null) clearInterval(recTimerRef.current);
      recTimerRef.current = null;
      recorderRef.current?.stop(engine);
      const { fire, stop } = previewTimers.current;
      if (fire !== null) clearTimeout(fire);
      if (stop !== null) clearTimeout(stop);
      previewRef.current?.pad.stop(true);
      previewRef.current?.keys.releaseAll();
    },
    [engine],
  );

  const toggleCell = (id: DrumId, i: number) => {
    if (!pattern[id][i] && !transportRef.current!.playing) {
      engine.resume();
      playVoice(engine.env(), id, engine.ctx().currentTime + 0.01, voices);
    }
    setPattern((p) => ({ ...p, [id]: p[id].map((v, j) => (j === i ? !v : v)) }));
  };

  const cycleMel = (id: LaneId, i: number) => {
    const next = (lanes[id][i] + 1) % 5;
    if (next && !transportRef.current!.playing) {
      engine.resume();
      playMel(engine.env(), id, next, engine.ctx().currentTime + 0.01, voices);
    }
    setLanes((l) => ({ ...l, [id]: l[id].map((v, j) => (j === i ? (v + 1) % 5 : v)) }));
  };

  const setLane = (id: LaneId, values: number[]) => setLanes((l) => ({ ...l, [id]: values }));

  const clearPreviewTimers = () => {
    const timers = previewTimers.current;
    if (timers.fire !== null) clearTimeout(timers.fire);
    if (timers.stop !== null) clearTimeout(timers.stop);
    timers.fire = null;
    timers.stop = null;
  };

  const stopPreview = () => {
    clearPreviewTimers();
    previewRef.current!.pad.stop(false);
    previewRef.current!.keys.releaseAll();
  };

  /** The sustained voices preview on a short debounce and release themselves,
      so dragging a slider doesn't stack overlapping drones. */
  const auditionSustained = (id: 'pad' | 'keys', params: AnyParams) => {
    clearPreviewTimers();
    const preview = previewRef.current!;
    previewTimers.current.fire = window.setTimeout(() => {
      if (id === 'pad') preview.pad.start(0.5, 0.32, params as ParamsOf<'pad'>);
      else preview.keys.press(0, params as ParamsOf<'keys'>);
      previewTimers.current.stop = window.setTimeout(() => {
        if (id === 'pad') preview.pad.stop(false);
        else preview.keys.release(0);
      }, PREVIEW_HOLD_MS);
    }, 140);
  };

  /** Preview an in-progress sound edit. The sequenced voices stay silent while
      the transport runs, since the pattern already sounds the change on its
      next hit; the pad and keys aren't sequenced, so they always preview. */
  const auditionVoice = (id: VoiceId, params: AnyParams) => {
    if (id === 'pad' || id === 'keys') {
      auditionSustained(id, params);
      return;
    }
    if (transportRef.current!.playing) return;
    engine.resume();
    const V = { ...voices, [id]: params } as VoiceSettings;
    const t = engine.ctx().currentTime + 0.01;
    if (id === 'bass' || id === 'synth') playMel(engine.env(), id, 1, t, V);
    else playVoice(engine.env(), id, t, V);
  };

  const toggleRecord = async () => {
    const recorder = recorderRef.current!;
    if (recorder.active) {
      if (recTimerRef.current !== null) clearInterval(recTimerRef.current);
      recTimerRef.current = null;
      const blob = recorder.stop(engine);
      if (blob) download(blob, `track-${snapshotRef.current.bpm}bpm.wav`);
      setRecording(false);
      transportRef.current!.stopAndReset();
      setPlaying(false);
      setCurrentStep(-1);
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
        color: TEXT,
        font: "400 16px/1.55 'North East', Georgia, serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '128px 48px 72px',
      }}
    >
      <Spectrum engine={engine} />
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
        <StepGrid pattern={pattern} currentStep={currentStep} onToggle={toggleCell} onEditVoice={setEditing} />
        <PitchLanes
          lanes={lanes}
          currentStep={currentStep}
          onCycle={cycleMel}
          onSetLane={setLane}
          onEditVoice={setEditing}
        />
        <div className="performance-row">
          <XYPad engine={engine} params={voices.pad} onEditVoice={setEditing} />
          <PianoKeys engine={engine} params={voices.keys} onEditVoice={setEditing} />
        </div>
        <Footer />
      </div>
      {editing && (
        <VoiceModal
          id={editing}
          name={voiceLabel(editing)}
          accent={VOICE_ACCENTS[editing] ?? TEXT}
          params={voices[editing]}
          onChange={(next) => setVoices((v) => ({ ...v, [editing]: next }) as VoiceSettings)}
          onAudition={(next) => auditionVoice(editing, next)}
          onClose={() => {
            stopPreview();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

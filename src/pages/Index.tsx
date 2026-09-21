import { useCallback, useMemo, useState } from "react";

import LiveAnnouncer from "@/components/a11y/LiveAnnouncer";
import SimulationControls from "@/components/controls/SimulationControls";
import ExamPanel from "@/components/exam/ExamPanel";
import ModeSwitch, { type Mode } from "@/components/exam/ModeSwitch";
import PageLayout from "@/components/layout/PageLayout";
import RhythmInfo from "@/components/RhythmInfo";
import { useSound } from "@/components/sound/sound-context";
import DesktopVisualization from "@/components/visualizations/DesktopVisualization";
import ECGVisualization from "@/components/visualizations/ECGVisualization";
import MobileVisualization from "@/components/visualizations/MobileVisualization";
import { useExam } from "@/hooks/useExam";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BeatEvent } from "@/lib/ecgEngine";
import { nextPulse, type Pulse } from "@/lib/pulse";
import {
  DEFAULT_RHYTHM,
  getRhythm,
  RHYTHMS,
  plainRateLabel,
  rateLabel,
  rhythmForRate,
  withRate,
  type RhythmId,
} from "@/lib/rhythms";

export default function Index() {
  const [mode, setMode] = useState<Mode>("explore");
  const [isPlaying, setIsPlaying] = useState(false);
  const [rhythmId, setRhythmId] = useState<RhythmId>(DEFAULT_RHYTHM);
  const [bpm, setBpm] = useState(RHYTHMS[DEFAULT_RHYTHM].bpm);
  const [beatCount, setBeatCount] = useState(0);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [activeTab, setActiveTab] = useState("heart");

  const isMobile = useIsMobile();
  const sound = useSound();
  const exam = useExam();
  const { current: examCase, chosen: examChoice } = exam;

  const examMode = mode === "exam";
  // En examen el caso manda sobre lo que el usuario haya elegido explorando, así
  // que el ritmo y la frecuencia salen del sorteo y no del estado de la página.
  const rhythm = useMemo(
    () =>
      examMode
        ? withRate(RHYTHMS[examCase.rhythmId], examCase.bpm)
        : withRate(getRhythm(rhythmId), bpm),
    [examMode, examCase, rhythmId, bpm],
  );

  // El caso se revela sólo después de responder; hasta entonces nada en pantalla
  // puede nombrar el ritmo.
  const reveal =
    examMode && examChoice !== null
      ? { answer: examCase.rhythmId, chosen: examChoice }
      : null;
  const hideIdentity = examMode && reveal === null;

  // Identidad estable: ECGCanvas la llama una vez por latido y no debe reiniciar
  // el bucle de animación cada vez que esta página se vuelve a renderizar.
  const handleBeat = useCallback(
    (event: BeatEvent) => {
      sound.playBeat(event);
      // El diagrama del corazón necesita TODOS los latidos, incluido el que no
      // conduce: ahí es donde se ve que las aurículas se contraen y los
      // ventrículos no.
      setPulse((previous) => nextPulse(previous, event));
      // Pero un latido que no conduce no cuenta como latido: el ventrículo no
      // se ha contraído.
      if (event.conducted) setBeatCount((count) => count + 1);
    },
    [sound],
  );

  const handlePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    // Único momento en que el navegador deja arrancar el audio: dentro del clic.
    if (next) sound.resume();
  };

  // Cambiar de ritmo NO borra el trazo: lo valioso es ver el cambio ocurrir, el
  // momento en que la señal se vuelve irregular delante de ti. El contador sí
  // vuelve a cero, porque cuenta latidos de este ritmo.
  const handleRhythmChange = (type: RhythmId) => {
    if (examMode) {
      exam.answer(type);
      return;
    }
    setRhythmId(type);
    setBpm(RHYTHMS[type].bpm);
    setBeatCount(0);
  };

  // Mover la frecuencia reetiqueta el ritmo solo, que es la respuesta a "¿en qué
  // momento deja de ser normal?". La arritmia se queda como está: no es una
  // categoría de frecuencia, es otra forma de generar los latidos.
  const handleRateChange = (next: number) => {
    setBpm(next);
    if (RHYTHMS[rhythmId].followsRate) setRhythmId(rhythmForRate(next));
  };

  const handleReset = () => {
    setBeatCount(0);
    setPulse(null);
    setResetKey((key) => key + 1);
  };

  const handleNextCase = () => {
    exam.next();
    setBeatCount(0);
    setPulse(null);
    setResetKey((key) => key + 1);
  };

  const handleModeChange = (next: Mode) => {
    setMode(next);
    setBeatCount(0);
    setPulse(null);
    setResetKey((key) => key + 1);
  };

  // Lo que se anuncia a un lector de pantalla. En examen callamos el nombre del
  // ritmo mientras no se ha respondido, y en cuanto se revela decimos el
  // resultado, que es la información que de verdad hace falta ahí.
  const announcement = examMode
    ? exam.revealed
      ? `${exam.correct ? "Correcto" : "Incorrecto"}. Era ${RHYTHMS[examCase.rhythmId].title}, a ${rateLabel(rhythm)}.`
      : `Caso nuevo a ${plainRateLabel(rhythm)}. Elige el ritmo.`
    : `${rhythm.title}. ${rateLabel(rhythm)}.`;

  return (
    <PageLayout>
      <div className="grid grid-cols-1 gap-2 sm:gap-4">
        <LiveAnnouncer message={announcement} />

        <ModeSwitch mode={mode} onChange={handleModeChange} />

        <SimulationControls
          isPlaying={isPlaying}
          rhythm={rhythm}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          onSelectRhythm={handleRhythmChange}
          onRateChange={handleRateChange}
          examMode={examMode}
          reveal={reveal}
        />

        <ECGVisualization
          rhythm={rhythm}
          isPlaying={isPlaying}
          beatCount={beatCount}
          onBeat={handleBeat}
          resetKey={resetKey}
          hideIdentity={hideIdentity}
          examMode={examMode}
          annotate={reveal !== null}
        />

        {examMode && (
          <ExamPanel
            score={exam.score}
            revealed={exam.revealed}
            correct={exam.correct}
            answer={RHYTHMS[examCase.rhythmId]}
            chosen={examChoice ? RHYTHMS[examChoice] : null}
            onNext={handleNextCase}
          />
        )}

        {/* El corazón y los pulmones van pegados al trazo, no al final de la
            página: son la misma señal vista por dentro y se entienden mirando
            las dos cosas a la vez. Abajo quedaba texto de por medio y había que
            desplazarse para encontrarlos. */}
        {isMobile ? (
          <MobileVisualization
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            rhythm={rhythm}
            isPlaying={isPlaying}
            pulse={pulse}
          />
        ) : (
          <DesktopVisualization rhythm={rhythm} isPlaying={isPlaying} pulse={pulse} />
        )}

        {/* El panel de explicación es donde de verdad se aprende, así que en
            examen aparece justo al revelar el caso. Va al final porque es lo
            único que se lee en lugar de mirarse. */}
        {!hideIdentity && <RhythmInfo rhythm={rhythm} />}
      </div>
    </PageLayout>
  );
}

import { Play, RotateCcw, Square } from "lucide-react";

import RateControl from "@/components/controls/RateControl";
import RhythmSelector from "@/components/RhythmSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Rhythm, RhythmId } from "@/lib/rhythms";

interface SimulationControlsProps {
  isPlaying: boolean;
  rhythm: Rhythm;
  onPlayPause: () => void;
  onReset: () => void;
  onSelectRhythm: (type: RhythmId) => void;
  onRateChange: (bpm: number) => void;
  /**
   * En examen los botones de ritmo son las respuestas, así que no marcan nada
   * hasta revelar y el deslizador de frecuencia desaparece: poder moverla
   * rompería el ejercicio.
   */
  examMode?: boolean;
  reveal?: { answer: RhythmId; chosen: RhythmId } | null;
}

export default function SimulationControls({
  isPlaying,
  rhythm,
  onPlayPause,
  onReset,
  onSelectRhythm,
  onRateChange,
  examMode = false,
  reveal = null,
}: SimulationControlsProps) {
  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-xl">Controles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="flex gap-3">
          <Button
            onClick={onPlayPause}
            variant={isPlaying ? "destructive" : "default"}
            size="lg"
            className="w-full py-6 text-lg"
          >
            {isPlaying ? (
              <>
                <Square className="mr-2 h-5 w-5" aria-hidden="true" /> Detener
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" aria-hidden="true" /> Iniciar
              </>
            )}
          </Button>
          <Button onClick={onReset} variant="outline" size="lg" className="py-6">
            <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" /> Reiniciar
          </Button>
        </div>

        <Separator />

        <div>
          <h2 className="mb-2 text-lg font-medium">
            {examMode ? "¿Qué ritmo es?" : "Seleccionar Ritmo"}
          </h2>
          <RhythmSelector
            selectedRhythm={examMode && reveal === null ? null : rhythm.id}
            onSelectRhythm={onSelectRhythm}
            reveal={reveal}
            disabled={examMode && reveal !== null}
            label={examMode ? "Elegir la respuesta" : "Seleccionar ritmo"}
            showSummary={!examMode || reveal !== null}
          />
        </div>

        {!examMode && (
          <>
            <Separator />
            <RateControl rhythm={rhythm} onChange={onRateChange} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

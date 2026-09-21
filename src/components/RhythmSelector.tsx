import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RHYTHM_IDS, RHYTHMS, type RhythmId } from "@/lib/rhythms";

interface RhythmSelectorProps {
  /** Nulo mientras el examen no ha revelado el caso: marcar algo sería la pista. */
  selectedRhythm: RhythmId | null;
  onSelectRhythm: (type: RhythmId) => void;
  /** Al revelar el caso del examen, cuál era y cuál se eligió. */
  reveal?: { answer: RhythmId; chosen: RhythmId } | null;
  disabled?: boolean;
  label?: string;
  /**
   * El resumen de cada ritmo es su criterio diagnóstico, así que con la
   * pregunta abierta es la respuesta impresa al lado: "lento, menos de 60 lpm"
   * junto a la frecuencia en pantalla resuelve el caso sin mirar la onda. Se
   * oculta mientras se responde y vuelve al revelar, que es cuando enseña.
   */
  showSummary?: boolean;
}

export default function RhythmSelector({
  selectedRhythm,
  onSelectRhythm,
  reveal = null,
  disabled = false,
  label = "Seleccionar ritmo",
  showSummary = true,
}: RhythmSelectorProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      role="group"
      aria-label={label}
    >
      {RHYTHM_IDS.map((id) => {
        const rhythm = RHYTHMS[id];
        const selected = selectedRhythm === id;
        const isAnswer = reveal?.answer === id;
        const isWrongChoice = reveal !== null && reveal.chosen === id && !isAnswer;

        return (
          <Button
            key={id}
            onClick={() => onSelectRhythm(id)}
            disabled={disabled}
            variant={selected ? "default" : "secondary"}
            aria-pressed={selected}
            className={cn(
              "h-auto min-h-[4.5rem] flex-col items-center justify-center gap-0.5 whitespace-normal px-2 py-2 text-center text-sm leading-tight transition-all duration-200",
              selected && "shadow-md",
              isAnswer && "ring-2 ring-medical-normal ring-offset-2 ring-offset-background",
              isWrongChoice && "ring-2 ring-destructive ring-offset-2 ring-offset-background",
              disabled && !isAnswer && !isWrongChoice && "opacity-60",
            )}
          >
            <span className="font-medium">{rhythm.label}</span>
            {showSummary && (
              <span
                className={cn(
                  "text-[11px] font-normal leading-tight",
                  selected ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {rhythm.summary}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

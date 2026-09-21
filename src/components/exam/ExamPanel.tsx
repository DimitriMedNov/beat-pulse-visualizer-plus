import { Check, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hitRate, type Score } from "@/lib/examen";
import type { Rhythm } from "@/lib/rhythms";

interface ExamPanelProps {
  score: Score;
  revealed: boolean;
  correct: boolean;
  /** El ritmo que había que reconocer. Sólo se nombra una vez revelado. */
  answer: Rhythm;
  chosen: Rhythm | null;
  onNext: () => void;
}

export default function ExamPanel({
  score,
  revealed,
  correct,
  answer,
  chosen,
  onNext,
}: ExamPanelProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">Aciertos</dt>
            <dd className="font-bold tabular-nums">
              {score.hits}/{score.attempts}
              {score.attempts > 0 && (
                <span className="ml-1 font-normal text-muted-foreground">
                  ({hitRate(score)}%)
                </span>
              )}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">Racha</dt>
            <dd className="font-bold tabular-nums">
              {score.streak}
              {score.bestStreak > 0 && (
                <span className="ml-1 font-normal text-muted-foreground">
                  (mejor {score.bestStreak})
                </span>
              )}
            </dd>
          </div>
        </dl>

        {revealed ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-sm">
              {correct ? (
                <>
                  <Check className="h-5 w-5 shrink-0 text-medical-normal" aria-hidden="true" />
                  <span>
                    Correcto, era <strong>{answer.label}</strong>.
                  </span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  <span>
                    Era <strong>{answer.label}</strong>
                    {chosen && <>, no {chosen.label}</>}.
                  </span>
                </>
              )}
            </p>
            <Button onClick={onNext} className="shrink-0">
              Siguiente <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Observa el trazo y elige el ritmo que crees que es.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

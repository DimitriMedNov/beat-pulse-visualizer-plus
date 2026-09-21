import { useCallback, useState } from "react";

import {
  EMPTY_SCORE,
  grade,
  nextCase,
  pickCase,
  type ExamCase,
  type Score,
} from "@/lib/examen";
import type { RhythmId } from "@/lib/rhythms";

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export interface Exam {
  current: ExamCase;
  /** Lo que respondió el usuario, o nulo si todavía no ha respondido. */
  chosen: RhythmId | null;
  revealed: boolean;
  correct: boolean;
  score: Score;
  answer: (rhythmId: RhythmId) => void;
  next: () => void;
}

/**
 * Estado del examen. Todas las decisiones las toma `src/lib/examen.ts`; aquí sólo
 * se guardan y se encadenan.
 */
export function useExam(): Exam {
  const [current, setCurrent] = useState<ExamCase>(() => pickCase(randomSeed()));
  const [chosen, setChosen] = useState<RhythmId | null>(null);
  const [score, setScore] = useState<Score>(EMPTY_SCORE);

  const answer = useCallback(
    (rhythmId: RhythmId) => {
      // Una vez revelado el caso, volver a pulsar no debe sumar otro intento.
      if (chosen !== null) return;
      setChosen(rhythmId);
      setScore((previous) => grade(previous, rhythmId === current.rhythmId));
    },
    [chosen, current.rhythmId],
  );

  const next = useCallback(() => {
    setChosen(null);
    setCurrent((previous) => nextCase(previous, randomSeed()));
  }, []);

  return {
    current,
    chosen,
    revealed: chosen !== null,
    correct: chosen === current.rhythmId,
    score,
    answer,
    next,
  };
}

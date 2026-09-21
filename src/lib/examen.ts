// Lógica del modo examen. Todo son funciones puras de una semilla, igual que los
// generadores de latidos, de modo que un caso concreto se puede reproducir y
// probar en lugar de depender del azar del momento.

import { integerBetween, pickFrom } from "./random";
import { clampBpm, RHYTHMS, RHYTHM_IDS, type Rhythm, type RhythmId } from "./rhythms";

/** Un caso planteado al usuario: qué ritmo se dibuja y a qué frecuencia. */
export interface ExamCase {
  rhythmId: RhythmId;
  bpm: number;
}

export interface Score {
  attempts: number;
  hits: number;
  /** Respuestas correctas seguidas hasta ahora. */
  streak: number;
  /** La racha más larga de la sesión. */
  bestStreak: number;
}

export const EMPTY_SCORE: Score = { attempts: 0, hits: 0, streak: 0, bestStreak: 0 };

/**
 * Frecuencia sorteada dentro del rango plausible del ritmo. Nunca se sale de
 * ahí, así que la frecuencia que se muestra en pantalla sigue siendo una pista
 * legítima y no una contradicción con el trazo.
 */
export function randomRate(rhythm: Rhythm, seed: number): number {
  return clampBpm(integerBetween(seed, rhythm.bpmRange.min, rhythm.bpmRange.max));
}

/** El caso que corresponde a una semilla. */
export function pickCase(seed: number): ExamCase {
  const rhythmId = pickFrom(RHYTHM_IDS, seed);
  return { rhythmId, bpm: randomRate(RHYTHMS[rhythmId], seed * 2 + 1) };
}

/**
 * El caso siguiente, evitando repetir el ritmo que se acaba de ver. Dos casos
 * iguales seguidos se sienten como un fallo del programa aunque el sorteo sea
 * correcto, y además no enseñan nada nuevo.
 */
export function nextCase(previous: ExamCase, seed: number): ExamCase {
  for (let attempt = 0; attempt < RHYTHM_IDS.length; attempt += 1) {
    const candidate = pickCase(seed + attempt * 977);
    if (candidate.rhythmId !== previous.rhythmId) return candidate;
  }
  return pickCase(seed);
}

/** Marcador tras responder. Fallar corta la racha, no el mejor registro. */
export function grade(previous: Score, correct: boolean): Score {
  const streak = correct ? previous.streak + 1 : 0;
  return {
    attempts: previous.attempts + 1,
    hits: previous.hits + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(previous.bestStreak, streak),
  };
}

/** Porcentaje de aciertos, redondeado. Sin intentos todavía es cero. */
export function hitRate(score: Score): number {
  return score.attempts === 0 ? 0 : Math.round((score.hits / score.attempts) * 100);
}

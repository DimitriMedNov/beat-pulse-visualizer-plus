// Generadores de latidos. Cada ritmo produce su propia secuencia; aquí está lo
// que distingue a una familia de otra.
//
// Todos son funciones puras del índice del latido: el mismo latido da siempre lo
// mismo, así que las arritmias son aleatorias pero reproducibles. La variación se
// calcula una vez por latido, no por frame.

import {
  PR_SECONDS,
  SINUS_MORPHOLOGY,
  type BeatMorphology,
} from "./ecgWaveform";
import { hash01 } from "./random";

export interface Beat {
  /**
   * Duración del intervalo que ocupa este latido, respecto del nominal del
   * ritmo. Es el SILENCIO lo que se estira, nunca el complejo.
   */
  rrScale: number;
  morphology: BeatMorphology;
}

export type BeatGenerator = (index: number) => Beat;

const SINUS_BEAT: Beat = { rrScale: 1, morphology: SINUS_MORPHOLOGY };

/** Ritmo sinusal regular: todos los latidos iguales, todos los intervalos iguales. */
export const sinusBeats: BeatGenerator = () => SINUS_BEAT;

/**
 * Arritmia sinusal: el intervalo varía suavemente con la respiración, y cada
 * latido es por lo demás normal. Es irregular, pero de forma *ondulada*, que es
 * justo lo que la distingue de la fibrilación.
 */
export const sinusArrhythmiaBeats: BeatGenerator = (index) => ({
  rrScale: 1 + 0.2 * Math.sin(index * 0.7),
  morphology: SINUS_MORPHOLOGY,
});

/**
 * Fibrilación auricular. Las tres firmas:
 *  - no hay ondas P (las aurículas no se despolarizan de forma organizada),
 *  - los intervalos son irregularmente irregulares, sin patrón ninguno,
 *  - la línea de base tiembla (eso lo añade el motor, con `baselineNoise`).
 */
const FIBRILLATION_MORPHOLOGY: BeatMorphology = {
  ...SINUS_MORPHOLOGY,
  hasPWave: false,
};

export const atrialFibrillationBeats: BeatGenerator = (index) => ({
  rrScale: 0.55 + hash01(index) * 0.95,
  morphology: {
    ...FIBRILLATION_MORPHOLOGY,
    amplitude: 0.9 + hash01(index * 2 + 1) * 0.2,
  },
});

/**
 * Extrasístole ventricular. Late normal, normal, normal, y de repente un
 * complejo ancho y deforme, sin P delante, seguido de una pausa.
 *
 * El latido viene ADELANTADO (por eso "extrasístole") y la pausa que lo sigue
 * compensa: 0,65 + 1,75 ~= 2 intervalos normales, así que el ritmo de fondo no
 * se desplaza. Eso es la pausa compensadora completa.
 */
const PVC_MORPHOLOGY: BeatMorphology = {
  hasPWave: false,
  hasQrs: true,
  prSeconds: PR_SECONDS,
  qrsWidthScale: 2.4,
  qrsPolarity: 1,
  // Onda T discordante: en un latido ventricular va al revés que el QRS.
  tPolarity: -1,
  amplitude: 1.35,
};

const PVC_EVERY = 7;
const PVC_AT = 3;
const isPvc = (index: number) => index % PVC_EVERY === PVC_AT;

export const pvcBeats: BeatGenerator = (index) => {
  if (isPvc(index)) return { rrScale: 1.75, morphology: PVC_MORPHOLOGY };
  // El latido previo se acorta: la extrasístole se adelanta.
  if (isPvc(index + 1)) return { rrScale: 0.65, morphology: SINUS_MORPHOLOGY };
  return SINUS_BEAT;
};

/**
 * Bloqueo AV de 2º grado, Mobitz I (Wenckebach), con conducción 4:3.
 *
 * El PR se alarga latido a latido hasta que uno no conduce: se ve la onda P
 * sola, sin QRS detrás. El intervalo P-P no cambia — es el R-R el que se acorta
 * progresivamente, y eso sale solo de que el PR crezca.
 */
const WENCKEBACH_PR = [0.16, 0.22, 0.28];
const WENCKEBACH_CYCLE = WENCKEBACH_PR.length + 1;

export const mobitzOneBeats: BeatGenerator = (index) => {
  const step = index % WENCKEBACH_CYCLE;

  if (step === WENCKEBACH_PR.length) {
    return {
      rrScale: 1,
      morphology: { ...SINUS_MORPHOLOGY, hasQrs: false },
    };
  }

  return {
    rrScale: 1,
    morphology: { ...SINUS_MORPHOLOGY, prSeconds: WENCKEBACH_PR[step] },
  };
};

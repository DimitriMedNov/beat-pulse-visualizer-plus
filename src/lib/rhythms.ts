// Única fuente de verdad de los ritmos. Todo lo que late en la app -- el trazo
// del ECG, el corazón, los pulmones y la frecuencia que se muestra -- se deriva
// del `bpm` que se declara aquí, y cada ritmo trae su propio generador de
// latidos, que es lo que distingue una familia de otra.

import {
  atrialFibrillationBeats,
  mobitzOneBeats,
  pvcBeats,
  sinusArrhythmiaBeats,
  sinusBeats,
  type BeatGenerator,
} from "./beats";

export type RhythmId =
  | "normal"
  | "bradycardia"
  | "tachycardia"
  | "sinusArrhythmia"
  | "atrialFibrillation"
  | "pvc"
  | "mobitz1";

export interface Rhythm {
  id: RhythmId;
  label: string;
  /** Resumen corto, se muestra bajo el botón del selector. */
  summary: string;
  /**
   * Frecuencia en latidos por minuto. En el diccionario `RHYTHMS` es el valor
   * por defecto del ritmo; el deslizador la sobrescribe sin tocar nada más.
   */
  bpm: number;
  /**
   * Rango de frecuencia en que este ritmo resulta plausible. El examen sortea
   * dentro de él para que una bradicardia salga siempre por debajo de 60 y una
   * taquicardia por encima de 100, porque en esos dos la frecuencia forma parte
   * del diagnóstico y no se puede falsear.
   */
  bpmRange: { min: number; max: number };
  /** Si el intervalo entre latidos varía de un latido a otro. */
  irregular: boolean;
  /**
   * Si la identidad del ritmo la determina su frecuencia. Cierto sólo para el
   * sinusal normal, la bradicardia y la taquicardia: son el mismo ritmo a
   * distinta velocidad, así que el deslizador los reetiqueta entre sí.
   */
  followsRate: boolean;
  /** Amplitud del temblor de la línea de base. Sólo la fibrilación lo tiene. */
  baselineNoise: number;
  /** Cómo genera sus latidos este ritmo. */
  beats: BeatGenerator;
  /** Color del trazo. */
  color: string;
  title: string;
  description: string;
  info: string;
}

export const RHYTHMS: Record<RhythmId, Rhythm> = {
  normal: {
    id: "normal",
    label: "Normal",
    summary: "Regular, 60-100 lpm",
    bpm: 75,
    bpmRange: { min: 60, max: 100 },
    irregular: false,
    followsRate: true,
    baselineNoise: 0,
    beats: sinusBeats,
    color: "#2a9d8f",
    title: "Ritmo Sinusal Normal",
    description: "60-100 latidos por minuto",
    info:
      "El ritmo cardíaco normal muestra un patrón regular con ondas P-QRS-T bien definidas. " +
      "Cada onda P va seguida de un QRS, el intervalo PR es constante y el corazón bombea " +
      "sangre de manera uniforme y eficiente.",
  },
  bradycardia: {
    id: "bradycardia",
    label: "Bradicardia",
    summary: "Lento, menos de 60 lpm",
    bpm: 45,
    bpmRange: { min: 35, max: 58 },
    irregular: false,
    followsRate: true,
    baselineNoise: 0,
    beats: sinusBeats,
    color: "#457b9d",
    title: "Bradicardia",
    description: "Menos de 60 latidos por minuto",
    info:
      "La bradicardia es un ritmo cardíaco anormalmente lento. El complejo es idéntico al " +
      "normal: lo que se alarga es el silencio entre latidos. Puede ser normal en atletas en " +
      "reposo, pero también puede indicar problemas del sistema de conducción.",
  },
  tachycardia: {
    id: "tachycardia",
    label: "Taquicardia",
    summary: "Rápido, más de 100 lpm",
    bpm: 120,
    bpmRange: { min: 105, max: 170 },
    irregular: false,
    followsRate: true,
    baselineNoise: 0,
    beats: sinusBeats,
    color: "#e76f51",
    title: "Taquicardia",
    description: "Más de 100 latidos por minuto",
    info:
      "La taquicardia es un ritmo cardíaco anormalmente rápido. El complejo tampoco cambia; " +
      "desaparece el silencio entre latidos y la repolarización se acorta, así que las ondas " +
      "T se acercan cada vez más a la P siguiente.",
  },
  sinusArrhythmia: {
    id: "sinusArrhythmia",
    label: "Arritmia sinusal",
    summary: "Varía con la respiración",
    bpm: 75,
    bpmRange: { min: 58, max: 95 },
    irregular: true,
    followsRate: false,
    baselineNoise: 0,
    beats: sinusArrhythmiaBeats,
    color: "#7209b7",
    title: "Arritmia Sinusal",
    description: "Ritmo irregular pero ondulado",
    info:
      "Los latidos son normales y cada P va seguida de su QRS, pero el intervalo entre ellos " +
      "se acorta al inspirar y se alarga al espirar. La irregularidad es suave y cíclica, no " +
      "caótica. Es benigna y muy común en gente joven.",
  },
  atrialFibrillation: {
    id: "atrialFibrillation",
    label: "Fibrilación auricular",
    summary: "Sin ondas P, caótico",
    bpm: 110,
    bpmRange: { min: 80, max: 160 },
    irregular: true,
    followsRate: false,
    baselineNoise: 0.05,
    beats: atrialFibrillationBeats,
    color: "#c1121f",
    title: "Fibrilación Auricular",
    description: "Irregularmente irregular",
    info:
      "Es la arritmia sostenida más común. Las aurículas dejan de contraerse de forma " +
      "organizada: desaparecen las ondas P, la línea de base tiembla con ondas f, y los " +
      "intervalos entre complejos no siguen ningún patrón. Aumenta mucho el riesgo de ictus.",
  },
  pvc: {
    id: "pvc",
    label: "Extrasístole ventricular",
    summary: "Latido ancho y pausa",
    bpm: 75,
    bpmRange: { min: 60, max: 95 },
    irregular: true,
    followsRate: false,
    baselineNoise: 0,
    beats: pvcBeats,
    color: "#f77f00",
    title: "Extrasístole Ventricular",
    description: "Latidos normales con complejos prematuros",
    info:
      "Un foco del ventrículo se adelanta al nodo sinusal. Como el impulso no usa la vía de " +
      "conducción normal, el complejo sale ancho y deforme, sin onda P delante y con la onda T " +
      "en dirección contraria. Después viene una pausa compensadora.",
  },
  mobitz1: {
    id: "mobitz1",
    label: "Bloqueo AV (Mobitz I)",
    summary: "El PR se alarga y cae",
    bpm: 60,
    bpmRange: { min: 45, max: 75 },
    irregular: true,
    followsRate: false,
    baselineNoise: 0,
    beats: mobitzOneBeats,
    color: "#0077b6",
    title: "Bloqueo AV de 2.º Grado, Mobitz I",
    description: "Fenómeno de Wenckebach",
    info:
      "El nodo AV se va fatigando: el intervalo PR se alarga un poco más en cada latido hasta " +
      "que uno no conduce y se ve una onda P sola, sin QRS detrás. Luego el ciclo vuelve a " +
      "empezar. Las P siguen siendo regulares; lo que se agrupa son los QRS.",
  },
};

export const RHYTHM_IDS = Object.keys(RHYTHMS) as RhythmId[];

export const DEFAULT_RHYTHM: RhythmId = "normal";

/** Rango del deslizador de frecuencia, en latidos por minuto. */
export const BPM_MIN = 30;
export const BPM_MAX = 200;

/** Fronteras clínicas: por debajo es bradicardia, por encima taquicardia. */
export const BRADYCARDIA_BELOW = 60;
export const TACHYCARDIA_ABOVE = 100;

export function clampBpm(bpm: number): number {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

/**
 * El ritmo sinusal que corresponde a una frecuencia. Es lo que hace que al
 * arrastrar el deslizador la etiqueta cambie sola y se vea dónde está la
 * frontera entre normal y taquicardia. Sólo se aplica a los ritmos con
 * `followsRate`; las familias de arritmia se quedan como están.
 */
export function rhythmForRate(bpm: number): RhythmId {
  if (bpm < BRADYCARDIA_BELOW) return "bradycardia";
  if (bpm > TACHYCARDIA_ABOVE) return "tachycardia";
  return "normal";
}

/** Copia del ritmo con la frecuencia sobrescrita. */
export function withRate(rhythm: Rhythm, bpm: number): Rhythm {
  return rhythm.bpm === bpm ? rhythm : { ...rhythm, bpm: clampBpm(bpm) };
}

export function isRhythmId(value: string): value is RhythmId {
  return value in RHYTHMS;
}

export function getRhythm(id: string): Rhythm {
  return isRhythmId(id) ? RHYTHMS[id] : RHYTHMS[DEFAULT_RHYTHM];
}

/** Duración nominal de un latido, en segundos. */
export function beatSeconds(rhythm: Rhythm): number {
  return 60 / rhythm.bpm;
}

/** Duración nominal de un latido, en milisegundos. */
export function beatMs(rhythm: Rhythm): number {
  return 60000 / rhythm.bpm;
}

/** Frecuencia legible para la cabecera del ECG. */
export function rateLabel(rhythm: Rhythm): string {
  return rhythm.irregular ? `~${rhythm.bpm} BPM · irregular` : `${rhythm.bpm} BPM`;
}

/**
 * La frecuencia a secas, sin la nota de irregularidad. En examen la frecuencia
 * se sigue mostrando porque en bradicardia y taquicardia forma parte del
 * diagnóstico, pero decir además si el ritmo es irregular reduciría las siete
 * opciones a cuatro sin haber leído la onda.
 */
export function plainRateLabel(rhythm: Rhythm): string {
  return `${rhythm.bpm} BPM`;
}

/**
 * Respiraciones por minuto derivadas de la frecuencia cardíaca, con la relación
 * aproximada de 1 respiración por cada 4 latidos y acotada a un rango fisiológico.
 */
export function breathsPerMinute(rhythm: Rhythm): number {
  return Math.min(30, Math.max(8, Math.round(rhythm.bpm / 4)));
}

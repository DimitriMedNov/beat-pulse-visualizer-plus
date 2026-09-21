// Forma de onda P-QRS-T. Todo lo de aquí es puro, determinista y no sabe nada de
// ritmos: recibe la morfología de UN latido y la dibuja.
//
// Las anclas están en SEGUNDOS ABSOLUTOS desde el inicio del complejo, no en una
// fracción del latido. En un corazón real el complejo dura lo mismo a 45 que a
// 120 lpm; lo que se acorta al acelerar es el silencio entre latidos.

/** Campana gaussiana centrada en `center`. */
function bump(t: number, center: number, width: number, amplitude: number): number {
  const d = t - center;
  return amplitude * Math.exp(-(d * d) / (2 * width * width));
}

// --- Anclas del complejo, en segundos ---------------------------------------

/** Onda P: ~90 ms de ancho. */
export const P_CENTER_SECONDS = 0.05;
const P_CENTER = P_CENTER_SECONDS;
const P_WIDTH = 0.022;
const P_AMPLITUDE = 0.13;

/** Inicio del P, donde la onda despega de la línea de base. */
export const P_ONSET_SECONDS = 0.006;
const P_END_SECONDS = P_CENTER + 2 * P_WIDTH;

/** Intervalo PR normal: del inicio del P al inicio del QRS. Fisiológico: 120-200 ms. */
export const PR_SECONDS = 0.16;

/** Duración del QRS normal. Fisiológica: 80-100 ms. Rígida a cualquier frecuencia. */
export const QRS_SECONDS = 0.09;

// Posiciones y anchuras dentro del QRS, relativas a su inicio.
const Q_OFFSET = 0.004;
const Q_WIDTH = 0.0083;
const Q_AMPLITUDE = -0.09;

const R_OFFSET = 0.03;
const R_WIDTH = 0.0098;
const R_AMPLITUDE = 1;

const S_OFFSET = 0.063;
const S_WIDTH = 0.0124;
const S_AMPLITUDE = -0.25;

/** Del fin del QRS al centro de la onda T. */
const ST_TO_T = 0.19;
const T_WIDTH = 0.055;
const T_AMPLITUDE = 0.27;

/** Parte del complejo posterior al QRS, o sea lo único que se comprime. */
const REPOL_REF_SECONDS = ST_TO_T + 2 * T_WIDTH;

/** Intervalo QT de referencia: del inicio del QRS al fin del T. */
export const QT_REF_SECONDS = QRS_SECONDS + REPOL_REF_SECONDS;

/** Suelo de compresión: por debajo de esto la onda T dejaría de ser reconocible. */
const MIN_REPOL_SCALE = 0.12;

/** Fracción del latido que como mucho puede ocupar el complejo. */
const MAX_COMPLEX_FRACTION = 0.92;

/** Cómo es UN latido concreto. */
export interface BeatMorphology {
  /** Si hay despolarización auricular visible. Desaparece en la fibrilación. */
  hasPWave: boolean;
  /** Si la despolarización llega a los ventrículos. En un latido caído no. */
  hasQrs: boolean;
  /** Intervalo PR de este latido. Se alarga progresivamente en el Mobitz I. */
  prSeconds: number;
  /** Ancho del QRS respecto del normal. Por encima de 1, origen ventricular. */
  qrsWidthScale: number;
  /** Dirección del QRS. */
  qrsPolarity: 1 | -1;
  /** Dirección de la onda T. En los latidos ventriculares va discordante. */
  tPolarity: 1 | -1;
  /** Multiplicador global de la amplitud. */
  amplitude: number;
}

export const SINUS_MORPHOLOGY: BeatMorphology = {
  hasPWave: true,
  hasQrs: true,
  prSeconds: PR_SECONDS,
  qrsWidthScale: 1,
  qrsPolarity: 1,
  tPolarity: 1,
  amplitude: 1,
};

export interface ComplexTiming {
  /** Cuánto se estira o encoge la repolarización. El QRS nunca se toca. */
  repolScale: number;
  /** Duración real del complejo a esta frecuencia. */
  durationSeconds: number;
  qrsOnset: number;
  qrsEnd: number;
  morphology: BeatMorphology;
}

/**
 * Geometría del complejo para un intervalo RR y una morfología dados.
 *
 * El QT se acorta con la frecuencia siguiendo a Bazett (QT = QTc * raíz(RR)),
 * que es lo que hace un corazón de verdad y lo que evita que el complejo no
 * quepa en el latido a frecuencias altas. El QRS y el PR no dependen de ella.
 */
export function complexTiming(
  rrSeconds: number,
  morphology: BeatMorphology = SINUS_MORPHOLOGY,
): ComplexTiming {
  const qrsOnset = P_ONSET_SECONDS + morphology.prSeconds;
  const qrsDuration = QRS_SECONDS * morphology.qrsWidthScale;
  const qrsEnd = qrsOnset + qrsDuration;

  if (!morphology.hasQrs) {
    // Latido no conducido: se ve la P y nada más. Es la firma del bloqueo.
    return {
      repolScale: 1,
      durationSeconds: P_END_SECONDS,
      qrsOnset,
      qrsEnd,
      morphology,
    };
  }

  const bazett = QT_REF_SECONDS * Math.sqrt(rrSeconds);

  // Lo que queda del latido una vez descontado el PR, para que el complejo no se
  // solape con el siguiente.
  const available = MAX_COMPLEX_FRACTION * rrSeconds - qrsOnset;
  const qt = Math.min(bazett, Math.max(qrsDuration, available));

  const repolScale = Math.max(MIN_REPOL_SCALE, (qt - qrsDuration) / REPOL_REF_SECONDS);

  return {
    repolScale,
    // El suelo de compresión manda sobre el ajuste, así que a frecuencias muy
    // altas el complejo se recortaría; el tope garantiza que no invada el
    // siguiente latido.
    durationSeconds: Math.min(qrsEnd + REPOL_REF_SECONDS * repolScale, rrSeconds),
    qrsOnset,
    qrsEnd,
    morphology,
  };
}

/**
 * Un complejo completo.
 *
 * @param t       segundos transcurridos desde el inicio del latido
 * @param timing  geometría devuelta por `complexTiming`
 */
export function beatSample(t: number, timing: ComplexTiming): number {
  if (t < 0 || t > timing.durationSeconds) return 0;

  const { morphology: m, qrsOnset, qrsEnd } = timing;
  let value = 0;

  if (m.hasPWave) {
    value += bump(t, P_CENTER, P_WIDTH, P_AMPLITUDE);
  }

  if (m.hasQrs) {
    const w = m.qrsWidthScale;
    const polarity = m.qrsPolarity;
    value += bump(t, qrsOnset + Q_OFFSET * w, Q_WIDTH * w, Q_AMPLITUDE * polarity);
    value += bump(t, qrsOnset + R_OFFSET * w, R_WIDTH * w, R_AMPLITUDE * polarity);
    value += bump(t, qrsOnset + S_OFFSET * w, S_WIDTH * w, S_AMPLITUDE * polarity);

    // Después del QRS el tiempo se reescala, de modo que sólo la repolarización
    // sigue a la frecuencia.
    const scale = timing.repolScale;
    value += bump(
      t,
      qrsEnd + ST_TO_T * scale,
      T_WIDTH * scale,
      T_AMPLITUDE * m.tPolarity,
    );
  }

  return value * m.amplitude;
}

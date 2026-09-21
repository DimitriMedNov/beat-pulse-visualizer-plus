import { describe, expect, it } from "vitest";

import {
  beatSample,
  complexTiming,
  PR_SECONDS,
  P_ONSET_SECONDS,
  QRS_SECONDS,
  SINUS_MORPHOLOGY,
} from "@/lib/ecgWaveform";

const QRS_END = P_ONSET_SECONDS + PR_SECONDS + QRS_SECONDS;
const RATES = [30, 45, 60, 75, 100, 120, 150, 200];
const STEP = 0.00002;

const rr = (bpm: number) => 60 / bpm;

/** Inicio y fin del QRS por cruce de umbral, dentro de su propia ventana. */
function qrsSpan(bpm: number) {
  const timing = complexTiming(rr(bpm));
  let onset: number | null = null;
  let offset = 0;
  for (let t = 0.09; t <= QRS_END; t += STEP) {
    if (Math.abs(beatSample(t, timing)) > 0.04) {
      if (onset === null) onset = t;
      offset = t;
    }
  }
  return { onset: onset ?? 0, offset };
}

/** Inicio de la onda P y fin de la onda T. */
function complexSpan(bpm: number) {
  const timing = complexTiming(rr(bpm));
  let onset: number | null = null;
  let end = 0;
  for (let t = 0; t < timing.durationSeconds + 0.02; t += STEP) {
    if (Math.abs(beatSample(t, timing)) > 0.02) {
      if (onset === null) onset = t;
      end = t;
    }
  }
  return { onset: onset ?? 0, end };
}

describe("el complejo no se estira con la frecuencia", () => {
  // Ésta es la regresión que arregla la fase 1. Antes el complejo se dibujaba
  // sobre una fase de 0 a 1 del latido, así que el QRS medía 116 ms en
  // bradicardia y 43 ms en taquicardia. En un corazón real dura lo mismo
  // siempre; lo que se acorta al acelerar es el silencio entre latidos.
  it("dibuja la misma señal hasta el fin del QRS a cualquier frecuencia", () => {
    const reference = complexTiming(rr(75));
    let worst = 0;
    for (const bpm of RATES) {
      const timing = complexTiming(rr(bpm));
      for (let t = 0; t <= QRS_END; t += 0.0002) {
        worst = Math.max(worst, Math.abs(beatSample(t, timing) - beatSample(t, reference)));
      }
    }
    // El único residuo es la cola de la onda T asomando al final del QRS, que a
    // frecuencias altas sí se acerca: 4,5e-4 mV en el peor caso, unas centésimas
    // de píxel. Un complejo estirado daría diferencias del orden de 1.
    expect(worst).toBeLessThan(1e-3);
  });

  it("mantiene el QRS dentro del rango fisiológico (80-100 ms) a cualquier frecuencia", () => {
    const widths = RATES.map((bpm) => {
      const { onset, offset } = qrsSpan(bpm);
      return Math.round((offset - onset) * 1000);
    });
    for (const width of widths) {
      expect(width).toBeGreaterThanOrEqual(80);
      expect(width).toBeLessThanOrEqual(100);
    }
    expect(new Set(widths).size).toBe(1);
  });

  it("mantiene el PR dentro del rango fisiológico (120-200 ms) a cualquier frecuencia", () => {
    const intervals = RATES.map((bpm) =>
      Math.round((qrsSpan(bpm).onset - complexSpan(bpm).onset) * 1000),
    );
    for (const pr of intervals) {
      expect(pr).toBeGreaterThanOrEqual(120);
      expect(pr).toBeLessThanOrEqual(200);
    }
    expect(new Set(intervals).size).toBe(1);
  });

  it("coloca el pico de la onda R en el mismo instante a cualquier frecuencia", () => {
    const peaks = RATES.map((bpm) => {
      const timing = complexTiming(rr(bpm));
      let at = 0;
      let best = -Infinity;
      for (let t = 0; t <= QRS_END; t += STEP) {
        const v = beatSample(t, timing);
        if (v > best) {
          best = v;
          at = t;
        }
      }
      return Math.round(at * 1000);
    });
    expect(new Set(peaks).size).toBe(1);
  });
});

describe("la repolarización sí sigue a la frecuencia", () => {
  it("acorta el QT al subir la frecuencia, como dicta Bazett", () => {
    const qts = RATES.map((bpm) => complexSpan(bpm).end - qrsSpan(bpm).onset);
    for (let i = 1; i < qts.length; i += 1) {
      expect(qts[i]).toBeLessThan(qts[i - 1]);
    }
  });

  it("deja el QT en valores plausibles a frecuencias normales", () => {
    const qt = (complexSpan(60).end - qrsSpan(60).onset) * 1000;
    expect(qt).toBeGreaterThan(350);
    expect(qt).toBeLessThan(450);
  });
});

describe("el complejo cabe en el latido", () => {
  it("nunca invade el latido siguiente", () => {
    for (const bpm of [...RATES, 220, 250]) {
      const interval = rr(bpm);
      expect(complexTiming(interval).durationSeconds).toBeLessThanOrEqual(interval);
    }
  });

  it("deja más silencio cuanto más lento va el corazón", () => {
    const silences = RATES.map((bpm) => rr(bpm) - complexTiming(rr(bpm)).durationSeconds);
    for (let i = 1; i < silences.length; i += 1) {
      expect(silences[i]).toBeLessThan(silences[i - 1]);
    }
  });
});

describe("beatSample", () => {
  const timing = complexTiming(rr(60));

  it("produce las cinco deflexiones del complejo P-QRS-T", () => {
    expect(beatSample(0.05, timing)).toBeGreaterThan(0.1); // P
    expect(beatSample(0.17, timing)).toBeLessThan(0); // Q
    expect(beatSample(0.196, timing)).toBeGreaterThan(0.9); // R
    expect(beatSample(0.229, timing)).toBeLessThan(0); // S
    expect(beatSample(0.446, timing)).toBeGreaterThan(0.2); // T
  });

  it("es línea isoeléctrica fuera del complejo", () => {
    expect(beatSample(-0.01, timing)).toBe(0);
    expect(beatSample(timing.durationSeconds + 0.01, timing)).toBe(0);
  });

  it("escala con la amplitud", () => {
    const half = complexTiming(rr(60), { ...SINUS_MORPHOLOGY, amplitude: 0.5 });
    expect(beatSample(0.196, half)).toBeCloseTo(beatSample(0.196, timing) * 0.5, 10);
  });
});

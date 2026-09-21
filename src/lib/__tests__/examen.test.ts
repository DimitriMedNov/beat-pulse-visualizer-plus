import { describe, expect, it } from "vitest";

import {
  EMPTY_SCORE,
  grade,
  hitRate,
  nextCase,
  pickCase,
  randomRate,
  type Score,
} from "@/lib/examen";
import {
  BRADYCARDIA_BELOW,
  BPM_MAX,
  BPM_MIN,
  plainRateLabel,
  RHYTHMS,
  RHYTHM_IDS,
  TACHYCARDIA_ABOVE,
} from "@/lib/rhythms";

const semillas = Array.from({ length: 400 }, (_, i) => i * 13 + 1);

describe("randomRate", () => {
  it("se queda dentro del rango plausible del ritmo", () => {
    for (const id of RHYTHM_IDS) {
      const rhythm = RHYTHMS[id];
      for (const semilla of semillas) {
        const bpm = randomRate(rhythm, semilla);
        expect(bpm).toBeGreaterThanOrEqual(rhythm.bpmRange.min);
        expect(bpm).toBeLessThanOrEqual(rhythm.bpmRange.max);
      }
    }
  });

  it("nunca se sale del rango del deslizador", () => {
    for (const id of RHYTHM_IDS) {
      for (const semilla of semillas) {
        const bpm = randomRate(RHYTHMS[id], semilla);
        expect(bpm).toBeGreaterThanOrEqual(BPM_MIN);
        expect(bpm).toBeLessThanOrEqual(BPM_MAX);
      }
    }
  });

  it("no delata ni contradice el diagnóstico en los ritmos donde la frecuencia cuenta", () => {
    // La frecuencia se sigue mostrando en examen, así que una bradicardia tiene
    // que salir siempre lenta y una taquicardia siempre rápida.
    for (const semilla of semillas) {
      expect(randomRate(RHYTHMS.bradycardia, semilla)).toBeLessThan(BRADYCARDIA_BELOW);
      expect(randomRate(RHYTHMS.tachycardia, semilla)).toBeGreaterThan(TACHYCARDIA_ABOVE);
      const normal = randomRate(RHYTHMS.normal, semilla);
      expect(normal).toBeGreaterThanOrEqual(BRADYCARDIA_BELOW);
      expect(normal).toBeLessThanOrEqual(TACHYCARDIA_ABOVE);
    }
  });

  it("es reproducible", () => {
    for (const semilla of semillas) {
      expect(randomRate(RHYTHMS.normal, semilla)).toBe(randomRate(RHYTHMS.normal, semilla));
    }
  });

  it("varía de una semilla a otra", () => {
    const vistos = new Set(semillas.map((s) => randomRate(RHYTHMS.tachycardia, s)));
    expect(vistos.size).toBeGreaterThan(20);
  });
});

describe("pickCase", () => {
  it("es reproducible", () => {
    for (const semilla of semillas) expect(pickCase(semilla)).toEqual(pickCase(semilla));
  });

  it("plantea siempre un ritmo del catálogo con su frecuencia dentro de rango", () => {
    for (const semilla of semillas) {
      const caso = pickCase(semilla);
      expect(RHYTHM_IDS).toContain(caso.rhythmId);
      const rango = RHYTHMS[caso.rhythmId].bpmRange;
      expect(caso.bpm).toBeGreaterThanOrEqual(rango.min);
      expect(caso.bpm).toBeLessThanOrEqual(rango.max);
    }
  });

  it("acaba preguntando por los siete ritmos", () => {
    const vistos = new Set(semillas.map((s) => pickCase(s).rhythmId));
    expect(vistos.size).toBe(RHYTHM_IDS.length);
  });
});

describe("nextCase", () => {
  it("nunca repite el ritmo que se acaba de ver", () => {
    let caso = pickCase(1);
    for (const semilla of semillas) {
      const siguiente = nextCase(caso, semilla);
      expect(siguiente.rhythmId).not.toBe(caso.rhythmId);
      caso = siguiente;
    }
  });

  it("es reproducible", () => {
    const caso = pickCase(5);
    for (const semilla of semillas) {
      expect(nextCase(caso, semilla)).toEqual(nextCase(caso, semilla));
    }
  });
});

describe("grade", () => {
  it("cuenta el intento acierte o falle", () => {
    expect(grade(EMPTY_SCORE, true).attempts).toBe(1);
    expect(grade(EMPTY_SCORE, false).attempts).toBe(1);
  });

  it("suma acierto sólo cuando toca", () => {
    expect(grade(EMPTY_SCORE, true).hits).toBe(1);
    expect(grade(EMPTY_SCORE, false).hits).toBe(0);
  });

  it("alarga la racha con cada acierto seguido", () => {
    let score = EMPTY_SCORE;
    for (let i = 1; i <= 5; i += 1) {
      score = grade(score, true);
      expect(score.streak).toBe(i);
    }
  });

  it("corta la racha al fallar, pero conserva el mejor registro", () => {
    let score = EMPTY_SCORE;
    for (let i = 0; i < 4; i += 1) score = grade(score, true);
    score = grade(score, false);

    expect(score.streak).toBe(0);
    expect(score.bestStreak).toBe(4);
    expect(score.attempts).toBe(5);
    expect(score.hits).toBe(4);
  });

  it("no toca el marcador anterior", () => {
    const antes: Score = { ...EMPTY_SCORE };
    grade(antes, true);
    expect(antes).toEqual(EMPTY_SCORE);
  });
});

describe("hitRate", () => {
  it("empieza en cero sin intentos", () => {
    expect(hitRate(EMPTY_SCORE)).toBe(0);
  });

  it("redondea el porcentaje", () => {
    expect(hitRate({ attempts: 4, hits: 3, streak: 0, bestStreak: 3 })).toBe(75);
    expect(hitRate({ attempts: 3, hits: 1, streak: 0, bestStreak: 1 })).toBe(33);
    expect(hitRate({ attempts: 7, hits: 7, streak: 7, bestStreak: 7 })).toBe(100);
  });
});

describe("la frecuencia mostrada en examen no delata el ritmo", () => {
  it("omite la nota de irregularidad, que reduciría siete opciones a cuatro", () => {
    for (const id of RHYTHM_IDS) {
      const rhythm = { ...RHYTHMS[id], bpm: 94 };
      expect(plainRateLabel(rhythm)).toBe("94 BPM");
      expect(plainRateLabel(rhythm)).not.toContain("irregular");
      expect(plainRateLabel(rhythm)).not.toContain("~");
    }
  });

  it("los ritmos irregulares y los regulares se ven idénticos en esa etiqueta", () => {
    const irregular = { ...RHYTHMS.atrialFibrillation, bpm: 88 };
    const regular = { ...RHYTHMS.normal, bpm: 88 };
    expect(plainRateLabel(irregular)).toBe(plainRateLabel(regular));
  });
});

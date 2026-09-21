import { describe, expect, it } from "vitest";

import {
  beatMs,
  beatSeconds,
  breathsPerMinute,
  DEFAULT_RHYTHM,
  getRhythm,
  rateLabel,
  RHYTHMS,
  RHYTHM_IDS,
} from "@/lib/rhythms";

describe("getRhythm", () => {
  it("devuelve el ritmo pedido", () => {
    for (const id of RHYTHM_IDS) {
      expect(getRhythm(id).id).toBe(id);
    }
  });

  it("cae en el ritmo por defecto ante un id desconocido", () => {
    expect(getRhythm("no-existe").id).toBe(DEFAULT_RHYTHM);
    expect(getRhythm("").id).toBe(DEFAULT_RHYTHM);
  });
});

describe("duración del latido", () => {
  it("se deriva del bpm y de nada más", () => {
    expect(beatSeconds(RHYTHMS.normal)).toBeCloseTo(60 / 75, 10);
    expect(beatSeconds(RHYTHMS.bradycardia)).toBeCloseTo(60 / 45, 10);
    expect(beatSeconds(RHYTHMS.tachycardia)).toBeCloseTo(60 / 120, 10);
    expect(beatMs(RHYTHMS.normal)).toBeCloseTo(beatSeconds(RHYTHMS.normal) * 1000, 10);
  });

  it("la bradicardia es más lenta que la normal y la taquicardia más rápida", () => {
    expect(beatSeconds(RHYTHMS.bradycardia)).toBeGreaterThan(beatSeconds(RHYTHMS.normal));
    expect(beatSeconds(RHYTHMS.tachycardia)).toBeLessThan(beatSeconds(RHYTHMS.normal));
  });
});

describe("etiquetas y frecuencia respiratoria", () => {
  it("la frecuencia mostrada sale del mismo bpm que mueve la animación", () => {
    expect(rateLabel(RHYTHMS.normal)).toBe("75 BPM");
    expect(rateLabel(RHYTHMS.tachycardia)).toBe("120 BPM");
    expect(rateLabel(RHYTHMS.sinusArrhythmia)).toContain("irregular");
  });

  it("acota la respiración a un rango fisiológico", () => {
    for (const id of RHYTHM_IDS) {
      const breaths = breathsPerMinute(RHYTHMS[id]);
      expect(breaths).toBeGreaterThanOrEqual(8);
      expect(breaths).toBeLessThanOrEqual(30);
    }
  });
});

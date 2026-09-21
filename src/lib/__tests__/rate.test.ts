import { describe, expect, it } from "vitest";

import { ECGEngine } from "@/lib/ecgEngine";
import {
  BPM_MAX,
  BPM_MIN,
  BRADYCARDIA_BELOW,
  TACHYCARDIA_ABOVE,
  beatSeconds,
  clampBpm,
  rateLabel,
  RHYTHMS,
  rhythmForRate,
  withRate,
} from "@/lib/rhythms";

function run(engine: ECGEngine, seconds: number, fps = 60): number {
  const frame = 1 / fps;
  let beats = 0;
  for (let t = 0; t < seconds - 1e-9; t += frame) beats += engine.advance(frame);
  return beats;
}

describe("rhythmForRate", () => {
  it("pone la frontera de la bradicardia en 60 lpm", () => {
    expect(rhythmForRate(BRADYCARDIA_BELOW - 1)).toBe("bradycardia");
    expect(rhythmForRate(BRADYCARDIA_BELOW)).toBe("normal");
  });

  it("pone la frontera de la taquicardia en 100 lpm", () => {
    expect(rhythmForRate(TACHYCARDIA_ABOVE)).toBe("normal");
    expect(rhythmForRate(TACHYCARDIA_ABOVE + 1)).toBe("tachycardia");
  });

  it("clasifica los extremos del deslizador", () => {
    expect(rhythmForRate(BPM_MIN)).toBe("bradycardia");
    expect(rhythmForRate(BPM_MAX)).toBe("tachycardia");
  });
});

describe("clampBpm", () => {
  it("acota al rango del deslizador y redondea", () => {
    expect(clampBpm(BPM_MIN - 50)).toBe(BPM_MIN);
    expect(clampBpm(BPM_MAX + 50)).toBe(BPM_MAX);
    expect(clampBpm(74.6)).toBe(75);
  });
});

describe("withRate", () => {
  it("sobrescribe la frecuencia sin tocar el resto del ritmo", () => {
    const tuned = withRate(RHYTHMS.normal, 130);
    expect(tuned.bpm).toBe(130);
    expect(tuned.id).toBe("normal");
    expect(tuned.color).toBe(RHYTHMS.normal.color);
    expect(tuned.irregular).toBe(false);
  });

  it("devuelve el mismo objeto si la frecuencia no cambia", () => {
    expect(withRate(RHYTHMS.normal, RHYTHMS.normal.bpm)).toBe(RHYTHMS.normal);
  });

  it("arrastra consigo la etiqueta de frecuencia", () => {
    expect(rateLabel(withRate(RHYTHMS.normal, 130))).toBe("130 BPM");
    expect(rateLabel(withRate(RHYTHMS.sinusArrhythmia, 55))).toContain("55");
  });
});

describe("el motor sigue a la frecuencia del deslizador", () => {
  it("late al ritmo sobrescrito, no al del diccionario", () => {
    for (const bpm of [BPM_MIN, 50, 75, 110, 160, BPM_MAX]) {
      const engine = new ECGEngine(withRate(RHYTHMS.normal, bpm));
      const seconds = 30;
      const beats = run(engine, seconds);
      expect(beats).toBeCloseTo(seconds / beatSeconds(withRate(RHYTHMS.normal, bpm)), -0.5);
    }
  });

  it("dibuja un complejo válido en todo el recorrido del deslizador", () => {
    for (let bpm = BPM_MIN; bpm <= BPM_MAX; bpm += 10) {
      const engine = new ECGEngine(withRate(RHYTHMS.normal, bpm));
      run(engine, 8);
      let peak = -Infinity;
      for (let i = 0; i < engine.length; i += 1) peak = Math.max(peak, engine.at(i));
      expect(peak).toBeGreaterThan(0.9);
    }
  });
});

describe("updateRhythm", () => {
  it("cambia la frecuencia sin borrar lo que hay en pantalla", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    run(engine, 6);
    const before = engine.snapshot();

    engine.updateRhythm(withRate(RHYTHMS.normal, 160));

    const after = engine.snapshot();
    expect(after.length).toBe(before.length);
    // El búfer sigue intacto: ni una muestra se ha movido.
    expect(Array.from(after)).toEqual(Array.from(before));
    expect(engine.beatCount).toBeGreaterThan(0);
  });

  it("aplica la frecuencia nueva en el latido siguiente", () => {
    const engine = new ECGEngine(withRate(RHYTHMS.normal, 40));
    run(engine, 6);
    const slow = engine.beatCount;

    engine.updateRhythm(withRate(RHYTHMS.normal, 180));
    run(engine, 6);
    const fast = engine.beatCount - slow;

    // 6 s a 180 lpm son 18 latidos; con uno de margen por la transición.
    expect(fast).toBeGreaterThanOrEqual(16);
  });

  it("nunca recorta el complejo que se está dibujando", () => {
    const engine = new ECGEngine(withRate(RHYTHMS.normal, 40));
    run(engine, 6);
    // Subir de golpe a 200 no debe dejar el QRS a medias.
    engine.updateRhythm(withRate(RHYTHMS.normal, BPM_MAX));
    run(engine, 6);

    let peak = -Infinity;
    for (let i = 0; i < engine.length; i += 1) peak = Math.max(peak, engine.at(i));
    expect(peak).toBeGreaterThan(0.9);
  });

  it("setRhythm sí limpia, updateRhythm no", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    run(engine, 6);

    engine.setRhythm(RHYTHMS.tachycardia);
    expect(engine.beatCount).toBe(0);
    for (let i = 0; i < engine.length; i += 1) expect(engine.at(i)).toBe(0);
  });
});

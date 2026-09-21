import { describe, expect, it } from "vitest";

import { ECGEngine, SAMPLE_RATE, WINDOW_SECONDS } from "@/lib/ecgEngine";
import { beatSeconds, RHYTHMS, type Rhythm } from "@/lib/rhythms";

/** Simula `seconds` de reloj a `fps` cuadros por segundo. */
function run(engine: ECGEngine, seconds: number, fps: number): number {
  const frame = 1 / fps;
  let beats = 0;
  for (let t = 0; t < seconds - 1e-9; t += frame) {
    beats += engine.advance(frame);
  }
  return beats;
}

function peak(engine: ECGEngine): number {
  let max = -Infinity;
  for (let i = 0; i < engine.length; i += 1) max = Math.max(max, engine.at(i));
  return max;
}

describe("ventana del trazo", () => {
  it("arranca llena de línea isoeléctrica, así que ocupa todo el ancho", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    expect(engine.length).toBe(SAMPLE_RATE * WINDOW_SECONDS);
    for (let i = 0; i < engine.length; i += 1) expect(engine.at(i)).toBe(0);
  });

  it("nunca crece por encima de la ventana", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    run(engine, 30, 60);
    expect(engine.length).toBe(engine.capacity);
  });
});

describe("independencia de los FPS", () => {
  // Esta era la regresión: al añadir un punto por frame, la onda dependía de a
  // cuántos Hz fuese la pantalla, y a pocos FPS el complejo QRS desaparecía.
  it("conserva la onda R tanto a 15 fps como a 144 fps", () => {
    for (const fps of [15, 30, 60, 144]) {
      const engine = new ECGEngine(RHYTHMS.normal);
      run(engine, 4, fps);
      expect(peak(engine)).toBeGreaterThan(0.9);
    }
  });

  it("produce la misma señal con cuadros grandes que con cuadros pequeños", () => {
    const slow = new ECGEngine(RHYTHMS.normal);
    const fast = new ECGEngine(RHYTHMS.normal);
    run(slow, 5, 20);
    run(fast, 5, 120);

    expect(slow.beatCount).toBe(fast.beatCount);

    const a = slow.snapshot();
    const b = fast.snapshot();
    // Como mucho una muestra de desfase por el redondeo del acumulador.
    let maxDiff = 0;
    for (let i = 1; i < a.length - 1; i += 1) {
      maxDiff = Math.max(maxDiff, Math.min(
        Math.abs(a[i] - b[i]),
        Math.abs(a[i] - b[i - 1]),
        Math.abs(a[i] - b[i + 1]),
      ));
    }
    expect(maxDiff).toBeLessThan(0.02);
  });

  it("no intenta recuperar el tiempo perdido tras un salto enorme", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    const beats = engine.advance(600);
    expect(beats).toBeLessThan(2);
  });
});

describe("conteo de latidos", () => {
  it("cuenta los latidos que dicta el bpm de cada ritmo regular", () => {
    for (const rhythm of [RHYTHMS.normal, RHYTHMS.bradycardia, RHYTHMS.tachycardia]) {
      const engine = new ECGEngine(rhythm);
      const seconds = 20;
      const beats = run(engine, seconds, 60);
      expect(beats).toBe(engine.beatCount);
      expect(beats).toBeCloseTo(seconds / beatSeconds(rhythm), -0.5);
    }
  });

  it("reinicia el trazo y el contador", () => {
    const engine = new ECGEngine(RHYTHMS.tachycardia);
    run(engine, 5, 60);
    expect(engine.beatCount).toBeGreaterThan(0);

    engine.reset();
    expect(engine.beatCount).toBe(0);
    expect(peak(engine)).toBe(0);
  });
});

describe("arritmia", () => {
  it("es reproducible entre ejecuciones", () => {
    const a = new ECGEngine(RHYTHMS.sinusArrhythmia);
    const b = new ECGEngine(RHYTHMS.sinusArrhythmia);
    run(a, 8, 60);
    run(b, 8, 60);
    expect(Array.from(a.snapshot())).toEqual(Array.from(b.snapshot()));
  });

  it("cambia de ritmo limpiando lo anterior", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    run(engine, 5, 60);
    engine.setRhythm(RHYTHMS.sinusArrhythmia);
    expect(engine.beatCount).toBe(0);
    expect(peak(engine)).toBe(0);
  });
});

describe("el complejo dibujado no depende de la frecuencia", () => {
  /** Ancho del QRS medido sobre el búfer ya renderizado, en milisegundos. */
  function renderedQrsMs(rhythm: Rhythm, sampleRate = SAMPLE_RATE): number {
    const engine = new ECGEngine(rhythm, sampleRate, WINDOW_SECONDS);
    run(engine, 12, 60);

    let peakAt = 0;
    let peakValue = -Infinity;
    for (let i = 0; i < engine.length; i += 1) {
      if (engine.at(i) > peakValue) {
        peakValue = engine.at(i);
        peakAt = i;
      }
    }

    let onset = peakAt;
    let offset = peakAt;
    // Umbral relativo al pico R de ESE latido: así se mide la forma del complejo
    // y no su ganancia, que en la arritmia sinusal varía un poco de latido a latido.
    const threshold = 0.04 * peakValue;
    // Se sale del QRS cuando hay una racha en la línea de base, no al primer
    // cruce: entre la Q y la R la señal pasa cerca de cero.
    const runLength = Math.max(2, Math.round(sampleRate / 60));
    const quiet = (i: number) => {
      for (let k = 0; k < runLength; k += 1) {
        if (Math.abs(engine.at(i - k)) > threshold) return false;
      }
      return true;
    };
    while (onset > runLength && !quiet(onset)) onset -= 1;
    while (offset < engine.length - runLength - 1 && !quiet(offset + runLength)) offset += 1;
    return ((offset - onset) / sampleRate) * 1000;
  }

  it("dibuja el mismo QRS en bradicardia, normal y taquicardia", () => {
    const widths = [RHYTHMS.bradycardia, RHYTHMS.normal, RHYTHMS.tachycardia].map((r) =>
      renderedQrsMs(r),
    );
    expect(Math.max(...widths) - Math.min(...widths)).toBe(0);
    expect(widths[0]).toBeGreaterThanOrEqual(80);
    expect(widths[0]).toBeLessThanOrEqual(100);
  });

  it("tampoco lo deforma la arritmia sinusal", () => {
    // A 250 Hz cada muestra son 4 ms y cada extremo puede caer en una muestra u
    // otra según dónde empiece el latido, así que la holgura es de dos muestras.
    const displayDiff = Math.abs(
      renderedQrsMs(RHYTHMS.sinusArrhythmia) - renderedQrsMs(RHYTHMS.normal),
    );
    expect(displayDiff).toBeLessThanOrEqual(8);

    // Fuera de la rejilla de muestreo la diferencia real es despreciable: el
    // complejo es el mismo, sólo cambia el intervalo entre latidos.
    const trueDiff = Math.abs(
      renderedQrsMs(RHYTHMS.sinusArrhythmia, 16000) - renderedQrsMs(RHYTHMS.normal, 16000),
    );
    expect(trueDiff).toBeLessThan(2);
  });

  it("deja más línea isoeléctrica cuanto más lento va el corazón", () => {
    const baselineFraction = (rhythm: Rhythm) => {
      const engine = new ECGEngine(rhythm);
      run(engine, 12, 60);
      let quiet = 0;
      for (let i = 0; i < engine.length; i += 1) {
        if (Math.abs(engine.at(i)) < 0.03) quiet += 1;
      }
      return quiet / engine.length;
    };

    expect(baselineFraction(RHYTHMS.bradycardia)).toBeGreaterThan(
      baselineFraction(RHYTHMS.normal),
    );
    expect(baselineFraction(RHYTHMS.normal)).toBeGreaterThan(
      baselineFraction(RHYTHMS.tachycardia),
    );
  });
});

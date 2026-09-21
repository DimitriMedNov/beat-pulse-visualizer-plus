import { describe, expect, it } from "vitest";

import {
  atrialFibrillationBeats,
  mobitzOneBeats,
  pvcBeats,
  sinusArrhythmiaBeats,
  sinusBeats,
} from "@/lib/beats";
import { ECGEngine, SAMPLE_RATE } from "@/lib/ecgEngine";
import { PR_SECONDS, QRS_SECONDS } from "@/lib/ecgWaveform";
import { RHYTHMS, RHYTHM_IDS, type Rhythm } from "@/lib/rhythms";

const indices = (n: number) => Array.from({ length: n }, (_, i) => i);

function render(rhythm: Rhythm, seconds = 12) {
  const engine = new ECGEngine(rhythm);
  const frame = 1 / 60;
  for (let t = 0; t < seconds; t += frame) engine.advance(frame);
  return engine;
}

describe("catálogo", () => {
  it("expone las siete familias", () => {
    expect(RHYTHM_IDS).toHaveLength(7);
    for (const id of RHYTHM_IDS) expect(RHYTHMS[id].id).toBe(id);
  });

  it("sólo los tres sinusales siguen a la frecuencia del deslizador", () => {
    const following = RHYTHM_IDS.filter((id) => RHYTHMS[id].followsRate);
    expect(following).toEqual(["normal", "bradycardia", "tachycardia"]);
  });

  it("cada familia trae su propio generador y su propio color", () => {
    const colors = new Set(RHYTHM_IDS.map((id) => RHYTHMS[id].color));
    expect(colors.size).toBe(RHYTHM_IDS.length);
    for (const id of RHYTHM_IDS) expect(typeof RHYTHMS[id].beats).toBe("function");
  });

  it("todos los generadores son deterministas", () => {
    for (const id of RHYTHM_IDS) {
      const beats = RHYTHMS[id].beats;
      for (const i of indices(40)) expect(beats(i)).toEqual(beats(i));
    }
  });
});

describe("ritmo sinusal", () => {
  it("es perfectamente regular y siempre igual", () => {
    for (const i of indices(40)) {
      const beat = sinusBeats(i);
      expect(beat.rrScale).toBe(1);
      expect(beat.morphology.hasPWave).toBe(true);
      expect(beat.morphology.hasQrs).toBe(true);
      expect(beat.morphology.prSeconds).toBe(PR_SECONDS);
      expect(beat.morphology.qrsWidthScale).toBe(1);
    }
  });
});

describe("arritmia sinusal", () => {
  it("varía el intervalo de forma ondulada, no caótica", () => {
    const scales = indices(60).map((i) => sinusArrhythmiaBeats(i).rrScale);
    // Ondulada: los cambios de un latido al siguiente son suaves y acotados.
    for (let i = 1; i < scales.length; i += 1) {
      expect(Math.abs(scales[i] - scales[i - 1])).toBeLessThan(0.3);
    }
    expect(Math.max(...scales) - Math.min(...scales)).toBeGreaterThan(0.25);
  });

  it("conserva las ondas P y el complejo normal", () => {
    for (const i of indices(40)) {
      const { morphology } = sinusArrhythmiaBeats(i);
      expect(morphology.hasPWave).toBe(true);
      expect(morphology.qrsWidthScale).toBe(1);
    }
  });
});

describe("fibrilación auricular", () => {
  it("no tiene ondas P en ningún latido", () => {
    for (const i of indices(60)) {
      expect(atrialFibrillationBeats(i).morphology.hasPWave).toBe(false);
    }
  });

  it("es irregularmente irregular: los saltos no son suaves", () => {
    const scales = indices(60).map((i) => atrialFibrillationBeats(i).rrScale);
    const jumps = scales.slice(1).map((v, i) => Math.abs(v - scales[i]));
    const big = jumps.filter((j) => j > 0.3).length;
    // A diferencia de la arritmia sinusal, aquí abundan los saltos grandes.
    expect(big).toBeGreaterThan(jumps.length / 4);
  });

  it("hace temblar la línea de base con ondas f", () => {
    // Mismo ritmo, misma secuencia de latidos, con y sin temblor: la diferencia
    // entre los dos trazos es exactamente la contribución de las ondas f.
    const withNoise = render(RHYTHMS.atrialFibrillation);
    const without = render({ ...RHYTHMS.atrialFibrillation, baselineNoise: 0 });

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < withNoise.length; i += 1) {
      const d = withNoise.at(i) - without.at(i);
      sum += d * d;
      peak = Math.max(peak, Math.abs(d));
    }
    const rms = Math.sqrt(sum / withNoise.length);

    expect(rms).toBeGreaterThan(0.01);
    expect(peak).toBeGreaterThan(0.03);
    // Pero sin llegar a tapar el complejo: la onda R vale 1.
    expect(peak).toBeLessThan(0.08);
  });

  it("es el único ritmo que tiembla", () => {
    for (const id of RHYTHM_IDS) {
      if (id === "atrialFibrillation") continue;
      expect(RHYTHMS[id].baselineNoise).toBe(0);
    }
  });

  it("el temblor es determinista", () => {
    const a = render(RHYTHMS.atrialFibrillation);
    const b = render(RHYTHMS.atrialFibrillation);
    expect(Array.from(a.snapshot())).toEqual(Array.from(b.snapshot()));
  });
});

describe("extrasístole ventricular", () => {
  const cycle = indices(21).map(pvcBeats);
  const wide = cycle.filter((b) => b.morphology.qrsWidthScale > 1.5);

  it("intercala complejos anchos entre latidos normales", () => {
    expect(wide).toHaveLength(3); // uno cada siete, en 21 latidos
    for (const beat of wide) {
      expect(beat.morphology.qrsWidthScale).toBeGreaterThan(2);
      expect(beat.morphology.hasPWave).toBe(false);
    }
  });

  it("le pone la onda T discordante, al revés que el QRS", () => {
    for (const beat of wide) {
      expect(beat.morphology.tPolarity).toBe(-beat.morphology.qrsPolarity);
    }
    expect(sinusBeats(0).morphology.tPolarity).toBe(sinusBeats(0).morphology.qrsPolarity);
  });

  it("adelanta la extrasístole y la sigue de una pausa compensadora completa", () => {
    const early = pvcBeats(2).rrScale; // el latido previo se acorta
    const pause = pvcBeats(3).rrScale; // la extrasístole arrastra la pausa

    expect(early).toBeLessThan(1);
    expect(pause).toBeGreaterThan(1.5);
    // Juntos suman dos intervalos normales: el ritmo de fondo no se desplaza.
    expect(early + pause).toBeCloseTo(2.4, 1);
  });

  it("dibuja un complejo mucho más ancho que el sinusal", () => {
    const engine = render(RHYTHMS.pvc, 16);
    let peak = -Infinity;
    for (let i = 0; i < engine.length; i += 1) peak = Math.max(peak, engine.at(i));
    // La extrasístole es la deflexión más alta del trazo.
    expect(peak).toBeGreaterThan(1.1);
  });
});

describe("bloqueo AV Mobitz I", () => {
  const cycle = indices(8).map(mobitzOneBeats);

  it("alarga el PR latido a latido", () => {
    const conducted = cycle.filter((b) => b.morphology.hasQrs);
    const prs = conducted.slice(0, 3).map((b) => b.morphology.prSeconds);
    expect(prs[0]).toBeLessThan(prs[1]);
    expect(prs[1]).toBeLessThan(prs[2]);
    expect(prs[0]).toBeGreaterThanOrEqual(0.12);
  });

  it("deja caer un latido de cada cuatro", () => {
    const dropped = cycle.filter((b) => !b.morphology.hasQrs);
    expect(dropped).toHaveLength(2); // dos ciclos de cuatro
  });

  it("en el latido caído se ve la onda P sola, sin QRS detrás", () => {
    const dropped = cycle.find((b) => !b.morphology.hasQrs);
    expect(dropped?.morphology.hasPWave).toBe(true);
    expect(dropped?.morphology.hasQrs).toBe(false);
  });

  it("mantiene constante el intervalo P-P", () => {
    // La firma del Wenckebach: las P son regulares; lo que se agrupa son los QRS.
    for (const beat of cycle) expect(beat.rrScale).toBe(1);
  });

  it("dibuja menos complejos que latidos, porque uno de cada cuatro no conduce", () => {
    const engine = render(RHYTHMS.mobitz1, 16);
    let peaks = 0;
    for (let i = 1; i < engine.length - 1; i += 1) {
      if (engine.at(i) > 0.5 && engine.at(i) >= engine.at(i - 1) && engine.at(i) > engine.at(i + 1)) {
        peaks += 1;
      }
    }
    const windowSeconds = engine.length / SAMPLE_RATE;
    const expectedPs = (windowSeconds * RHYTHMS.mobitz1.bpm) / 60;
    expect(peaks).toBeLessThan(expectedPs);
    expect(peaks).toBeGreaterThan(expectedPs * 0.5);
  });
});

describe("el complejo sigue siendo rígido en todas las familias", () => {
  it("ningún ritmo deforma el QRS salvo la extrasístole, que lo ensancha a propósito", () => {
    for (const id of RHYTHM_IDS) {
      const beats = RHYTHMS[id].beats;
      for (const i of indices(30)) {
        const { qrsWidthScale } = beats(i).morphology;
        if (id === "pvc") expect(qrsWidthScale).toBeGreaterThanOrEqual(1);
        else expect(qrsWidthScale).toBe(1);
      }
    }
  });

  it("el QRS normal sigue midiendo lo que debe", () => {
    expect(QRS_SECONDS * 1000).toBeGreaterThanOrEqual(80);
    expect(QRS_SECONDS * 1000).toBeLessThanOrEqual(100);
  });
});

describe("cambiar de familia en marcha", () => {
  // Lo valioso es ver el cambio ocurrir, así que cambiar de ritmo no debe borrar
  // lo que ya está en pantalla. Sólo el botón Reiniciar limpia.
  it("conserva intacto el trazo anterior", () => {
    const engine = render(RHYTHMS.normal);
    const before = Array.from(engine.snapshot());

    engine.updateRhythm(RHYTHMS.atrialFibrillation);

    expect(Array.from(engine.snapshot())).toEqual(before);
    expect(engine.beatCount).toBeGreaterThan(0);
  });

  it("aplica la familia nueva a partir de ahí", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    const frame = 1 / 60;
    for (let t = 0; t < 12; t += frame) engine.advance(frame);

    engine.updateRhythm(RHYTHMS.atrialFibrillation);
    // Se deja correr lo bastante para que la ventana entera sea ya fibrilación.
    for (let t = 0; t < 12; t += frame) engine.advance(frame);

    const withNoise = Array.from(engine.snapshot());
    const clean = render({ ...RHYTHMS.atrialFibrillation, baselineNoise: 0 }, 24);
    // El temblor de las ondas f ya está presente: es fibrilación, no sinusal.
    expect(withNoise).not.toEqual(Array.from(clean.snapshot()));
  });

  it("no deja el complejo en curso a medias al cambiar", () => {
    const engine = render(RHYTHMS.bradycardia);
    engine.updateRhythm(RHYTHMS.pvc);
    const frame = 1 / 60;
    for (let t = 0; t < 16; t += frame) engine.advance(frame);

    let peak = -Infinity;
    for (let i = 0; i < engine.length; i += 1) peak = Math.max(peak, engine.at(i));
    expect(peak).toBeGreaterThan(1.1); // la extrasístole ya aparece, entera
  });

  it("sólo reset limpia la pantalla", () => {
    const engine = render(RHYTHMS.pvc);
    engine.reset();
    for (let i = 0; i < engine.length; i += 1) expect(engine.at(i)).toBe(0);
    expect(engine.beatCount).toBe(0);
  });
});

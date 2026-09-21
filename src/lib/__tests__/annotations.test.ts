import { describe, expect, it } from "vitest";

import { annotationsFor, type Annotation } from "@/lib/annotations";
import { ECGEngine, SAMPLE_RATE, WINDOW_SECONDS, type BeatMark } from "@/lib/ecgEngine";
import { RHYTHMS, RHYTHM_IDS, type Rhythm, type RhythmId } from "@/lib/rhythms";

/** Deja correr el motor y devuelve sus marcas junto con las anotaciones. */
function analyse(rhythm: Rhythm, seconds = 20) {
  const engine = new ECGEngine(rhythm);
  const frame = 1 / 60;
  for (let t = 0; t < seconds; t += frame) engine.advance(frame);
  const marks = engine.beatMarks();
  return {
    engine,
    marks,
    annotations: annotationsFor(rhythm.id, marks, SAMPLE_RATE, engine.length),
  };
}

const intervals = (list: Annotation[]) => list.filter((a) => a.kind === "interval");
const points = (list: Annotation[]) => list.filter((a) => a.kind === "point");

describe("las marcas de latido del motor", () => {
  it("sitúa cada latido dentro de la ventana", () => {
    for (const id of RHYTHM_IDS) {
      const { engine, marks } = analyse(RHYTHMS[id]);
      expect(marks.length).toBeGreaterThan(0);
      for (const mark of marks) {
        expect(mark.index).toBeGreaterThanOrEqual(0);
        expect(mark.index).toBeLessThan(engine.length);
      }
    }
  });

  it("los ordena del más antiguo al más reciente, sin repetir posición", () => {
    const { marks } = analyse(RHYTHMS.normal);
    for (let i = 1; i < marks.length; i += 1) {
      expect(marks[i].index).toBeGreaterThan(marks[i - 1].index);
    }
  });

  it("caben en la ventana los latidos que dicta la frecuencia", () => {
    const { marks } = analyse(RHYTHMS.normal);
    // Seis segundos a 75 lpm son 7,5 latidos; se admite uno de margen por los bordes.
    expect(marks.length).toBeGreaterThanOrEqual(6);
    expect(marks.length).toBeLessThanOrEqual(9);
  });

  it("no crece sin fin: los que salen de pantalla se tiran", () => {
    const { marks } = analyse(RHYTHMS.tachycardia, 120);
    expect(marks.length).toBeLessThanOrEqual(Math.ceil((WINDOW_SECONDS * 200) / 60) + 2);
  });

  it("se vacían al reiniciar", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    const frame = 1 / 60;
    for (let t = 0; t < 10; t += frame) engine.advance(frame);
    expect(engine.beatMarks().length).toBeGreaterThan(0);

    engine.reset();
    expect(engine.beatMarks()).toEqual([]);
  });
});

describe("toda anotación cae dentro del trazo", () => {
  it("nunca se sale de la ventana ni se invierte", () => {
    for (const id of RHYTHM_IDS) {
      const { engine, annotations } = analyse(RHYTHMS[id]);
      expect(annotations.length).toBeGreaterThan(0);
      for (const annotation of annotations) {
        expect(annotation.from).toBeGreaterThanOrEqual(0);
        expect(annotation.to).toBeLessThanOrEqual(engine.length);
        expect(annotation.to).toBeGreaterThanOrEqual(annotation.from);
        expect(annotation.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("un punto ocupa una sola muestra", () => {
    for (const id of RHYTHM_IDS) {
      const { annotations } = analyse(RHYTHMS[id]);
      for (const point of points(annotations)) expect(point.to).toBe(point.from);
    }
  });

  it("no marca nada si todavía no hay latidos completos", () => {
    expect(annotationsFor("normal", [], SAMPLE_RATE, 1500)).toEqual([]);
  });

  it("descarta los latidos cortados por el borde", () => {
    const mark: BeatMark = {
      index: 1400,
      rrSeconds: 0.8,
      morphology: RHYTHMS.normal.beats(0).morphology,
    };
    // El latido empieza a 1400 y necesita 200 muestras, pero la ventana son 1500.
    expect(annotationsFor("normal", [mark], SAMPLE_RATE, 1500)).toEqual([]);
  });
});

describe("cada ritmo señala su propio criterio", () => {
  it("en el normal marca dos R-R iguales y el PR", () => {
    const { annotations } = analyse(RHYTHMS.normal);
    const rr = intervals(annotations).filter((a) => a.label.startsWith("RR"));
    expect(rr).toHaveLength(2);
    // Regular quiere decir que los dos números coinciden.
    expect(rr[0].label).toBe(rr[1].label);
    expect(annotations.some((a) => a.label.startsWith("PR"))).toBe(true);
  });

  it("en la bradicardia el R-R marcado es largo y el PR sigue siendo normal", () => {
    const { annotations } = analyse(RHYTHMS.bradycardia);
    const rr = annotations.find((a) => a.label.startsWith("RR"));
    const pr = annotations.find((a) => a.label.startsWith("PR"));
    expect(rr?.label).toMatch(/1\d{3} ms/);
    expect(pr?.label).toBe("PR 160 ms");
  });

  it("en la taquicardia el R-R marcado es corto", () => {
    const { annotations } = analyse(RHYTHMS.tachycardia);
    const rr = annotations.find((a) => a.label.startsWith("RR"));
    expect(rr?.label).toMatch(/· 1[0-9]{2} lpm/);
  });

  it("en la arritmia sinusal marca varios R-R y son distintos entre sí", () => {
    const { annotations } = analyse(RHYTHMS.sinusArrhythmia);
    const etiquetas = new Set(annotations.map((a) => a.label));
    expect(annotations.length).toBeGreaterThanOrEqual(2);
    expect(etiquetas.size).toBe(annotations.length);
  });

  it("en la fibrilación señala dónde falta la onda P", () => {
    const { annotations } = analyse(RHYTHMS.atrialFibrillation);
    const punto = points(annotations)[0];
    expect(punto.label).toContain("onda P");
    expect(punto.row).toBe("top");
    // Y además intervalos desiguales, que es la otra firma.
    const rr = intervals(annotations).map((a) => a.label);
    expect(new Set(rr).size).toBe(rr.length);
  });

  it("en la extrasístole señala el complejo ancho y la pausa", () => {
    const { annotations } = analyse(RHYTHMS.pvc, 30);
    expect(points(annotations)[0].label).toContain("ancho");
    expect(annotations.some((a) => a.label.includes("pausa compensadora"))).toBe(true);
  });

  it("en el Mobitz marca el PR alargándose y la P que no conduce", () => {
    const { annotations } = analyse(RHYTHMS.mobitz1, 30);
    const pr = annotations
      .filter((a) => a.label.startsWith("PR"))
      .map((a) => Number(a.label.replace(/\D/g, "")));
    expect(pr.length).toBeGreaterThanOrEqual(2);
    // Crecen latido a latido, que es el fenómeno de Wenckebach.
    for (let i = 1; i < pr.length; i += 1) expect(pr[i]).toBeGreaterThan(pr[i - 1]);

    expect(points(annotations).some((a) => a.label.includes("sin QRS"))).toBe(true);
  });

  it("ningún ritmo se queda sin explicación", () => {
    for (const id of RHYTHM_IDS as RhythmId[]) {
      const { annotations } = analyse(RHYTHMS[id], 30);
      expect(annotations.length).toBeGreaterThan(0);
    }
  });
});

describe("el Mobitz elige el ciclo que mejor se ve", () => {
  const sinus = RHYTHMS.normal.beats(0).morphology;
  const conducido = (index: number, prSeconds: number): BeatMark => ({
    index,
    rrSeconds: 1,
    morphology: { ...sinus, prSeconds },
  });
  const caido = (index: number): BeatMark => ({
    index,
    rrSeconds: 1,
    morphology: { ...sinus, hasQrs: false },
  });

  it("prefiere el latido caído con más PR crecientes delante, no el último", () => {
    // La ventana entra a mitad de ciclo: el primer caído sólo tiene un latido
    // delante, el segundo tiene los tres del ciclo completo.
    const marks = [
      conducido(0, 0.28),
      caido(250),
      conducido(500, 0.16),
      conducido(750, 0.22),
      conducido(1000, 0.28),
      caido(1250),
    ];
    const anotaciones = annotationsFor("mobitz1", marks, SAMPLE_RATE, 1500);
    const pr = anotaciones.filter((a) => a.label.startsWith("PR")).map((a) => a.label);

    expect(pr).toEqual(["PR 160 ms", "PR 220 ms", "PR 280 ms"]);
    expect(anotaciones[anotaciones.length - 1].label).toContain("sin QRS");
  });

  it("se conforma con lo que haya si no cabe un ciclo entero", () => {
    const marks = [conducido(0, 0.28), caido(250)];
    const anotaciones = annotationsFor("mobitz1", marks, SAMPLE_RATE, 1500);
    expect(anotaciones.filter((a) => a.label.startsWith("PR"))).toHaveLength(1);
    expect(anotaciones.some((a) => a.label.includes("sin QRS"))).toBe(true);
  });
});

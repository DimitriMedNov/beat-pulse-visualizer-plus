import { describe, expect, it } from "vitest";

import { ECGEngine, type BeatEvent } from "@/lib/ecgEngine";
import { toneForBeat } from "@/lib/heartSound";
import { RHYTHMS, RHYTHM_IDS, type Rhythm } from "@/lib/rhythms";

/** Recoge los eventos de latido de `seconds` de simulación. */
function beatEvents(rhythm: Rhythm, seconds = 30): BeatEvent[] {
  const engine = new ECGEngine(rhythm);
  const events: BeatEvent[] = [];
  engine.onBeatStarted = (event) => events.push(event);
  const frame = 1 / 60;
  for (let t = 0; t < seconds; t += frame) engine.advance(frame);
  return events;
}

describe("qué suena en cada latido", () => {
  it("un latido normal da un bip agudo y corto", () => {
    const tone = toneForBeat({ conducted: true, ventricular: false });
    expect(tone).not.toBeNull();
    expect(tone!.frequency).toBeGreaterThan(700);
    expect(tone!.duration).toBeLessThan(0.1);
  });

  it("un latido ventricular suena más grave y más largo", () => {
    const normal = toneForBeat({ conducted: true, ventricular: false })!;
    const ventricular = toneForBeat({ conducted: true, ventricular: true })!;
    expect(ventricular.frequency).toBeLessThan(normal.frequency);
    expect(ventricular.duration).toBeGreaterThan(normal.duration);
  });

  it("un latido que no conduce no suena: el hueco es lo que hay que oír", () => {
    expect(toneForBeat({ conducted: false, ventricular: false })).toBeNull();
    expect(toneForBeat({ conducted: false, ventricular: true })).toBeNull();
  });

  it("nunca sube el volumen por encima de lo razonable", () => {
    for (const event of [
      { conducted: true, ventricular: false },
      { conducted: true, ventricular: true },
    ]) {
      const tone = toneForBeat(event);
      expect(tone!.level).toBeGreaterThan(0);
      expect(tone!.level).toBeLessThanOrEqual(0.2);
    }
  });
});

describe("el motor avisa de cada latido", () => {
  it("emite un evento por latido, en el mismo número que cuenta", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    let events = 0;
    engine.onBeatStarted = () => {
      events += 1;
    };
    const frame = 1 / 60;
    for (let t = 0; t < 20; t += frame) engine.advance(frame);
    expect(events).toBe(engine.beatCount);
  });

  it("no avisa al reiniciar ni al construir", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    let events = 0;
    engine.onBeatStarted = () => {
      events += 1;
    };
    engine.reset();
    engine.setRhythm(RHYTHMS.pvc);
    expect(events).toBe(0);
  });

  it("deja de avisar cuando se le quita el enganche", () => {
    const engine = new ECGEngine(RHYTHMS.normal);
    let events = 0;
    engine.onBeatStarted = () => {
      events += 1;
    };
    const frame = 1 / 60;
    for (let t = 0; t < 5; t += frame) engine.advance(frame);
    const before = events;

    engine.onBeatStarted = null;
    for (let t = 0; t < 5; t += frame) engine.advance(frame);
    expect(events).toBe(before);
  });
});

describe("lo que se oye en cada ritmo", () => {
  it("los ritmos sinusales suenan todos igual", () => {
    for (const rhythm of [RHYTHMS.normal, RHYTHMS.bradycardia, RHYTHMS.tachycardia]) {
      const events = beatEvents(rhythm);
      expect(events.length).toBeGreaterThan(5);
      expect(events.every((e) => e.conducted)).toBe(true);
      expect(events.every((e) => !e.ventricular)).toBe(true);
    }
  });

  it("en la extrasístole uno de cada siete suena distinto", () => {
    const events = beatEvents(RHYTHMS.pvc, 60);
    const ventricular = events.filter((e) => e.ventricular).length;
    expect(ventricular).toBeGreaterThan(0);
    expect(ventricular / events.length).toBeCloseTo(1 / 7, 1);
    // Todos conducen: la extrasístole late, sólo que mal.
    expect(events.every((e) => e.conducted)).toBe(true);
  });

  it("en el bloqueo se calla uno de cada cuatro", () => {
    const events = beatEvents(RHYTHMS.mobitz1, 60);
    const silent = events.filter((e) => !e.conducted).length;
    expect(silent / events.length).toBeCloseTo(1 / 4, 1);
    expect(events.every((e) => !e.ventricular)).toBe(true);
  });

  it("la fibrilación suena a intervalos, no a morfologías distintas", () => {
    const events = beatEvents(RHYTHMS.atrialFibrillation, 60);
    expect(events.every((e) => e.conducted)).toBe(true);
    expect(events.every((e) => !e.ventricular)).toBe(true);
  });

  it("ningún ritmo produce un tono fuera de los dos previstos", () => {
    for (const id of RHYTHM_IDS) {
      for (const event of beatEvents(RHYTHMS[id], 20)) {
        const tone = toneForBeat(event);
        if (tone === null) continue;
        expect([520, 880]).toContain(tone.frequency);
      }
    }
  });
});

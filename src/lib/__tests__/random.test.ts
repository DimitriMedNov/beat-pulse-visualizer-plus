import { describe, expect, it } from "vitest";

import { hash01, integerBetween, pickFrom } from "@/lib/random";

const semillas = Array.from({ length: 500 }, (_, i) => i);

describe("hash01", () => {
  it("devuelve siempre lo mismo para la misma semilla", () => {
    for (const semilla of semillas) expect(hash01(semilla)).toBe(hash01(semilla));
  });

  it("se queda dentro del intervalo [0, 1)", () => {
    for (const semilla of semillas) {
      const valor = hash01(semilla);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });

  it("reparte semillas consecutivas por todo el intervalo", () => {
    const cubos = new Array(10).fill(0);
    for (const semilla of semillas) cubos[Math.floor(hash01(semilla) * 10)] += 1;
    for (const cuenta of cubos) expect(cuenta).toBeGreaterThan(semillas.length / 30);
  });
});

describe("integerBetween", () => {
  it("nunca se sale del intervalo pedido", () => {
    for (const semilla of semillas) {
      const valor = integerBetween(semilla, 35, 58);
      expect(valor).toBeGreaterThanOrEqual(35);
      expect(valor).toBeLessThanOrEqual(58);
      expect(Number.isInteger(valor)).toBe(true);
    }
  });

  it("alcanza los dos extremos", () => {
    const vistos = new Set(semillas.map((s) => integerBetween(s, 1, 4)));
    expect(vistos).toEqual(new Set([1, 2, 3, 4]));
  });

  it("devuelve el mínimo cuando el intervalo se reduce a un punto", () => {
    expect(integerBetween(7, 60, 60)).toBe(60);
    expect(integerBetween(7, 60, 50)).toBe(60);
  });
});

describe("pickFrom", () => {
  it("siempre elige un elemento de la lista", () => {
    const lista = ["a", "b", "c"] as const;
    for (const semilla of semillas) expect(lista).toContain(pickFrom(lista, semilla));
  });

  it("acaba eligiendo todos", () => {
    const lista = ["a", "b", "c"] as const;
    expect(new Set(semillas.map((s) => pickFrom(lista, s)))).toEqual(new Set(lista));
  });
});

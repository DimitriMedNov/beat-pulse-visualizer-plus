import { describe, expect, it } from "vitest";

import { WINDOW_SECONDS } from "@/lib/ecgEngine";
import {
  gridMetrics,
  isMajor,
  LINES_PER_BIG,
  millisecondsBetween,
  MIN_SMALL_PX,
  rateFromInterval,
  secondsPerPixel,
  SMALL_MV,
  SMALL_SECONDS,
} from "@/lib/ecgGrid";

/** Rango vertical del gráfico, el mismo que usa el lienzo. */
const Y_MIN = -0.7;
const Y_MAX = 1.5;

const metrics = (width: number, height: number) =>
  gridMetrics(width, height, WINDOW_SECONDS, Y_MIN, Y_MAX);

describe("el cuadro del papel de electro", () => {
  it("mide 0,04 s por 0,1 mV, y el grande cinco veces eso", () => {
    expect(SMALL_SECONDS).toBe(0.04);
    expect(SMALL_MV).toBe(0.1);
    expect(SMALL_SECONDS * LINES_PER_BIG).toBeCloseTo(0.2, 10);
    expect(SMALL_MV * LINES_PER_BIG).toBeCloseTo(0.5, 10);
  });

  it("cubre la ventana entera con columnas de cuadro chico", () => {
    const grid = metrics(1000, 300);
    expect(grid.columns).toBe(WINDOW_SECONDS / SMALL_SECONDS);
    expect(grid.columns * grid.smallX).toBeCloseTo(1000, 6);
  });

  it("hace que la línea isoeléctrica sea siempre una de las marcadas", () => {
    const grid = metrics(1000, 300);
    expect(grid.firstRow).toBeLessThanOrEqual(0);
    expect(grid.lastRow).toBeGreaterThanOrEqual(0);
    expect(isMajor(0)).toBe(true);
  });

  it("no se sale del rango vertical", () => {
    const grid = metrics(1000, 300);
    expect(grid.firstRow * SMALL_MV).toBeGreaterThanOrEqual(Y_MIN);
    expect(grid.lastRow * SMALL_MV).toBeLessThanOrEqual(Y_MAX);
  });

  it("marca una línea de cada cinco", () => {
    const marked = Array.from({ length: 20 }, (_, i) => isMajor(i)).filter(Boolean);
    expect(marked).toHaveLength(4);
    expect(isMajor(-5)).toBe(true);
    expect(isMajor(-3)).toBe(false);
  });
});

describe("la rejilla menor se retira cuando no cabe", () => {
  // La trampa de esta fase: en una ventana de 6 s los cuadros de 0,04 s son 150
  // columnas. En un escritorio hay sitio de sobra; en un móvil no, y dibujarlas
  // igual convierte el fondo en una mancha gris.
  it("se dibuja en un lienzo de escritorio", () => {
    const grid = metrics(1050, 300);
    expect(grid.showMinor).toBe(true);
    expect(grid.smallX).toBeGreaterThanOrEqual(MIN_SMALL_PX);
  });

  it("se retira en un lienzo de móvil", () => {
    const grid = metrics(370, 180);
    expect(grid.showMinor).toBe(false);
    expect(grid.smallX).toBeLessThan(MIN_SMALL_PX);
  });

  it("encuentra el umbral donde empieza a caber", () => {
    const threshold = MIN_SMALL_PX * (WINDOW_SECONDS / SMALL_SECONDS);
    expect(metrics(threshold - 1, 300).showMinor).toBe(false);
    expect(metrics(threshold + 1, 300).showMinor).toBe(true);
  });

  it("también la retira si el lienzo es muy bajo, aunque sea ancho", () => {
    expect(metrics(1600, 60).showMinor).toBe(false);
  });

  it("nunca falla con un lienzo de tamaño cero", () => {
    const grid = metrics(0, 0);
    expect(grid.showMinor).toBe(false);
    expect(Number.isFinite(grid.smallX)).toBe(true);
  });
});

describe("el calibrador traduce píxeles a tiempo", () => {
  const ANCHO = 1200;

  it("reparte la ventana entre todos los píxeles", () => {
    expect(secondsPerPixel(ANCHO, WINDOW_SECONDS)).toBeCloseTo(WINDOW_SECONDS / ANCHO, 12);
    expect(secondsPerPixel(ANCHO, WINDOW_SECONDS) * ANCHO).toBeCloseTo(WINDOW_SECONDS, 12);
  });

  it("mide el lienzo entero como la ventana completa", () => {
    expect(millisecondsBetween(0, ANCHO, ANCHO, WINDOW_SECONDS)).toBeCloseTo(
      WINDOW_SECONDS * 1000,
      9,
    );
  });

  it("da el mismo intervalo se arrastre hacia donde se arrastre", () => {
    const derecha = millisecondsBetween(300, 700, ANCHO, WINDOW_SECONDS);
    const izquierda = millisecondsBetween(700, 300, ANCHO, WINDOW_SECONDS);
    expect(derecha).toBe(izquierda);
    expect(derecha).toBeGreaterThan(0);
  });

  it("mide cero cuando las dos marcas coinciden", () => {
    expect(millisecondsBetween(450, 450, ANCHO, WINDOW_SECONDS)).toBe(0);
  });

  it("mide un cuadro grande como 200 ms", () => {
    const unCuadroGrande = (ANCHO / WINDOW_SECONDS) * SMALL_SECONDS * LINES_PER_BIG;
    expect(millisecondsBetween(0, unCuadroGrande, ANCHO, WINDOW_SECONDS)).toBeCloseTo(200, 9);
  });

  it("no revienta con un lienzo de ancho cero", () => {
    expect(secondsPerPixel(0, WINDOW_SECONDS)).toBe(0);
    expect(millisecondsBetween(0, 100, 0, WINDOW_SECONDS)).toBe(0);
  });
});

describe("rateFromInterval", () => {
  it("convierte un R-R en latidos por minuto", () => {
    expect(rateFromInterval(800)).toBeCloseTo(75, 9);
    expect(rateFromInterval(1000)).toBeCloseTo(60, 9);
    expect(rateFromInterval(500)).toBeCloseTo(120, 9);
  });

  it("es coherente con la duración del latido del propio motor", () => {
    for (const bpm of [45, 60, 75, 120, 200]) {
      expect(rateFromInterval(60000 / bpm)).toBeCloseTo(bpm, 9);
    }
  });

  it("devuelve cero si no hay intervalo que medir", () => {
    expect(rateFromInterval(0)).toBe(0);
  });
});

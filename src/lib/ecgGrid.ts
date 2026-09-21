// Geometría del papel de electro. Va aparte del lienzo porque es aritmética
// pura y así se puede probar sin un canvas.

/** El cuadro chico del papel de electro: 0,04 s por 0,1 mV. */
export const SMALL_SECONDS = 0.04;
export const SMALL_MV = 0.1;

/** Cada quinta línea va marcada: el cuadro grande son 0,2 s por 0,5 mV. */
export const LINES_PER_BIG = 5;

/**
 * Ancho mínimo del cuadro chico, en píxeles. Por debajo de esto la rejilla menor
 * se emborrona: en una ventana de 6 s los cuadros de 0,04 s son 150 columnas, que
 * en un móvil de 400 px caen a menos de 3 px y se ven como una mancha gris.
 */
export const MIN_SMALL_PX = 4;

export interface GridMetrics {
  /** Ancho del cuadro chico, en píxeles. */
  smallX: number;
  /** Alto del cuadro chico, en píxeles. */
  smallY: number;
  /** Número de columnas de cuadro chico que caben en la ventana. */
  columns: number;
  /** Primera y última fila, en múltiplos de `SMALL_MV`. La fila 0 es 0 mV. */
  firstRow: number;
  lastRow: number;
  /** Si hay sitio para dibujar la rejilla menor. */
  showMinor: boolean;
}

export function gridMetrics(
  width: number,
  height: number,
  windowSeconds: number,
  yMin: number,
  yMax: number,
): GridMetrics {
  const smallX = (width / windowSeconds) * SMALL_SECONDS;
  const smallY = (height / (yMax - yMin)) * SMALL_MV;

  return {
    smallX,
    smallY,
    columns: Math.round(windowSeconds / SMALL_SECONDS),
    firstRow: Math.ceil(yMin / SMALL_MV),
    lastRow: Math.floor(yMax / SMALL_MV),
    showMinor: smallX >= MIN_SMALL_PX && smallY >= MIN_SMALL_PX,
  };
}

/** Si una línea de índice `i` es de las marcadas. */
export function isMajor(i: number): boolean {
  return i % LINES_PER_BIG === 0;
}

/**
 * Segundos que representa cada píxel horizontal del lienzo. Es la conversión que
 * necesita el calibrador para traducir un arrastre a un intervalo.
 */
export function secondsPerPixel(width: number, windowSeconds: number): number {
  return width > 0 ? windowSeconds / width : 0;
}

/**
 * Milisegundos entre dos posiciones horizontales del lienzo, que es lo que mide
 * el calibrador al arrastrar sobre el trazo, igual que un cardiólogo midiendo
 * sobre el papel. El orden del arrastre da igual: la distancia nunca es negativa.
 */
export function millisecondsBetween(
  from: number,
  to: number,
  width: number,
  windowSeconds: number,
): number {
  return Math.abs(to - from) * secondsPerPixel(width, windowSeconds) * 1000;
}

/**
 * Frecuencia equivalente si el intervalo medido fuese un R-R completo. Medir dos
 * erres seguidas y leer los latidos por minuto es la cuenta que se hace a mano
 * sobre el papel.
 */
export function rateFromInterval(milliseconds: number): number {
  return milliseconds > 0 ? 60000 / milliseconds : 0;
}
